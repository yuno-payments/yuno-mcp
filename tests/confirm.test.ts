import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { canonicalJson, issueConfirmToken, verifyConfirmToken } from "../src/confirm";
import { initializeYunoMCP } from "../src/index";
import { tools } from "../src/tools";

const SECRET = "yuno-mcp-confirm-v1:test-secret";
const SUBSCRIPTION_ID = "123e4567-e89b-12d3-a456-426614174000";

describe("canonicalJson", () => {
  it("is stable under key order permutations", () => {
    expect(canonicalJson({ b: 1, a: { d: [1, 2], c: "x" } })).toBe(canonicalJson({ a: { c: "x", d: [1, 2] }, b: 1 }));
  });

  it("drops undefined-valued keys like JSON.stringify", () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe(canonicalJson({ a: 1 }));
  });
});

describe("confirm tokens", () => {
  it("round-trips for identical method and params", () => {
    const token = issueConfirmToken(SECRET, "paymentRefund", { paymentId: "p1" });
    expect(verifyConfirmToken(SECRET, "paymentRefund", { paymentId: "p1" }, token)).toBe(true);
  });

  it("rejects expired tokens", () => {
    const token = issueConfirmToken(SECRET, "paymentRefund", { paymentId: "p1" }, -1);
    expect(verifyConfirmToken(SECRET, "paymentRefund", { paymentId: "p1" }, token)).toBe(false);
  });

  it("rejects tampered params, other methods, other secrets, and garbage", () => {
    const token = issueConfirmToken(SECRET, "paymentRefund", { paymentId: "p1" });
    expect(verifyConfirmToken(SECRET, "paymentRefund", { paymentId: "p2" }, token)).toBe(false);
    expect(verifyConfirmToken(SECRET, "paymentCancel", { paymentId: "p1" }, token)).toBe(false);
    expect(verifyConfirmToken("other-secret", "paymentRefund", { paymentId: "p1" }, token)).toBe(false);
    expect(verifyConfirmToken(SECRET, "paymentRefund", { paymentId: "p1" }, "junk")).toBe(false);
    expect(verifyConfirmToken(SECRET, "paymentRefund", { paymentId: "p1" }, "123.abc")).toBe(false);
  });
});

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function stubFetch(): { calls: number } {
  const state = { calls: 0 };
  globalThis.fetch = (() => {
    state.calls += 1;
    return Promise.resolve(new Response(JSON.stringify({ id: SUBSCRIPTION_ID, status: "CANCELLED" }), { status: 200 }));
  }) as typeof fetch;
  return state;
}

async function connectedClient(publicApiKey: string, mode?: "read-only" | "full"): Promise<Client> {
  const result = await initializeYunoMCP({
    accountCode: "acct",
    publicApiKey,
    privateSecretKey: "test-secret",
    mode,
  });
  if (!result?.yunoMCP) {
    throw new Error("initializeYunoMCP failed");
  }
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
  return client;
}

describe("server mode", () => {
  it("read-only registers only retrieval tools plus describeTool", async () => {
    const client = await connectedClient("staging_key", "read-only");
    const listed = await client.listTools();
    const readOnlyCount = tools.filter((tool) => tool.annotations.readOnlyHint === true).length;

    expect(listed.tools.length).toBe(readOnlyCount + 1);
    expect(listed.tools.some((tool) => tool.name === "describeTool")).toBe(true);
    expect(listed.tools.some((tool) => tool.name === "paymentRefund")).toBe(false);
  });

  it("full mode registers every tool plus describeTool", async () => {
    const client = await connectedClient("staging_key");
    const listed = await client.listTools();
    expect(listed.tools.length).toBe(tools.length + 1);
  });
});

describe("destructive-op confirmation on prod", () => {
  it("previews without executing, then executes with the echoed token", async () => {
    const fetchState = stubFetch();
    const client = await connectedClient("prod_key");

    const preview = await client.callTool({ name: "subscriptionCancel", arguments: { subscriptionId: SUBSCRIPTION_ID } });
    expect(preview.isError).toBeFalsy();
    expect(fetchState.calls).toBe(0);
    const structured = preview.structuredContent as { confirmation_required: boolean; confirm_token: string };
    expect(structured.confirmation_required).toBe(true);
    expect(structured.confirm_token.length).toBeGreaterThan(10);

    const confirmed = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: SUBSCRIPTION_ID, confirm_token: structured.confirm_token },
    });
    expect(confirmed.isError).toBeFalsy();
    expect(fetchState.calls).toBe(1);
  });

  it("rejects an invalid token without executing", async () => {
    const fetchState = stubFetch();
    const client = await connectedClient("prod_key");

    const result = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: SUBSCRIPTION_ID, confirm_token: "123.deadbeef" },
    });
    expect(result.isError).toBe(true);
    expect(fetchState.calls).toBe(0);
  });

  it("rejects a token issued for different arguments", async () => {
    const fetchState = stubFetch();
    const client = await connectedClient("prod_key");

    const preview = await client.callTool({ name: "subscriptionCancel", arguments: { subscriptionId: SUBSCRIPTION_ID } });
    const structured = preview.structuredContent as { confirm_token: string };
    const otherId = "999e4567-e89b-12d3-a456-426614174999";
    const result = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: otherId, confirm_token: structured.confirm_token },
    });
    expect(result.isError).toBe(true);
    expect(fetchState.calls).toBe(0);
  });

  it("does not gate non-prod environments", async () => {
    const fetchState = stubFetch();
    const client = await connectedClient("staging_key");

    const result = await client.callTool({ name: "subscriptionCancel", arguments: { subscriptionId: SUBSCRIPTION_ID } });
    expect(result.isError).toBeFalsy();
    expect(fetchState.calls).toBe(1);
  });
});
