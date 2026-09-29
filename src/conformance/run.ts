import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ConfigError, resolveConfig, type ConformanceConfig } from "./config";
import { runConformance, type Finding, type McpProbe } from "./checks";
import { checkAuthorizeNeverCaptures } from "./authorize";

/**
 * Repeatable MCP conformance runner (see docs/conformance.md). Connects to a
 * deployed endpoint as an SDK Client over StreamableHTTP and asserts the live
 * contract. Exit codes: 0 conformant, 1 findings, 2 configuration or connection
 * error. A run that checked nothing is reported as a finding, never as a pass.
 */

export type ConnectedProbe = { probe: McpProbe; close(): Promise<void> };
export type Connector = (config: ConformanceConfig) => Promise<ConnectedProbe>;
export type RunnerDeps = {
  connect: Connector;
  authorizeCheck: () => Promise<Finding[]>;
  log: (line: string) => void;
  error: (line: string) => void;
};

export function authHeaders(config: ConformanceConfig): Record<string, string> {
  return {
    "public-api-key": config.publicApiKey,
    "private-secret-key": config.privateSecretKey,
    "x-account-code": config.accountCode,
  };
}

export const connectStreamableHttp: Connector = async (config) => {
  const transport = new StreamableHTTPClientTransport(new URL(config.endpoint), { requestInit: { headers: authHeaders(config) } });
  const client = new Client({ name: "yuno-mcp-conformance", version: "1.0.0" });
  await client.connect(transport);
  return { probe: client as unknown as McpProbe, close: () => client.close() };
};

const defaultDeps: RunnerDeps = {
  connect: connectStreamableHttp,
  authorizeCheck: () => checkAuthorizeNeverCaptures(),
  log: (line) => {
    console.log(line);
  },
  error: (line) => {
    console.error(line);
  },
};

const formatFinding = (finding: Finding): string => `  ✗ [${finding.tool}] ${finding.finding}: ${finding.message}`;
const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export async function main(env: NodeJS.ProcessEnv = process.env, overrides: Partial<RunnerDeps> = {}): Promise<number> {
  const deps = { ...defaultDeps, ...overrides };
  let config: ConformanceConfig;
  try {
    config = resolveConfig(env);
  } catch (error) {
    deps.error(error instanceof ConfigError ? error.message : String(error));
    return 2;
  }

  deps.error(`Running MCP conformance against ${config.endpoint} ...`);
  let findings: Finding[];
  let connected: ConnectedProbe | undefined;
  try {
    connected = await deps.connect(config);
    findings = [...(await runConformance(connected.probe)), ...(await deps.authorizeCheck())];
  } catch (error) {
    deps.error(`Conformance run failed to complete: ${messageOf(error)}`);
    return 2;
  } finally {
    await connected?.close().catch(() => undefined);
  }

  if (findings.length === 0) {
    deps.log(`✓ MCP conformance passed against ${config.endpoint}: 0 findings.`);
    return 0;
  }
  deps.error(`✗ MCP conformance failed against ${config.endpoint}: ${String(findings.length)} finding(s).`);
  for (const finding of findings) deps.error(formatFinding(finding));
  return 1;
}
