import { expect, it, describe } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { initializeYunoMCP } from "../src/index";
import { resolveConfig, ConfigError, DEFAULT_ENDPOINT, isNonProdHost } from "../src/conformance/config";
import { main, authHeaders } from "../src/conformance/run";
import { checkAuthorizeNeverCaptures, inProcessAuthorizeHarness, type AuthorizeHarness } from "../src/conformance/authorize";
import {
  runConformance,
  runChecks,
  collectSurface,
  checkSomethingWasProbed,
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
  type McpProbe,
  type ListedTool,
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

  it("refuses a key with no recognised non-production prefix", () => {
    expect(() => resolveConfig({ ...base, YUNO_PUBLIC_API_KEY: "live_pub" })).toThrow(ConfigError);
  });

  it("refuses the production endpoint unless overridden", () => {
    expect(() => resolveConfig({ ...base, YUNO_MCP_ENDPOINT: "https://api.y.uno/mcp" })).toThrow(ConfigError);
  });

  it("refuses any host not explicitly marked non-production", () => {
    for (const endpoint of ["https://mcp.y.uno/mcp", "https://api.y.uno.evil.com/mcp", "https://internal-prod.y.uno/mcp", "https://mystaging.example.com/mcp"]) {
      expect(() => resolveConfig({ ...base, YUNO_MCP_ENDPOINT: endpoint }), endpoint).toThrow(ConfigError);
    }
    for (const endpoint of ["https://api-staging.y.uno/mcp", "https://api-sandbox.y.uno/mcp", "https://mcp.dev.y.uno/mcp", "https://internal-stg.y.uno/mcp"]) {
      expect(isNonProdHost(endpoint), endpoint).toBe(true);
    }
  });

  it("refuses a non-https endpoint even with the prod override", () => {
    expect(() => resolveConfig({ ...base, YUNO_MCP_ENDPOINT: "http://api-staging.y.uno/mcp", CONFORMANCE_ALLOW_PROD: "true" })).toThrow(ConfigError);
  });

  it("requires the credentials it needs", () => {
    expect(() => resolveConfig({ YUNO_PUBLIC_API_KEY: "staging_pub" } as NodeJS.ProcessEnv)).toThrow(ConfigError);
  });

  it("sends the credentials under the header names YunoClient uses for the Yuno API", () => {
    const headers = authHeaders(resolveConfig({ ...base }));
    expect(headers["public-api-key"]).toBe("staging_pub");
    expect(headers["private-secret-key"]).toBe("sec");
    expect(headers["x-account-code"]).toBe("acct");
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
  it("passes through the real paymentAuthorize tool and restores fetch afterwards", async () => {
    const realFetch = globalThis.fetch;
    expect(await checkAuthorizeNeverCaptures()).toEqual([]);
    expect(globalThis.fetch).toBe(realFetch);
  });

  it("records the outgoing request with capture=false for a wallet", async () => {
    const harness = await inProcessAuthorizeHarness();
    try {
      await harness.callAuthorize({
        payment: {
          description: "d",
          country: "CO",
          merchant_order_id: "o",
          amount: { currency: "COP", value: 1 },
          workflow: "DIRECT",
          payment_method: { type: "GOOGLE_PAY", token: "t" },
        },
      });
      const body = harness.sent[0]?.body as { payment_method: { detail: { wallet: { capture: boolean } } } };
      expect(body.payment_method.detail.wallet.capture).toBe(false);
    } finally {
      await harness.close();
    }
  });

  const fakeHarness = (transform: (payment: Record<string, unknown>) => Record<string, unknown> | undefined): (() => Promise<AuthorizeHarness>) => {
    return () => {
      const sent: AuthorizeHarness["sent"] = [];
      return Promise.resolve({
        sent,
        callAuthorize: (args) => {
          const body = transform(args.payment as Record<string, unknown>);
          if (body) sent.push({ url: "https://api-staging.y.uno/v1/payments", method: "POST", body });
          return Promise.resolve({ isError: body === undefined, content: [{ type: "text", text: "ok" }] });
        },
        close: () => Promise.resolve(),
      });
    };
  };

  it("fails naming paymentAuthorize when the capture flag is not set (reverted fix)", async () => {
    const findings = await checkAuthorizeNeverCaptures(fakeHarness((payment) => payment));
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.tool === "paymentAuthorize")).toBe(true);
    expect(findings.some((f) => f.finding === "authorize-would-capture")).toBe(true);
  });

  it("fails naming paymentAuthorize when an unsupported type is sent instead of refused", async () => {
    const holdEverything = (payment: Record<string, unknown>) => ({
      ...payment,
      payment_method: { detail: { card: { capture: false }, wallet: { capture: false } } },
    });
    const findings = await checkAuthorizeNeverCaptures(fakeHarness(holdEverything));
    expect(findings.map((f) => f.finding)).toEqual(["authorize-unsupported-not-refused"]);
  });
});

