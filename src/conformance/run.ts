import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ConfigError, resolveConfig, type ConformanceConfig } from "./config";
import { runConformance, type Finding, type McpProbe } from "./checks";

/**
 * Repeatable MCP conformance runner (see docs/conformance.md).
 *
 * Connects to a deployed MCP endpoint as a real SDK Client over StreamableHTTP,
 * reads the live tools/list, and asserts the contract that the conformance review
 * of 2026-09-20 found no automated check could catch. Read-only: it never invokes
 * a destructive tool with arguments that could execute. Exits non-zero on any
 * violation; each printed line names the tool and the finding it corresponds to.
 */

/** TLS 1.2+ only for cardholder-data transport (PCI-DSS req 4.1): plain http is refused. */
function assertSecureEndpoint(endpoint: string): void {
  if (!/^https:\/\//i.test(endpoint)) {
    throw new ConfigError(`Refusing insecure endpoint ${endpoint}: MCP conformance must run over HTTPS (PCI-DSS req 4.1).`);
  }
}

export function buildClientAndTransport(config: ConformanceConfig): {
  client: Client;
  transport: StreamableHTTPClientTransport;
} {
  const transport = new StreamableHTTPClientTransport(new URL(config.endpoint), {
    requestInit: {
      headers: {
        "public-api-key": config.publicApiKey,
        "private-secret-key": config.privateSecretKey,
        "x-account-code": config.accountCode,
      },
    },
  });
  const client = new Client({ name: "yuno-mcp-conformance", version: "1.0.0" });
  return { client, transport };
}

const formatFinding = (finding: Finding): string => `  ✗ [${finding.tool}] ${finding.finding}: ${finding.message}`;

export async function main(env: NodeJS.ProcessEnv = process.env): Promise<number> {
  let config: ConformanceConfig;
  try {
    config = resolveConfig(env);
    assertSecureEndpoint(config.endpoint);
  } catch (error) {
    console.error(error instanceof ConfigError ? error.message : String(error));
    return 2;
  }

  console.error(`Running MCP conformance against ${config.endpoint} ...`);
  const { client, transport } = buildClientAndTransport(config);

  let findings: Finding[];
  try {
    await client.connect(transport);
    findings = await runConformance(client as unknown as McpProbe);
  } catch (error) {
    console.error(`Conformance run failed to complete: ${error instanceof Error ? error.message : String(error)}`);
    await client.close().catch(() => undefined);
    return 2;
  }
  await client.close().catch(() => undefined);

  if (findings.length === 0) {
    console.log(`✓ MCP conformance passed against ${config.endpoint}: 0 findings.`);
    return 0;
  }

  console.error(`✗ MCP conformance failed against ${config.endpoint}: ${String(findings.length)} finding(s).`);
  for (const finding of findings) console.error(formatFinding(finding));
  return 1;
}

const invokedDirectly = import.meta.url === `file://${process.argv[1]}`;
if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      console.error(String(error));
      process.exit(2);
    });
}
