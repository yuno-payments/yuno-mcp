import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { initializeYunoMCP } from "../index";
import { textOf, type CallResult, type Finding } from "./checks";

/**
 * paymentAuthorize cannot be exercised against a deployed endpoint without
 * creating a real authorization, so this check drives the real paymentAuthorize
 * tool end to end (tools/call -> handler -> YunoClient) on an in-process server
 * built from the checked-out code, with every outbound request intercepted and
 * answered locally. Nothing reaches the network. It asserts the request the
 * server would send, which is what decides hold versus charge.
 */

export type CapturedRequest = { url: string; method: string; body: unknown };

export type AuthorizeHarness = {
  callAuthorize(args: Record<string, unknown>): Promise<CallResult>;
  sent: CapturedRequest[];
  close(): Promise<void>;
};

const STUB_RESPONSE = JSON.stringify({ id: "00000000-0000-4000-8000-000000000000", status: "READY_TO_PAY" });

export async function inProcessAuthorizeHarness(): Promise<AuthorizeHarness> {
  const sent: CapturedRequest[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    const body = typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined;
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    sent.push({ url, method: init?.method ?? "GET", body });
    return Promise.resolve(new Response(STUB_RESPONSE, { status: 200, headers: { "content-type": "application/json" } }));
  }) as typeof fetch;

  const restore = () => {
    globalThis.fetch = originalFetch;
  };
  try {
    const result = await initializeYunoMCP({ accountCode: "conformance", publicApiKey: "staging_conformance", privateSecretKey: "conformance" });
    if (!result?.yunoMCP) throw new Error("in-process server failed to initialize");
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "yuno-mcp-conformance-authorize", version: "1.0.0" });
    await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
    return {
      sent,
      callAuthorize: (args) => client.callTool({ name: "paymentAuthorize", arguments: args }) as Promise<CallResult>,
      close: async () => {
        await client.close();
        restore();
      },
    };
  } catch (error) {
    restore();
    throw error;
  }
}

const paymentOf = (paymentMethod: Record<string, unknown>) => ({
  payment: {
    description: "conformance authorize hold probe",
    country: "CO",
    merchant_order_id: "conformance-authorize-probe",
    amount: { currency: "COP", value: 1000 },
    workflow: "DIRECT",
    payment_method: paymentMethod,
  },
});

type HoldCase = { label: string; paymentMethod: Record<string, unknown>; slot: "card" | "wallet" };

const HOLD_CASES: HoldCase[] = [
  { label: "CARD with a card detail", paymentMethod: { type: "CARD", token: "tok_conformance", detail: { card: { installments: 1 } } }, slot: "card" },
  { label: "CARD token only, no detail", paymentMethod: { type: "CARD", token: "tok_conformance" }, slot: "card" },
  { label: "GOOGLE_PAY wallet", paymentMethod: { type: "GOOGLE_PAY", token: "tok_conformance" }, slot: "wallet" },
  { label: "APPLE_PAY wallet", paymentMethod: { type: "APPLE_PAY", token: "tok_conformance" }, slot: "wallet" },
];

const captureFlagOf = (request: CapturedRequest | undefined, slot: "card" | "wallet"): unknown => {
  const body = request?.body as { payment_method?: { detail?: Record<string, { capture?: unknown } | undefined> } } | undefined;
  return body?.payment_method?.detail?.[slot]?.capture;
};

export async function checkAuthorizeNeverCaptures(harnessFactory: () => Promise<AuthorizeHarness> = inProcessAuthorizeHarness): Promise<Finding[]> {
  const findings: Finding[] = [];
  const harness = await harnessFactory();
  try {
    for (const { label, paymentMethod, slot } of HOLD_CASES) {
      const before = harness.sent.length;
      const result = await harness.callAuthorize(paymentOf(paymentMethod));
      const request = harness.sent.slice(before).find((entry) => entry.method === "POST" && entry.url.endsWith("/payments"));
      if (result.isError === true || !request) {
        findings.push({
          tool: "paymentAuthorize",
          finding: "authorize-would-capture",
          message: `paymentAuthorize did not send an authorization for ${label}: ${textOf(result).slice(0, 200)}`,
        });
        continue;
      }
      if (captureFlagOf(request, slot) !== false) {
        findings.push({
          tool: "paymentAuthorize",
          finding: "authorize-would-capture",
          message: `paymentAuthorize sent ${label} without payment_method.detail.${slot}.capture=false; the authorization would capture and charge the customer.`,
        });
      }
    }

    const before = harness.sent.length;
    const refused = await harness.callAuthorize(paymentOf({ type: "PIX", token: "tok_conformance" }));
    if (refused.isError !== true || harness.sent.length > before) {
      findings.push({
        tool: "paymentAuthorize",
        finding: "authorize-unsupported-not-refused",
        message: "paymentAuthorize did not refuse a payment type it cannot hold (PIX); it would be sent as a purchase.",
      });
    }
  } finally {
    await harness.close();
  }
  return findings;
}