describe("probes never call a mutating tool", () => {
  it("sends tools/call only to read-only tools and describeTool against the live server", async () => {
    const client = await connectLiveServer();
    const called: string[] = [];
    const recording: McpProbe = {
      listTools: () => client.listTools() as Promise<{ tools: ListedTool[] }>,
      callTool: (args) => {
        called.push(args.name);
        return client.callTool(args) as Promise<{ isError?: boolean }>;
      },
    };
    try {
      const surface = await collectSurface(recording);
      const readOnly = new Set(surface.tools.filter((tool) => tool.annotations?.readOnlyHint === true).map((tool) => tool.name));
      expect(called.length).toBeGreaterThan(0);
      expect(called.filter((name) => !readOnly.has(name))).toEqual([]);
      expect(called).not.toContain("paymentRefund");
      expect(called).not.toContain("paymentCreate");
    } finally {
      await client.close();
      globalThis.fetch = originalFetch;
    }
  });

  it("does not call a mutating tool even when the server would silently strip unknown keys", async () => {
    const called: string[] = [];
    const tools: ListedTool[] = [
      { name: "paymentRefund", annotations: { readOnlyHint: false, destructiveHint: true }, inputSchema: { type: "object", properties: { idempotency_key: {} } } },
      { name: "customerCreate", annotations: { readOnlyHint: false }, inputSchema: { type: "object", properties: { first_name: {} } } },
      { name: "paymentRetrieve", annotations: { readOnlyHint: true }, inputSchema: { type: "object", properties: { payment_id: {} }, required: ["payment_id"] } },
    ];
    const stripping: McpProbe = {
      listTools: () => Promise.resolve({ tools }),
      callTool: (args) => {
        called.push(args.name);
        return Promise.resolve({ isError: false, content: [] });
      },
    };
    const surface = await collectSurface(stripping);
    expect(called).toEqual(["paymentRetrieve", "paymentRetrieve"]);
    const findings = runChecks(surface);
    expect(findings.some((f) => f.tool === "paymentRefund" && f.finding === "unknown-parameter-not-forbidden")).toBe(true);
    expect(findings.some((f) => f.tool === "paymentRetrieve" && f.finding === "unknown-parameter-silently-accepted")).toBe(true);
  });
});

