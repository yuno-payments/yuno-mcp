import { expect, it, describe, afterEach } from "@rstest/core";
import z from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { tools } from "../src/tools";
import { describeTool } from "../src/tools/describe";
import { initializeYunoMCP } from "../src/index";
import type { Tool } from "../src/types";

/**
 * The schema a client actually sees is not `tool.schema` — it is that schema run
 * through compactSchema and the SDK's own zod-to-JSON-Schema conversion at
 * registration. Every other test in this suite calls handlers directly with a mock
 * client, so nothing else here looks at the advertised surface. That gap is how
 * `required[]` silently emptied on 25 of the 38 tools. These tests read the surface
 * from a live tools/list, never from a reconstruction of it.
 */

const ALL_TOOLS: Tool[] = [...tools, describeTool];
const PAYMENT_ID = "p".repeat(36);
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function connectedClient(
  respond: () => Response = () => new Response(JSON.stringify({ id: PAYMENT_ID }), { status: 200 }),
): Promise<{ client: Client; bodies: () => unknown[]; headers: () => Record<string, string>[] }> {
  const bodies: unknown[] = [];
  const headers: Record<string, string>[] = [];
  globalThis.fetch = ((_url: string, init?: { body?: string; headers?: Record<string, string> }) => {
    bodies.push(init?.body ? JSON.parse(init.body) : undefined);
    headers.push(init?.headers ?? {});
    return Promise.resolve(respond());
  }) as unknown as typeof fetch;
  const result = await initializeYunoMCP({ accountCode: "acct", publicApiKey: "staging_key", privateSecretKey: "test-secret" });
  if (!result?.yunoMCP) throw new Error("initializeYunoMCP failed");
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
  return { client, bodies: () => bodies, headers: () => headers };
}

type ListedSchema = { properties?: Record<string, unknown>; required?: string[]; additionalProperties?: unknown };

let listed: Promise<Map<string, ListedSchema>> | undefined;

/** The input schemas exactly as a client receives them from tools/list. */
function listedInputSchemas(): Promise<Map<string, ListedSchema>> {
  listed ??= connectedClient()
    .then(({ client }) => client.listTools())
    .then((result) => new Map(result.tools.map((tool) => [tool.name, tool.inputSchema as ListedSchema])));
  return listed;
}

function strictRequired(tool: Tool): string[] {
  const json = z.toJSONSchema(tool.schema, { io: "input", unrepresentable: "any" }) as { required?: string[] };
  return (json.required ?? []).sort();
}

describe("advertised input schemas", () => {
  it("lists every tool", async () => {
    const schemas = await listedInputSchemas();
    expect([...schemas.keys()].sort()).toEqual(ALL_TOOLS.map((tool) => tool.method).sort());
  });

  it.each(ALL_TOOLS.map((tool) => [tool.method, tool] as const))(
    "%s advertises exactly the required keys its handler enforces",
    async (method, tool) => {
      const schema = (await listedInputSchemas()).get(method);
      expect((schema?.required ?? []).sort()).toEqual(strictRequired(tool));
    },
  );

  it("advertises no camelCase parameter anywhere — snake_case is the only spelling", async () => {
    const camel = [...(await listedInputSchemas())].flatMap(([method, schema]) =>
      Object.keys(schema.properties ?? {})
        .filter((key) => /[A-Z]/.test(key))
        .map((key) => `${method}.${key}`),
    );
    expect(camel).toEqual([]);
  });

  it("tells clients that no other top-level parameter is accepted", async () => {
    const open = [...(await listedInputSchemas())]
      .filter(([, schema]) => schema.additionalProperties !== false)
      .map(([method]) => method);
    expect(open).toEqual([]);
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
   * Measured over a live tools/list at 153,623 bytes when this test was written;
   * raise it only with a reason in the PR description. Note outputSchema is ~45%
   * of it — that, not the parameter list, is where the next real reduction has to
   * come from.
   */
  const BUDGET_BYTES = 160_000;

  it("serializes under the budget", async () => {
    const { client } = await connectedClient();
    const bytes = Buffer.byteLength(JSON.stringify(await client.listTools()));
    console.log(`tools/list payload: ${bytes} bytes (~${Math.round(bytes / 4)} tokens), budget ${BUDGET_BYTES}`);
    expect(bytes).toBeLessThan(BUDGET_BYTES);
  });
});

const textFrom = (result: unknown): string => {
  const content = ((result as { content?: unknown }).content ?? []) as { type?: string; text?: string }[];
  return content.find((item) => item.type === "text")?.text ?? "";
};

describe("the advertised schema through the MCP SDK", () => {
  it("serves required[] and snake_case-only properties over a real tools/list", async () => {
    const schema = (await listedInputSchemas()).get("paymentRetrieve");
    expect(schema?.required).toEqual(["payment_id"]);
    expect(Object.keys(schema?.properties ?? {})).toEqual(["payment_id"]);
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
   * A raw shape registers in strip mode, so the SDK used to drop an undeclared key
   * before the handler ran: a camelCase *optional* parameter simply did not arrive.
   * Registration is strict now, so it is rejected and names the right spelling.
   */
  it("rejects a camelCase optional parameter and names the snake_case spelling", async () => {
    const { client, bodies } = await connectedClient();
    const result = await client.callTool({
      name: "customerCreate",
      arguments: { merchant_customer_id: "mc-valid-1", firstName: "Ada" },
    });
    expect(result.isError).toBe(true);
    expect(textFrom(result)).toContain("firstName (did you mean first_name?)");
    expect(bodies()).toEqual([]);
  });

  /**
   * The case that made the silent drop dangerous: `idempotencyKey` was stripped, a
   * fresh random key went out instead, and a retry charged or refunded twice.
   */
  it("never sends a refund when idempotencyKey is misspelled", async () => {
    const { client, bodies } = await connectedClient();
    const result = await client.callTool({
      name: "paymentCancelOrRefund",
      arguments: {
        payment_id: PAYMENT_ID,
        body: { merchant_reference: "ref-1", reason: "DUPLICATE" },
        idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
      },
    });
    expect(result.isError).toBe(true);
    expect(textFrom(result)).toContain("idempotencyKey (did you mean idempotency_key?)");
    expect(bodies()).toEqual([]);
  });

  it("forwards idempotency_key when it is spelled as declared", async () => {
    const KEY = "550e8400-e29b-41d4-a716-446655440000";
    const { client, headers } = await connectedClient();
    const result = await client.callTool({
      name: "paymentCancelOrRefund",
      arguments: { payment_id: PAYMENT_ID, body: { merchant_reference: "ref-1", reason: "DUPLICATE" }, idempotency_key: KEY },
    });
    expect(result.isError).toBeFalsy();
    expect(headers()[0]["x-idempotency-key"]).toBe(KEY);
  });

  it("returns a no-content delete as a success, not an output validation error", async () => {
    const { client } = await connectedClient(() => new Response(null, { status: 204 }));
    const result = await client.callTool({ name: "recipientDelete", arguments: { recipient_id: "r".repeat(36) } });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({});
    expect(textFrom(result)).toBe("(empty response body)");
  });
});
