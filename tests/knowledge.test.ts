import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { findGuidance, formatGuidance } from "../src/knowledge/decline-codes";
import { initializeYunoMCP } from "../src/index";

describe("findGuidance", () => {
  it("matches sub_status on declined payment bodies", () => {
    const hit = findGuidance({ id: "p1", status: "DECLINED", sub_status: "INSUFFICIENT_FUNDS" });
    expect(hit?.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("matches transactions.response_code (transactions is an object, not an array)", () => {
    const hit = findGuidance({ status: "DECLINED", sub_status: "UNMAPPED", transactions: { response_code: "DO_NOT_HONOR" } });
    expect(hit?.code).toBe("DO_NOT_HONOR");
  });

  it("matches error-shaped bodies via code", () => {
    expect(findGuidance({ code: "INVALID_AMOUNT", messages: ["..."] })?.code).toBe("INVALID_AMOUNT");
  });

  it("returns undefined for unknown codes and non-objects", () => {
    expect(findGuidance({ sub_status: "APPROVED" })).toBeUndefined();
    expect(findGuidance("INSUFFICIENT_FUNDS")).toBeUndefined();
    expect(findGuidance(null)).toBeUndefined();
    expect(findGuidance([{ sub_status: "INSUFFICIENT_FUNDS" }])).toBeUndefined();
  });

  it("formats guidance with a retry stance", () => {
    const hit = findGuidance({ sub_status: "STOLEN_CARD" });
    expect(hit).toBeDefined();
    if (hit) {
      const text = formatGuidance(hit);
      expect(text).toContain("STOLEN_CARD");
      expect(text).toContain("NOT be retried");
    }
  });
});

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function connectedClient(): Promise<Client> {
  const result = await initializeYunoMCP({
    accountCode: "acct",
    publicApiKey: "staging_key",
    privateSecretKey: "test-secret",
  });
  if (!result?.yunoMCP) {
    throw new Error("initializeYunoMCP failed");
  }
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
  return client;
}

function stubFetch(body: unknown, status: number): void {
  globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify(body), { status }))) as typeof fetch;
}

describe("guidance in tool responses", () => {
  it("appends guidance after the raw body for a declined payment (HTTP 200)", async () => {
    const declined = { id: "p1", status: "DECLINED", sub_status: "INSUFFICIENT_FUNDS", amount: { currency: "BRL", value: 10 } };
    stubFetch(declined, 200);
    const client = await connectedClient();

    const result = await client.callTool({ name: "paymentRetrieve", arguments: { payment_id: "123e4567-e89b-12d3-a456-426614174000" } });
    const texts = (result.content as { type: string; text?: string }[]).filter((entry) => entry.type === "text");

    expect(result.isError).toBeFalsy();
    // Raw response entry is untouched; guidance is a separate appended entry.
    expect(texts[0].text).toContain('"sub_status": "INSUFFICIENT_FUNDS"');
    expect(texts.at(-1)?.text).toContain("Guidance for INSUFFICIENT_FUNDS");
    expect(result.structuredContent).toEqual(declined);
  });

  it("appends guidance on HTTP 4xx error bodies and keeps isError", async () => {
    stubFetch({ code: "INVALID_AMOUNT", messages: ["amount must be positive"] }, 400);
    const client = await connectedClient();

    const result = await client.callTool({ name: "paymentRetrieve", arguments: { payment_id: "123e4567-e89b-12d3-a456-426614174000" } });
    const texts = (result.content as { type: string; text?: string }[]).filter((entry) => entry.type === "text");

    expect(result.isError).toBe(true);
    expect(texts.at(-1)?.text).toContain("Guidance for INVALID_AMOUNT");
  });

  it("appends nothing for approved payments", async () => {
    stubFetch({ id: "p1", status: "SUCCEEDED", sub_status: "APPROVED" }, 200);
    const client = await connectedClient();

    const result = await client.callTool({ name: "paymentRetrieve", arguments: { payment_id: "123e4567-e89b-12d3-a456-426614174000" } });
    const texts = (result.content as { type: string; text?: string }[]).filter((entry) => entry.type === "text");

    expect(texts.some((entry) => entry.text?.startsWith("Guidance for"))).toBe(false);
  });
});
