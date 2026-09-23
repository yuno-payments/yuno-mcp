import { expect, it, describe } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { initializeYunoMCP } from "../src/index";
import { resolveConfig, ConfigError, DEFAULT_ENDPOINT } from "../src/conformance/config";
import { main } from "../src/conformance/run";
import {
  runConformance,
  runChecks,
  collectSurface,
  checkAuthorizeNeverCaptures,
  checkNoArrayTypeShorthand,
  checkLeanAcceptsNull,
  checkRequiredMatchesEnforcement,
  checkUnknownParameterRefused,
  checkToolNamesAccepted,
  checkDescriptionsPreserved,
  checkDescribeToolCoverageAndExamples,
  acceptsNull,
  parseAvailableTools,
  type LiveSurface,
  type Finding,
} from "../src/conformance/checks";

/**
 * The conformance runner drives a live client/server pair — the same surface a
 * deployed endpoint exposes — and asserts the contract from the 2026-09-20 review.
 * A green server reports 0 findings; reverting any one merged fix makes exactly
 * one check fail, naming the tool.
 */

const PAYMENT_ID = "p".repeat(36);
const originalFetch = globalThis.fetch;

async function connectLiveServer(): Promise<Client> {
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify({ id: PAYMENT_ID }), { status: 200 }))) as unknown as typeof fetch;
  const result = await initializeYunoMCP({ accountCode: "acct", publicApiKey: "staging_key", privateSecretKey: "secret" });
  if (!result?.yunoMCP) throw new Error("initializeYunoMCP failed");
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "conformance-test", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
  return client;
}

describe("resolveConfig guardrails", () => {
  const base = {
    YUNO_PUBLIC_API_KEY: "staging_pub",
    YUNO_PRIVATE_SECRET_KEY: "sec",
    YUNO_ACCOUNT_CODE: "acct",
  } as NodeJS.ProcessEnv;

  it("defaults to a non-production endpoint", () => {
    expect(resolveConfig({ ...base }).endpoint).toBe(DEFAULT_ENDPOINT);
    expect(DEFAULT_ENDPOINT).not.toContain("//api.y.uno");
  });

  it("refuses a prod_ public-api-key unless CONFORMANCE_ALLOW_PROD is set", () => {
    expect(() => resolveConfig({ ...base, YUNO_PUBLIC_API_KEY: "prod_pub" })).toThrow(ConfigError);
    expect(resolveConfig({ ...base, YUNO_PUBLIC_API_KEY: "prod_pub", CONFORMANCE_ALLOW_PROD: "true" }).allowProd).toBe(true);
  });

  it("refuses the production endpoint unless overridden", () => {
    expect(() => resolveConfig({ ...base, YUNO_MCP_ENDPOINT: "https://api.y.uno/mcp" })).toThrow(ConfigError);
  });

  it("requires the credentials it needs", () => {
    expect(() => resolveConfig({ YUNO_PUBLIC_API_KEY: "staging_pub" } as NodeJS.ProcessEnv)).toThrow(ConfigError);
  });
});

describe("conformance run against a healthy server", () => {
  it("reports 0 findings over a live tools/list", async () => {
    const client = await connectLiveServer();
    try {
      const findings = await runConformance(client);
      expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
    } finally {
      await client.close();
      globalThis.fetch = originalFetch;
    }
  });

  it("advertises every tool name and each is callable", async () => {
    const client = await connectLiveServer();
    try {
      const surface = await collectSurface(client);
      expect(checkToolNamesAccepted(surface)).toEqual([]);
      expect(surface.tools.length).toBeGreaterThan(30);
    } finally {
      await client.close();
      globalThis.fetch = originalFetch;
    }
  });
});

