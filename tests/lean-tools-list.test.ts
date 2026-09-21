import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { leanJsonSchema } from "../src/schemas/lean-json-schema";
import { initializeYunoMCP } from "../src/index";

describe("leanJsonSchema", () => {
  it("folds a nullable union into a type array", () => {
    expect(leanJsonSchema({ anyOf: [{ type: "string" }, { type: "null" }] })).toEqual({ type: ["string", "null"] });
  });

  it("keeps the constraints of the non-null member", () => {
    expect(leanJsonSchema({ anyOf: [{ type: "string", minLength: 3, maxLength: 5 }, { type: "null" }] })).toEqual({
      type: ["string", "null"],
      minLength: 3,
      maxLength: 5,
    });
  });

  it("prefers a description sitting on the union itself", () => {
    expect(
      leanJsonSchema({ description: "outer", anyOf: [{ type: "string", description: "inner" }, { type: "null" }] }),
    ).toEqual({ type: ["string", "null"], description: "outer" });
  });

  it("leaves a real union alone", () => {
    const real = { anyOf: [{ type: "string" }, { type: "number" }] };
    expect(leanJsonSchema(real)).toEqual(real);
  });

  it("leaves a union of three alone, even when one member is null", () => {
    const three = { anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }] };
    expect(leanJsonSchema(three)).toEqual(three);
  });

  it("does not fold when the non-null member carries its own combinator", () => {
    const nested = { anyOf: [{ anyOf: [{ type: "string" }, { type: "number" }] }, { type: "null" }] };
    expect(leanJsonSchema(nested)).toEqual(nested);
  });

  it("does not fold an object member, which has no bare type to hoist", () => {
    const obj = { anyOf: [{ type: "object", properties: { a: { type: "string" } } }, { type: "null" }] };
    expect(leanJsonSchema(obj)).toEqual({ type: ["object", "null"], properties: { a: { type: "string" } } });
  });

  it("drops a union whose other member is empty, since that already accepts null", () => {
    expect(leanJsonSchema({ description: "d", anyOf: [{}, { type: "null" }] })).toEqual({ description: "d" });
  });

  it("drops the outer null when the member is already nullable", () => {
    expect(
      leanJsonSchema({ anyOf: [{ type: ["object", "null"], additionalProperties: {} }, { type: "null" }] }),
    ).toEqual({ type: ["object", "null"], additionalProperties: {} });
  });

  it("strips $schema at every level", () => {
    expect(leanJsonSchema({ $schema: "x", properties: { a: { $schema: "y", type: "string" } } })).toEqual({
      properties: { a: { type: "string" } },
    });
  });

  it("recurses through arrays and leaves primitives alone", () => {
    expect(leanJsonSchema({ items: [{ anyOf: [{ type: "number" }, { type: "null" }] }, 1, "a", null] })).toEqual({
      items: [{ type: ["number", "null"] }, 1, "a", null],
    });
  });

  it("does not mutate its input", () => {
    const input = { anyOf: [{ type: "string" }, { type: "null" }] };
    leanJsonSchema(input);
    expect(input).toEqual({ anyOf: [{ type: "string" }, { type: "null" }] });
  });
});

describe("a live tools/list", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function listTools() {
    globalThis.fetch = (() => Promise.resolve(new Response("{}", { status: 200 }))) as unknown as typeof fetch;
    const result = await initializeYunoMCP({ accountCode: "acct", publicApiKey: "staging_key", privateSecretKey: "s" });
    if (!result?.yunoMCP) throw new Error("initializeYunoMCP failed");
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
    return client.listTools();
  }

  /**
   * The wrapper in src/index.ts reaches past the SDK's public surface to find the
   * handler it replaces. These four assertions are what make that safe: if a
   * future SDK version moves the handler, they fail instead of the payload
   * quietly growing back to its old size.
   */
  it("serves no $schema and no nullable anyOf", async () => {
    const raw = JSON.stringify(await listTools());
    expect(raw).not.toContain('"$schema"');
    expect(raw).not.toContain('{"type":"null"}');
  });

  it("serves the describeTool pointer once per tool, not once per collapsed field", async () => {
    const listed = await listTools();
    const raw = JSON.stringify(listed);
    const mentions = raw.split("describeTool for the full schema").length - 1;
    expect(mentions).toBe(listed.tools.length);
    expect(raw).not.toContain("full field list");
  });

  it("still advertises a nullable field as accepting null", async () => {
    const listed = await listTools();
    const schema = listed.tools.find((tool) => tool.name === "checkoutSessionCreate")?.inputSchema as {
      properties: Record<string, { type?: unknown }>;
    };
    expect(schema.properties.callback_url.type).toEqual(["string", "null"]);
  });

  it("stays within the payload budget", async () => {
    /** Measured at 117,243 bytes when written, down from 152,386. */
    const BUDGET_BYTES = 122_000;
    const bytes = JSON.stringify(await listTools()).length;
    console.log(`live tools/list: ${bytes} bytes (~${Math.round(bytes / 4)} tokens), budget ${BUDGET_BYTES}`);
    expect(bytes).toBeLessThan(BUDGET_BYTES);
  });
});