describe("a run that checks nothing never passes", () => {
  it("reports a finding when tools/list is empty", () => {
    expect(checkSomethingWasProbed(emptySurface()).map((f) => f.finding)).toEqual(["no-tools-advertised"]);
  });

  it("reports a finding when no read-only tool was probed", () => {
    const surface = emptySurface({ tools: [{ name: "paymentCreate", annotations: { readOnlyHint: false } }] });
    expect(checkSomethingWasProbed(surface).map((f) => f.finding)).toEqual(["no-tools-probed"]);
  });

  it("exits non-zero when the endpoint advertises zero tools", async () => {
    const lines: string[] = [];
    const code = await main(
      { YUNO_PUBLIC_API_KEY: "staging_pub", YUNO_PRIVATE_SECRET_KEY: "sec", YUNO_ACCOUNT_CODE: "acct" } as NodeJS.ProcessEnv,
      {
        connect: () =>
          Promise.resolve({
            probe: { listTools: () => Promise.resolve({ tools: [] }), callTool: () => Promise.resolve({}) },
            close: () => Promise.resolve(),
          }),
        authorizeCheck: () => Promise.resolve([]),
        log: (line) => lines.push(line),
        error: (line) => lines.push(line),
      },
    );
    expect(code).toBe(1);
    expect(lines.join("\n")).toContain("no-tools-advertised");
  });

  it("exits 0 only after checking a conformant live server", async () => {
    const client = await connectLiveServer();
    try {
      const code = await main(
        { YUNO_PUBLIC_API_KEY: "staging_pub", YUNO_PRIVATE_SECRET_KEY: "sec", YUNO_ACCOUNT_CODE: "acct" } as NodeJS.ProcessEnv,
        { connect: () => Promise.resolve({ probe: client as unknown as McpProbe, close: () => Promise.resolve() }), log: () => undefined, error: () => undefined },
      );
      expect(code).toBe(0);
    } finally {
      await client.close();
      globalThis.fetch = originalFetch;
    }
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

  it("fails naming a mutating tool whose advertised required[] is emptier than the schema its handler validates with", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRefund", annotations: { destructiveHint: true }, inputSchema: { type: "object", properties: { payment_id: {} }, required: [] } }],
      described: new Map([["paymentRefund", { method: "paymentRefund", inputSchema: { type: "object", properties: { payment_id: {} }, required: ["payment_id"] } }]]),
    });
    const findings = checkRequiredMatchesEnforcement(surface);
    expect(findings).toHaveLength(1);
    expect(findings[0].tool).toBe("paymentRefund");
    expect(findings[0].finding).toBe("empty-required-but-enforced");
  });
});

describe("camelCase aliases on mutating tools", () => {
  it("fails naming the tool when a camelCase alias is re-added to the advertised schema", () => {
    const surface = emptySurface({
      tools: [
        {
          name: "paymentCancel",
          annotations: { destructiveHint: true },
          inputSchema: { type: "object", properties: { idempotency_key: {}, idempotencyKey: {} }, additionalProperties: false },
        },
      ],
    });
    const findings = checkUnknownParameterRefused(surface);
    expect(findings).toHaveLength(1);
    expect(findings[0].tool).toBe("paymentCancel");
    expect(findings[0].finding).toBe("camelcase-alias-advertised");
    expect(findings[0].message).toContain("idempotencyKey");
  });
});

describe("unknown parameter refusal", () => {
  it("fails naming the tool when a camelCase alias is silently accepted (reverted fix)", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: {} }, additionalProperties: false } }],
      unknownParamProbe: new Map([["paymentRetrieve", { isError: false, content: [] }]]),
    });
    const findings = checkUnknownParameterRefused(surface);
    expect(findings).toHaveLength(1);
    expect(findings[0].tool).toBe("paymentRetrieve");
    expect(findings[0].finding).toBe("unknown-parameter-silently-accepted");
  });

  it("fails when the refusal never names the snake_case spelling", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: {} }, additionalProperties: false } }],
      unknownParamProbe: new Map([["paymentRetrieve", { isError: true, content: [{ type: "text", text: "unknown key" }] }]]),
    });
    const findings = checkUnknownParameterRefused(surface);
    expect(findings[0].finding).toBe("unknown-parameter-no-hint");
  });

  it("passes when the refusal names the canonical key", () => {
    const surface = emptySurface({
      tools: [{ name: "paymentRetrieve", inputSchema: { type: "object", properties: { payment_id: {} }, additionalProperties: false } }],
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
    });
    const findings: Finding[] = runChecks(surface);
    const categories = new Set(findings.map((f) => f.finding));
    expect(categories.has("tool-name-not-callable")).toBe(true);
    expect(categories.has("array-type-shorthand")).toBe(true);
  });
});
