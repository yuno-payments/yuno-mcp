import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { initializeYunoMCP } from "../src/index";

/**
 * Ids from tool arguments go into request paths. Unencoded, an id containing
 * "/", "?" or "#", or a ".." segment, changes which endpoint is called: fetch
 * normalizes the URL, so "../payments/<id>/cancel-or-refund" sent to
 * subscriptionResume (not destructive, so not behind the production
 * confirm_token gate) became POST /v1/payments/<id>/cancel-or-refund.
 */

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function connect(onFetch: (url: URL, init?: RequestInit) => void) {
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    onFetch(new URL(url), init);
    return Promise.resolve(new Response(JSON.stringify({ id: "sub_1" }), { status: 200 }));
  }) as unknown as typeof fetch;
  const result = await initializeYunoMCP({ accountCode: "acct", publicApiKey: "prod_public", privateSecretKey: "secret" });
  if (!result?.yunoMCP) throw new Error("initializeYunoMCP failed");
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
  return client;
}

describe("ids in request paths", () => {
  it("cannot steer a non-destructive tool to another endpoint", async () => {
    const requests: { method?: string; path: string }[] = [];
    const client = await connect((url, init) => requests.push({ method: init?.method, path: url.pathname + url.search }));

    await client.callTool({
      name: "subscriptionResume",
      arguments: { subscription_id: "../payments/pay_1/cancel-or-refund?x=" },
    });

    expect(requests).toEqual([{ method: "POST", path: "/v1/subscriptions/..%2Fpayments%2Fpay_1%2Fcancel-or-refund%3Fx%3D/resume" }]);
  });

  it("keeps the query string of a request whose id contains '#'", async () => {
    const urls: URL[] = [];
    const client = await connect((url) => urls.push(url));

    await client.callTool({ name: "recipientRetrieve", arguments: { recipient_id: "rec#1" } });

    expect(urls).toHaveLength(1);
    expect(urls[0].pathname).toBe("/v1/recipients/rec%231");
    expect(urls[0].searchParams.get("account_id")).toBe("acct");
  });

  it("refuses an id that is a dot segment", async () => {
    const urls: URL[] = [];
    const client = await connect((url) => urls.push(url));

    const result = await client.callTool({ name: "subscriptionResume", arguments: { subscription_id: ".." } });

    expect(result.isError).toBe(true);
    expect(urls).toHaveLength(0);
  });

  it("leaves ordinary ids unchanged", async () => {
    const urls: URL[] = [];
    const client = await connect((url) => urls.push(url));

    await client.callTool({ name: "subscriptionResume", arguments: { subscription_id: "4f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f" } });

    expect(urls[0].pathname).toBe("/v1/subscriptions/4f1c2b8e-1d2a-4c3b-9e8f-0a1b2c3d4e5f/resume");
  });
});
