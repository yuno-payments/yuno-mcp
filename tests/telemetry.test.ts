import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { initializeYunoMCP, type ToolCallEvent } from "../src/index";

const SUBSCRIPTION_ID = "123e4567-e89b-12d3-a456-426614174000";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

/** Stub the Yuno API with a given status so the upstream_error branch is reachable. */
function stubFetch(status = 200, body: unknown = { id: SUBSCRIPTION_ID, status: "CANCELLED" }) {
  globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify(body), { status }))) as typeof fetch;
}

async function connectedClient(
  publicApiKey: string,
  onToolCall?: (event: ToolCallEvent) => void,
): Promise<Client> {
  const result = await initializeYunoMCP({
    accountCode: "acct",
    publicApiKey,
    privateSecretKey: "test-secret",
    onToolCall,
  });
  if (!result?.yunoMCP) {
    throw new Error("initializeYunoMCP failed");
  }
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
  return client;
}

/** Collects events so each test can assert on the outcome sequence. */
function collector() {
  const events: ToolCallEvent[] = [];
  return { events, onToolCall: (e: ToolCallEvent) => void events.push(e) };
}

describe("onToolCall — outcomes", () => {
  it("reports ok for a successful call", async () => {
    stubFetch(200);
    const { events, onToolCall } = collector();
    const client = await connectedClient("staging_key", onToolCall);

    await client.callTool({ name: "subscriptionCancel", arguments: { subscriptionId: SUBSCRIPTION_ID } });

    expect(events).toHaveLength(1);
    expect(events[0].outcome).toBe("ok");
    expect(events[0].tool).toBe("subscriptionCancel");
    expect(events[0].upstreamStatus).toBe(200);
    expect(events[0].environment).toBe("staging");
    expect(events[0].mode).toBe("full");
    expect(events[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("reports upstream_error when the Yuno API returns 5xx — the failure HTTP 200 hides", async () => {
    stubFetch(503, { error: "upstream down" });
    const { events, onToolCall } = collector();
    const client = await connectedClient("staging_key", onToolCall);

    const result = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: SUBSCRIPTION_ID },
    });

    expect(result.isError).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0].outcome).toBe("upstream_error");
    expect(events[0].upstreamStatus).toBe(503);
  });

  it("reports upstream_error for a 4xx as well, with the status preserved", async () => {
    stubFetch(422, { error: "unprocessable" });
    const { events, onToolCall } = collector();
    const client = await connectedClient("staging_key", onToolCall);

    await client.callTool({ name: "subscriptionCancel", arguments: { subscriptionId: SUBSCRIPTION_ID } });

    expect(events[0].outcome).toBe("upstream_error");
    expect(events[0].upstreamStatus).toBe(422);
  });

  // Registration advertises compacted schemas (src/schemas/compact.ts), and HEAVY_KEYS
  // collapse `additional_data` internals to `unknown`. The SDK therefore accepts a
  // malformed additional_data, and the handler's strict re-validation is what catches it.
  // This is the defence-in-depth path the strict safeParse exists for.
  it("reports validation_error when strict re-validation catches what the compacted schema let through", async () => {
    stubFetch(200);
    const { events, onToolCall } = collector();
    const client = await connectedClient("staging_key", onToolCall);

    const result = await client.callTool({
      name: "paymentCreate",
      arguments: {
        payment: {
          description: "d",
          country: "US",
          merchant_order_id: "o1",
          amount: { currency: "USD", value: 100 },
          workflow: "DIRECT",
          payment_method: { type: "CARD" },
          additional_data: { airline: { ticket_number: 12345, legs: "not-an-array" } },
        },
      },
    });

    expect(result.isError).toBe(true);
    expect(events).toHaveLength(1);
    expect(events[0].outcome).toBe("validation_error");
    expect(events[0].upstreamStatus).toBeUndefined();
  });

  // Documents a real limit of this hook: arguments that fail the *registered* schema are
  // rejected by the SDK with JSON-RPC -32602 before the handler runs, so no event is
  // emitted. A host that wants a complete "bad arguments" signal has to count -32602
  // responses at its own layer — the hook alone will under-report them.
  it("does not fire when the SDK rejects arguments at the protocol layer", async () => {
    stubFetch(200);
    const { events, onToolCall } = collector();
    const client = await connectedClient("staging_key", onToolCall);

    const result = await client.callTool({
      name: "paymentCreate",
      arguments: {
        payment: {
          description: "d",
          country: "US",
          merchant_order_id: "o1",
          amount: { currency: 12345, value: "not-a-number" },
          workflow: "DIRECT",
          payment_method: { type: "CARD" },
        },
      },
    });

    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain("-32602");
    expect(events).toHaveLength(0);
  });

  it("reports confirm_required for the prod destructive-op preview", async () => {
    stubFetch(200);
    const { events, onToolCall } = collector();
    const client = await connectedClient("prod_key", onToolCall);

    await client.callTool({ name: "subscriptionCancel", arguments: { subscriptionId: SUBSCRIPTION_ID } });

    expect(events).toHaveLength(1);
    expect(events[0].outcome).toBe("confirm_required");
    expect(events[0].environment).toBe("prod");
  });

  it("reports confirm_invalid separately from validation_error", async () => {
    stubFetch(200);
    const { events, onToolCall } = collector();
    const client = await connectedClient("prod_key", onToolCall);

    await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: SUBSCRIPTION_ID, confirm_token: "123.deadbeef" },
    });

    expect(events[0].outcome).toBe("confirm_invalid");
  });

  it("emits one event per call across a preview-then-execute sequence", async () => {
    stubFetch(200);
    const { events, onToolCall } = collector();
    const client = await connectedClient("prod_key", onToolCall);

    const preview = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: SUBSCRIPTION_ID },
    });
    const { confirm_token } = preview.structuredContent as { confirm_token: string };
    await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: SUBSCRIPTION_ID, confirm_token },
    });

    expect(events.map((e) => e.outcome)).toEqual(["confirm_required", "ok"]);
  });
});

describe("onToolCall — safety", () => {
  it("a throwing callback never breaks the tool call", async () => {
    stubFetch(200);
    const client = await connectedClient("staging_key", () => {
      throw new Error("telemetry backend exploded");
    });

    const result = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: SUBSCRIPTION_ID },
    });

    expect(result.isError).toBeFalsy();
  });

  it("omitting the hook leaves behaviour unchanged", async () => {
    stubFetch(200);
    const client = await connectedClient("staging_key");

    const result = await client.callTool({
      name: "subscriptionCancel",
      arguments: { subscriptionId: SUBSCRIPTION_ID },
    });

    expect(result.isError).toBeFalsy();
  });
});
