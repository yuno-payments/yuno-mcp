import { expect, it, describe, afterEach } from "@rstest/core";
import z from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { compactSchema, HEAVY_KEYS } from "../src/schemas/compact";
import { tools } from "../src/tools";
import { describeTool } from "../src/tools/describe";
import { initializeYunoMCP } from "../src/index";
import type { Tool } from "../src/types";

/**
 * The schema a client actually sees is not `tool.schema` — it is that schema run
 * through compactSchema at registration (src/index.ts:49-67). Every other test in
 * this suite calls handlers directly with a mock client, so nothing else here
 * looks at the advertised surface. That gap is how `required[]` silently emptied
 * on 25 of the 38 tools. These tests watch the surface itself.
 */

const ALL_TOOLS: Tool[] = [...tools, describeTool];

function advertisedInputSchema(tool: Tool) {
  const compacted = compactSchema(tool.schema, { maxDepth: 3, heavyKeys: HEAVY_KEYS });
  return z.toJSONSchema(compacted, { io: "input", unrepresentable: "any" }) as {
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

function strictRequired(tool: Tool): string[] {
  const json = z.toJSONSchema(tool.schema, { io: "input", unrepresentable: "any" }) as { required?: string[] };
  return (json.required ?? []).sort();
}

describe("advertised input schemas", () => {
  it.each(ALL_TOOLS.map((tool) => [tool.method, tool] as const))(
    "%s advertises exactly the required keys its handler enforces",
    (_method, tool) => {
      expect((advertisedInputSchema(tool).required ?? []).sort()).toEqual(strictRequired(tool));
    },
  );

  it("advertises no camelCase parameter anywhere — snake_case is the only spelling", () => {
    const camel = ALL_TOOLS.flatMap((tool) =>
      Object.keys(advertisedInputSchema(tool).properties ?? {})
        .filter((key) => /[A-Z]/.test(key))
        .map((key) => `${tool.method}.${key}`),
    );
    expect(camel).toEqual([]);
  });

  it("declares every top-level key in the source schemas as snake_case too", () => {
    const camel = ALL_TOOLS.flatMap((tool) =>
      Object.keys(tool.schema.shape)
        .filter((key) => /[A-Z]/.test(key))
        .map((key) => `${tool.method}.${key}`),
    );
    expect(camel).toEqual([]);
  });
});

describe("tools/list payload budget", () => {
  /**
   * A ceiling, not a target. `tools/list` is paid by every client on connect
   * before it can do any work, so growth here should be a deliberate decision.
   * Measured at 152,222 bytes when this test was written; raise it only with a
   * reason in the PR description. Note outputSchema is ~45% of it — that, not the
   * parameter list, is where the next real reduction has to come from.
   */
  const BUDGET_BYTES = 160_000;

  it("serializes under the budget", () => {
    let bytes = 0;
    for (const tool of ALL_TOOLS) {
      const outputSchema = tool.outputSchema
        ? compactSchema(tool.outputSchema, { maxDepth: 2, heavyKeys: HEAVY_KEYS, partialTopLevel: true })
        : undefined;
      bytes += JSON.stringify({
        name: tool.method,
        title: tool.annotations.title,
        description: tool.description,
        annotations: tool.annotations,
        inputSchema: advertisedInputSchema(tool),
        outputSchema: outputSchema ? z.toJSONSchema(outputSchema, { io: "input", unrepresentable: "any" }) : undefined,
      }).length;
    }
    console.log(`tools/list payload: ${bytes} bytes (~${Math.round(bytes / 4)} tokens), budget ${BUDGET_BYTES}`);
    expect(bytes).toBeLessThan(BUDGET_BYTES);
  });
});

const textFrom = (result: unknown): string => {
  const content = ((result as { content?: unknown }).content ?? []) as { type?: string; text?: string }[];
  return content.find((item) => item.type === "text")?.text ?? "";
};

describe("the advertised schema through the MCP SDK", () => {
  const PAYMENT_ID = "p".repeat(36);
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function connectedClient(): Promise<{ client: Client; bodies: () => unknown[] }> {
    const bodies: unknown[] = [];
    globalThis.fetch = ((_url: string, init?: { body?: string }) => {
      bodies.push(init?.body ? JSON.parse(init.body) : undefined);
      return Promise.resolve(new Response(JSON.stringify({ id: PAYMENT_ID }), { status: 200 }));
    }) as unknown as typeof fetch;
    const result = await initializeYunoMCP({ accountCode: "acct", publicApiKey: "staging_key", privateSecretKey: "test-secret" });
    if (!result?.yunoMCP) throw new Error("initializeYunoMCP failed");
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
    return { client, bodies: () => bodies };
  }

  it("serves required[] and snake_case-only properties over a real tools/list", async () => {
    const { client } = await connectedClient();
    const listed = await client.listTools();
    const schema = listed.tools.find((tool) => tool.name === "paymentRetrieve")?.inputSchema as {
      properties: Record<string, unknown>;
      required?: string[];
    };
    expect(schema.required).toEqual(["payment_id"]);
    expect(Object.keys(schema.properties)).toEqual(["payment_id"]);
  });

  it("reaches the API when the caller uses the declared spelling", async () => {
    const { client, bodies } = await connectedClient();
    const result = await client.callTool({
      name: "customerCreate",
      arguments: { merchant_customer_id: "mc-valid-1", first_name: "Ada" },
    });
    expect(result.isError).toBeFalsy();
    expect(bodies()[0]).toEqual({ merchant_customer_id: "mc-valid-1", first_name: "Ada" });
  });

  it("names the canonical key when a required parameter is spelled camelCase", async () => {
    const { client, bodies } = await connectedClient();
    const result = await client.callTool({ name: "paymentRetrieve", arguments: { paymentId: PAYMENT_ID } });
    expect(result.isError).toBe(true);
    expect(textFrom(result)).toContain("payment_id");
    expect(bodies()).toEqual([]);
  });

  it("still reports the declared key when no parameter is sent", async () => {
    const { client, bodies } = await connectedClient();
    const result = await client.callTool({ name: "paymentRetrieve", arguments: {} });
    expect(result.isError).toBe(true);
    expect(textFrom(result)).toContain("payment_id");
    expect(bodies()).toEqual([]);
  });

  /**
   * The one sharp edge of dropping the aliases, pinned here so it is a known
   * behaviour rather than a surprise: the SDK strips undeclared keys before the
   * handler runs, so a camelCase *optional* parameter is dropped silently instead
   * of being rejected. Required parameters fail loudly (test above); optional ones
   * just do not arrive.
   */
  it("silently drops a camelCase optional parameter rather than rejecting it", async () => {
    const { client, bodies } = await connectedClient();
    const result = await client.callTool({
      name: "customerCreate",
      arguments: { merchant_customer_id: "mc-valid-1", firstName: "Ada" },
    });
    expect(result.isError).toBeFalsy();
    expect(bodies()[0]).toEqual({ merchant_customer_id: "mc-valid-1" });
  });
});