describe("paymentAuthorize never captures", () => {
  it("passes for the shipped transform", () => {
    expect(checkAuthorizeNeverCaptures()).toEqual([]);
  });

  it("fails naming paymentAuthorize when the capture flag is not set (regression of the fix)", () => {
    const brokenTransform = (payment: unknown) => payment; // never sets capture=false
    const findings = checkAuthorizeNeverCaptures(brokenTransform);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.tool === "paymentAuthorize")).toBe(true);
    expect(findings[0].message).toContain("capture");
  });

  it("fails naming paymentAuthorize when an unsupported type is not refused", () => {
    const permissive = (payment: unknown) => {
      const detail = (payment as { payment_method?: { detail?: Record<string, unknown> } }).payment_method?.detail ?? {};
      return { payment_method: { detail: { card: { capture: false }, wallet: { capture: false }, ...detail } } };
    };
    const findings = checkAuthorizeNeverCaptures(permissive);
    expect(findings.some((f) => f.finding === "authorize-unsupported-not-refused")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Synthetic surfaces exercise each finding, including the "reverted fix" cases
// that cannot be produced from the (fixed) live server.
// ---------------------------------------------------------------------------

function emptySurface(overrides: Partial<LiveSurface> = {}): LiveSurface {
  return {
    tools: [],
    toolsByName: new Map(),
    nameAccepted: new Map(),
    unknownParamProbe: new Map(),
    missingArgProbe: new Map(),
    describeAvailable: [],
    described: new Map(),
    ...overrides,
  };
}

describe("acceptsNull", () => {
  it("recognizes the anyOf/null long form, the array shorthand and empty schemas", () => {
    expect(acceptsNull({ anyOf: [{ type: "string" }, { type: "null" }] })).toBe(true);
    expect(acceptsNull({ type: ["string", "null"] })).toBe(true);
    expect(acceptsNull({})).toBe(true);
    expect(acceptsNull({ type: "string" })).toBe(false);
  });
});

describe("array-form type shorthand", () => {
  it("passes when no schema uses it", () => {
    const surface = emptySurface({
      tools: [{ name: "t", inputSchema: { type: "object", properties: { a: { anyOf: [{ type: "string" }, { type: "null" }] } } } }],
    });
    expect(checkNoArrayTypeShorthand(surface)).toEqual([]);
  });

  it("fails naming the tool when the fold to array-form is reverted", () => {
    const surface = emptySurface({
      tools: [{ name: "customerCreate", inputSchema: { type: "object", properties: { a: { type: ["string", "null"] } } } }],
    });
    const findings = checkNoArrayTypeShorthand(surface);
    expect(findings).toHaveLength(1);
    expect(findings[0].tool).toBe("customerCreate");
    expect(findings[0].finding).toBe("array-type-shorthand");
  });
});

describe("lean schema accepts null wherever the full schema does", () => {
  it("fails naming the tool when the lean form drops null acceptance", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentCreate", inputSchema: { type: "object", properties: { x: { type: "string" } } } }],
      described: new Map([
        [
          "paymentCreate",
          { method: "paymentCreate", inputSchema: { type: "object", properties: { x: { anyOf: [{ type: "string" }, { type: "null" }] } } } },
        ],
      ]),
    });
    const findings = checkLeanAcceptsNull(surface);
    expect(findings).toHaveLength(1);
    expect(findings[0].tool).toBe("paymentCreate");
    expect(findings[0].finding).toBe("lean-rejects-null");
  });
});

describe("required[] matches enforcement", () => {
  it("fails when a tool advertises empty required[] but rejects a missing argument", () => {
    const surface = emptySurface({
      tools: [{ name: "customerCreate", inputSchema: { type: "object", properties: { first_name: {} }, required: [] } }],
      missingArgProbe: new Map([["customerCreate", { isError: true, content: [{ type: "text", text: "Validation error" }] }]]),
    });
    const findings = checkRequiredMatchesEnforcement(surface);
    expect(findings).toHaveLength(1);
    expect(findings[0].finding).toBe("empty-required-but-enforced");
    expect(findings[0].tool).toBe("customerCreate");
  });

  it("passes when required[] and enforcement agree", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: {} }, required: ["payment_id"] } }],
      missingArgProbe: new Map([["paymentRetrieve", { isError: true, content: [{ type: "text", text: "payment_id required" }] }]]),
    });
    expect(checkRequiredMatchesEnforcement(surface)).toEqual([]);
  });
});

describe("unknown parameter refusal", () => {
  it("fails naming the tool when a camelCase alias is silently accepted (reverted fix)", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: {} } } }],
      unknownParamProbe: new Map([["paymentRetrieve", { isError: false, content: [] }]]),
    });
    const findings = checkUnknownParameterRefused(surface);
    expect(findings).toHaveLength(1);
    expect(findings[0].tool).toBe("paymentRetrieve");
    expect(findings[0].finding).toBe("unknown-parameter-silently-accepted");
  });

  it("fails when the refusal never names the snake_case spelling", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: {} } } }],
      unknownParamProbe: new Map([["paymentRetrieve", { isError: true, content: [{ type: "text", text: "unknown key" }] }]]),
    });
    const findings = checkUnknownParameterRefused(surface);
    expect(findings[0].finding).toBe("unknown-parameter-no-hint");
  });

  it("passes when the refusal names the canonical key", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: {} } } }],
      unknownParamProbe: new Map([
        ["paymentRetrieve", { isError: true, content: [{ type: "text", text: "Unknown parameter paymentId (did you mean payment_id?)" }] }],
      ]),
    });
    expect(checkUnknownParameterRefused(surface)).toEqual([]);
  });
});

