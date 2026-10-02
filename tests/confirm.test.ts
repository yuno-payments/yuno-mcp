import { expect, it, describe, afterEach, rstest } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { canonicalJson, confirmTokenAccountChanged, issueConfirmToken, verifyConfirmToken } from "../src/confirm";
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
    const token = issueConfirmToken(SECRET, { method: "paymentRefund", params: { payment_id: "p1" } });
    expect(verifyConfirmToken(SECRET, { method: "paymentRefund", params: { payment_id: "p1" } }, token)).toBe(true);
  });

  it("rejects expired tokens", () => {
    const token = issueConfirmToken(SECRET, { method: "paymentRefund", params: { payment_id: "p1" } }, -1);
    expect(verifyConfirmToken(SECRET, { method: "paymentRefund", params: { payment_id: "p1" } }, token)).toBe(false);
  });

  it("rejects tampered params, other methods, other secrets, and garbage", () => {
    const token = issueConfirmToken(SECRET, { method: "paymentRefund", params: { payment_id: "p1" } });
    expect(verifyConfirmToken(SECRET, { method: "paymentRefund", params: { payment_id: "p2" } }, token)).toBe(false);
    expect(verifyConfirmToken(SECRET, { method: "paymentCancel", params: { payment_id: "p1" } }, token)).toBe(false);
    expect(verifyConfirmToken("other-secret", { method: "paymentRefund", params: { payment_id: "p1" } }, token)).toBe(false);
    expect(verifyConfirmToken(SECRET, { method: "paymentRefund", params: { payment_id: "p1" } }, "junk")).toBe(false);
    expect(verifyConfirmToken(SECRET, { method: "paymentRefund", params: { payment_id: "p1" } }, "123.abc")).toBe(false);
  });

  it("binds an account when given one, and tells a changed account apart", () => {
    const params = { recipient_id: "r1" };
    const token = issueConfirmToken(SECRET, { method: "recipientDelete", params, binding: { account: "acct-a" } });
    expect(verifyConfirmToken(SECRET, { method: "recipientDelete", params, binding: { account: "acct-a" } }, token)).toBe(true);
    expect(verifyConfirmToken(SECRET, { method: "recipientDelete", params, binding: { account: "acct-b" } }, token)).toBe(false);
    expect(verifyConfirmToken(SECRET, { method: "recipientDelete", params, binding: { account: null } }, token)).toBe(false);
    expect(confirmTokenAccountChanged(SECRET, token, { account: "acct-a" })).toBe(false);
    expect(confirmTokenAccountChanged(SECRET, token, { account: "acct-b" })).toBe(true);
  });

  /**
   * Token values issued by 6ee2240, before the signatures were grouped into a subject.
   * A token in flight across a deploy has to keep verifying, so the signed string and
   * the token format are pinned, not only round-tripped.
   */
  it("still issues and verifies tokens byte-identical to the previous release", () => {
    const now = rstest.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
    try {
      const pinned = [
        [
          { method: "subscriptionCancel", params: { subscription_id: "s1" } },
          "1800000300000.010df987af9be1c0af88ec2d8a858aab43b3337b5d79dc0be574ac30cc547345",
        ],
        [
          { method: "recipientDelete", params: { recipient_id: "r1" }, binding: { account: "acct-a" } },
          "1800000300000.af5e6ba15d94ef5c0fe5e4cff9a7af2f1a02e39265ab13b8909e67f4eec6b885.4ff474af4b030567",
        ],
        [
          { method: "recipientDelete", params: { recipient_id: "r1" }, binding: { account: null } },
          "1800000300000.0a4c8adb3c2ae38c69ef560d0267e173b7d77bbeff6d8aade775eaede863bded.282b78f2598ddc28",
        ],
      ] as const;
      for (const [subject, token] of pinned) {
        expect(issueConfirmToken("pin-secret", subject)).toBe(token);
        expect(verifyConfirmToken("pin-secret", subject, token)).toBe(true);
      }
    } finally {
      now.mockRestore();
    }
  });

  it("never accepts a bound token without a binding, or an unbound one with", () => {
    const params = { recipient_id: "r1" };
    const bound = issueConfirmToken(SECRET, { method: "recipientDelete", params, binding: { account: "acct-a" } });
    const unbound = issueConfirmToken(SECRET, { method: "recipientDelete", params });
    expect(verifyConfirmToken(SECRET, { method: "recipientDelete", params }, bound)).toBe(false);
    expect(verifyConfirmToken(SECRET, { method: "recipientDelete", params, binding: { account: "acct-a" } }, unbound)).toBe(false);
    expect(confirmTokenAccountChanged(SECRET, unbound, { account: "acct-a" })).toBe(false);
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
  it("read-only registers only retrieval tools plus accountContext and describeTool", async () => {
    const client = await connectedClient("staging_key", "read-only");
    const listed = await client.listTools();
    const readOnlyCount = tools.filter((tool) => tool.annotations.readOnlyHint === true).length;

    expect(listed.tools.length).toBe(readOnlyCount + 2);
    expect(listed.tools.some((tool) => tool.name === "describeTool")).toBe(true);
    expect(listed.tools.some((tool) => tool.name === "paymentRefund")).toBe(false);
  });

  it("full mode registers every tool plus accountContext and describeTool", async () => {
    const client = await connectedClient("staging_key");
    const listed = await client.listTools();
    expect(listed.tools.length).toBe(tools.length + 2);
  });
});

describe("destructive-op confirmation on prod", () => {
  it("previews without executing, then executes with the echoed token", async () => {
    const fetchState = stubFetch();
    const client = await connectedClient("prod_key");

    const preview = await client.callTool({ name: "subscriptionCancel", arguments: { subscription_id: SUBSCRIPTION_ID } });
    expect(preview.isError).toBeFalsy();
    expect(fetchState.calls).toBe(0);
    const structured = preview.structuredContent as { confirmation_required: boolean; confirm_token: string };
    expect(structured.confirmation_required).toBe(true);
    expect(structured.confirm_token.length).toBeGreaterThan(10);

    const confirmed = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscription_id: SUBSCRIPTION_ID, confirm_token: structured.confirm_token },
    });
    expect(confirmed.isError).toBeFalsy();
    expect(fetchState.calls).toBe(1);
  });

  it("rejects an invalid token without executing", async () => {
    const fetchState = stubFetch();
    const client = await connectedClient("prod_key");

    const result = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscription_id: SUBSCRIPTION_ID, confirm_token: "123.deadbeef" },
    });
    expect(result.isError).toBe(true);
    expect(fetchState.calls).toBe(0);
  });

  it("rejects a token issued for different arguments", async () => {
    const fetchState = stubFetch();
    const client = await connectedClient("prod_key");

    const preview = await client.callTool({ name: "subscriptionCancel", arguments: { subscription_id: SUBSCRIPTION_ID } });
    const structured = preview.structuredContent as { confirm_token: string };
    const otherId = "999e4567-e89b-12d3-a456-426614174999";
    const result = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscription_id: otherId, confirm_token: structured.confirm_token },
    });
    expect(result.isError).toBe(true);
    expect(fetchState.calls).toBe(0);
  });

  it("does not gate non-prod environments", async () => {
    const fetchState = stubFetch();
    const client = await connectedClient("staging_key");

    const result = await client.callTool({ name: "subscriptionCancel", arguments: { subscription_id: SUBSCRIPTION_ID } });
    expect(result.isError).toBeFalsy();
    expect(fetchState.calls).toBe(1);
  });
});
