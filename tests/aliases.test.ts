import { expect, it, describe, afterEach } from "@rstest/core";
import z from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { normalizeParamKeys, withTwinKeys } from "../src/tools/aliases";
import { paymentRetrieveTool } from "../src/tools/payments";
import { customerRetrieveTool } from "../src/tools/customers";
import { initializeYunoMCP } from "../src/index";

describe("normalizeParamKeys", () => {
  it("fills a snake_case key from its camelCase twin, and the reverse", () => {
    expect(normalizeParamKeys(paymentRetrieveTool.schema, { paymentId: "x" })).toEqual({ payment_id: "x" });
    expect(normalizeParamKeys(customerRetrieveTool.schema, { customer_id: "x" })).toEqual({ customerId: "x" });
  });

  it("never overrides a key the caller spelled as declared, and drops the twin", () => {
    const schema = z.object({ payment_id: z.string() });
    expect(normalizeParamKeys(schema, { payment_id: "declared", paymentId: "twin" })).toEqual({ payment_id: "declared" });
  });

  it("leaves unknown keys and nested objects alone", () => {
    const schema = z.object({ body: z.object({ merchant_reference: z.string() }) });
    const params = { body: { merchantReference: "r" }, extra: 1 };
    expect(normalizeParamKeys(schema, params)).toEqual(params);
  });

  it("passes non-objects through", () => {
    expect(normalizeParamKeys(paymentRetrieveTool.schema, null)).toBeNull();
    expect(normalizeParamKeys(paymentRetrieveTool.schema, undefined)).toBeUndefined();
  });
});

describe("withTwinKeys", () => {
  it("advertises the twin as optional and relaxes the declared key", () => {
    const shape = withTwinKeys({ payment_id: z.string().describe("id"), body: z.object({}) });
    expect(Object.keys(shape).sort()).toEqual(["body", "paymentId", "payment_id"]);
    expect(z.object(shape).safeParse({ paymentId: "x", body: {} }).success).toBe(true);
    expect(z.object(shape).safeParse({ payment_id: "x", body: {} }).success).toBe(true);
    expect(z.object(shape).safeParse({ paymentId: "x" }).success).toBe(false);
    expect(shape.paymentId.description).toBe("Alias of payment_id");
  });

  it("does not invent a twin when both spellings are already declared", () => {
    const shape = withTwinKeys({ payment_id: z.string(), paymentId: z.string() });
    expect(z.object(shape).safeParse({ paymentId: "x" }).success).toBe(false);
  });
});

describe("twin keys through the MCP SDK", () => {
  const PAYMENT_ID = "p".repeat(36);
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  async function connectedClient(): Promise<{ client: Client; calls: () => number }> {
    let calls = 0;
    globalThis.fetch = (() => {
      calls += 1;
      return Promise.resolve(new Response(JSON.stringify({ id: PAYMENT_ID }), { status: 200 }));
    }) as typeof fetch;
    const result = await initializeYunoMCP({ accountCode: "acct", publicApiKey: "staging_key", privateSecretKey: "test-secret" });
    if (!result?.yunoMCP) throw new Error("initializeYunoMCP failed");
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
    return { client, calls: () => calls };
  }

  it("lists the twin next to the declared key", async () => {
    const { client } = await connectedClient();
    const listed = await client.listTools();
    const schema = listed.tools.find((tool) => tool.name === "paymentRetrieve")?.inputSchema as { properties: Record<string, unknown> };
    expect(Object.keys(schema.properties)).toEqual(expect.arrayContaining(["payment_id", "paymentId"]));
  });

  it("reaches the API when the caller uses the twin spelling", async () => {
    const { client, calls } = await connectedClient();
    const result = await client.callTool({ name: "paymentRetrieve", arguments: { paymentId: PAYMENT_ID } });
    expect(result.isError).toBeFalsy();
    expect(calls()).toBe(1);
  });

  it("still reports the declared key when neither spelling is sent", async () => {
    const { client, calls } = await connectedClient();
    const result = await client.callTool({ name: "paymentRetrieve", arguments: {} });
    expect(result.isError).toBe(true);
    const text = result.content.find((item) => item.type === "text")?.text ?? "";
    expect(text).toContain("payment_id");
    expect(calls()).toBe(0);
  });
});