describe("tool name accepted", () => {
  it("fails naming the tool when tools/call rejects an advertised name", () => {
    const surface = emptySurface({
      tools: [{ name: "ghostTool" }],
      nameAccepted: new Map([["ghostTool", false]]),
    });
    const findings = checkToolNamesAccepted(surface);
    expect(findings[0].tool).toBe("ghostTool");
    expect(findings[0].finding).toBe("tool-name-not-callable");
  });
});

describe("descriptions preserved", () => {
  it("fails naming the tool when a described parameter loses its description in tools/list", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: {} } } }],
      described: new Map([
        ["paymentRetrieve", { method: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: { description: "The id" } } } }],
      ]),
    });
    const findings = checkDescriptionsPreserved(surface);
    expect(findings[0].tool).toBe("paymentRetrieve");
    expect(findings[0].finding).toBe("description-dropped");
  });
});

describe("describeTool coverage and examples", () => {
  it("parses the available-tools list", () => {
    expect(parseAvailableTools('Unknown tool "x". Available tools: a, b, describeTool')).toEqual(["a", "b", "describeTool"]);
  });

  it("fails when a worked example does not validate against its own schema", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentCreate" }],
      describeAvailable: ["paymentCreate"],
      described: new Map([
        [
          "paymentCreate",
          {
            method: "paymentCreate",
            inputSchema: { type: "object", properties: { amount: { type: "number" } }, required: ["amount"] },
            example: { note: "no amount" },
          },
        ],
      ]),
    });
    const findings = checkDescribeToolCoverageAndExamples(surface);
    expect(findings.some((f) => f.tool === "paymentCreate" && f.finding === "describe-example-invalid")).toBe(true);
  });

  it("fails when an advertised tool is not describable", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentCreate" }, { name: "describeTool" }],
      describeAvailable: [],
    });
    const findings = checkDescribeToolCoverageAndExamples(surface);
    expect(findings.some((f) => f.tool === "paymentCreate" && f.finding === "describe-missing-tool")).toBe(true);
  });
});

describe("main entrypoint", () => {
  it("exits 2 and refuses production credentials by default without connecting", async () => {
    const code = await main({
      YUNO_PUBLIC_API_KEY: "prod_pub",
      YUNO_PRIVATE_SECRET_KEY: "sec",
      YUNO_ACCOUNT_CODE: "acct",
    } as NodeJS.ProcessEnv);
    expect(code).toBe(2);
  });

  it("exits 2 when required credentials are missing", async () => {
    const code = await main({ YUNO_PUBLIC_API_KEY: "staging_pub" } as NodeJS.ProcessEnv);
    expect(code).toBe(2);
  });

  it("exits 2 for a non-https endpoint", async () => {
    const code = await main({
      YUNO_PUBLIC_API_KEY: "staging_pub",
      YUNO_PRIVATE_SECRET_KEY: "sec",
      YUNO_ACCOUNT_CODE: "acct",
      YUNO_MCP_ENDPOINT: "http://api-staging.y.uno/mcp",
    } as NodeJS.ProcessEnv);
    expect(code).toBe(2);
  });
});

describe("runChecks aggregates every check", () => {
  it("returns findings from more than one category at once", () => {
    const surface = emptySurface({
      tools: [{ name: "ghostTool", inputSchema: { type: "object", properties: { x: { type: ["string", "null"] } } } }],
      nameAccepted: new Map([["ghostTool", false]]),
      unknownParamProbe: new Map([["ghostTool", { isError: false }]]),
      missingArgProbe: new Map([["ghostTool", undefined]]),
    });
    const findings: Finding[] = runChecks(surface);
    const categories = new Set(findings.map((f) => f.finding));
    expect(categories.has("tool-name-not-callable")).toBe(true);
    expect(categories.has("array-type-shorthand")).toBe(true);
  });
});
