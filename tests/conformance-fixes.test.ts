import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { initializeYunoMCP } from "../src/index";
import { cardDataSchema, ottCreateSchema } from "../src/schemas";
import { toTwoDigitExpirationYear } from "../src/tools/checkouts";
import { YunoClient, withCaptureDisabled } from "../src/client/YunoClient";

/**
 * Fixes for findings from the conformance review of 2026-09-20. Each block pins
 * one finding, over a live client/server pair where the behaviour is only
 * visible there.
 */

const PAYMENT_ID = "p".repeat(36);
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function connect(publicApiKey: string, onFetch: (url: string) => void = () => undefined) {
  globalThis.fetch = ((url: string) => {
    onFetch(url);
    return Promise.resolve(new Response(JSON.stringify({ id: PAYMENT_ID }), { status: 200 }));
  }) as unknown as typeof fetch;
  const result = await initializeYunoMCP({ accountCode: "acct", publicApiKey, privateSecretKey: "secret" });
  if (!result?.yunoMCP) throw new Error("initializeYunoMCP failed");
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
  return client;
}

const textFrom = (result: unknown): string => {
  const content = ((result as { content?: unknown }).content ?? []) as { type?: string; text?: string }[];
  return content.find((item) => item.type === "text")?.text ?? "";
};

describe("an unrecognized public-api-key prefix", () => {
  it("fails with a diagnosable error instead of a bare 'fetch failed'", async () => {
    const urls: string[] = [];
    const client = await connect("typo_abc123", (url) => urls.push(url));
    const result = await client.callTool({ name: "paymentRetrieve", arguments: { payment_id: PAYMENT_ID } });

    expect(result.isError).toBe(true);
    expect(textFrom(result)).toContain("INVALID_PUBLIC_API_KEY");
    expect(textFrom(result)).not.toContain("fetch failed");
    // It never gets as far as building https://apiundefined.y.uno.
    expect(urls).toEqual([]);
  });

  it("never echoes the key back, even one without an underscore", async () => {
    const client = await connect("NoUnderscoreSecretValue");
    const result = await client.callTool({ name: "paymentRetrieve", arguments: { payment_id: PAYMENT_ID } });
    expect(textFrom(result)).not.toContain("NoUnderscoreSecretValue");
  });

  it("still lists tools, so a client can connect and learn what is wrong on first call", async () => {
    const client = await connect("typo_abc123");
    const listed = await client.listTools();
    expect(listed.tools.length).toBeGreaterThan(0);
  });

  it.each(["dev", "staging", "sandbox", "prod"])("routes a %s_ key to its environment", async (prefix) => {
    const urls: string[] = [];
    const client = await connect(`${prefix}_key`, (url) => urls.push(url));
    await client.callTool({ name: "paymentRetrieve", arguments: { payment_id: PAYMENT_ID } });
    const suffix = prefix === "prod" ? "" : `-${prefix}`;
    expect(urls[0]).toBe(`https://api${suffix}.y.uno/v1/payments/${PAYMENT_ID}`);
  });

  it("reports the environment only for a recognized prefix", () => {
    const config = { accountCode: "acct", privateSecretKey: "secret" };
    expect(YunoClient.initialize({ ...config, publicApiKey: "prod_key" }).environment).toBe("prod");
    expect(YunoClient.initialize({ ...config, publicApiKey: "typo_key" }).environment).toBeUndefined();
  });
});

describe("describeTool on an unknown name", () => {
  it("returns isError, so a miss is distinguishable from a description", async () => {
    const client = await connect("staging_key");
    const result = await client.callTool({ name: "describeTool", arguments: { method: "notARealTool" } });
    expect(result.isError).toBe(true);
    expect(textFrom(result)).toContain('Unknown tool "notARealTool"');
  });

  it("still succeeds for a real tool", async () => {
    const client = await connect("staging_key");
    const result = await client.callTool({ name: "describeTool", arguments: { method: "paymentCreate" } });
    expect(result.isError).toBeFalsy();
  });
});

describe("card expiration year", () => {
  const card = { number: "4111111111111111", expiration_month: 12 };

  it.each([29, 2029])("accepts %i on every card input", (expiration_year) => {
    expect(cardDataSchema.safeParse({ ...card, expiration_year }).success).toBe(true);
  });

  it.each([0, 100, 999, 10000])("rejects %i, which is neither YY nor YYYY", (expiration_year) => {
    expect(cardDataSchema.safeParse({ ...card, expiration_year }).success).toBe(false);
  });

  it("accepts a 4-digit year on checkoutSessionCreateOtt, which used to require YY", () => {
    const ott = {
      session_id: "s",
      payment_method: {
        type: "CARD",
        vault_on_success: false,
        card: { ...card, expiration_year: 2029, security_code: "123", holder_name: "Ada Lovelace" },
        customer: {
          browser_info: {
            browser_time_difference: "0",
            color_depth: "24",
            java_enabled: false,
            screen_height: "1080",
            screen_width: "1920",
            user_agent: "ua",
            language: "en",
            javascript_enabled: true,
            accept_browser: "text/html",
            accept_content: "text/html",
            accept_header: "text/html",
          },
        },
      },
      three_d_secure: {},
    };
    const parsed = ottCreateSchema.safeParse(ott);
    expect(parsed.success).toBe(true);
  });

  it.each([
    [2000, true],
    [2099, true],
    [1999, false],
    [2100, false],
    [3026, false],
  ])("checkoutSessionCreateOtt takes %i as a 4-digit year: %s", (expiration_year, accepted) => {
    const parsed = ottCreateSchema.shape.payment_method.shape.card.unwrap().unwrap().shape.expiration_year.safeParse(expiration_year);
    expect(parsed.success).toBe(accepted);
  });

  it("never wraps a year it cannot represent as YY", () => {
    expect(toTwoDigitExpirationYear({ payment_method: { card: { expiration_year: 2000 } } }).payment_method.card.expiration_year).toBe(0);
    for (const expiration_year of [2100, 3026, 1999]) {
      expect(() => toTwoDigitExpirationYear({ payment_method: { card: { expiration_year } } })).toThrow("has no 2-digit form");
    }
  });

  it("sends YY to the OTT endpoint whichever format the caller used", () => {
    const request = { payment_method: { card: { expiration_year: 2029 } } };
    expect(toTwoDigitExpirationYear(request).payment_method.card.expiration_year).toBe(29);
    expect(toTwoDigitExpirationYear({ payment_method: { card: { expiration_year: 29 } } }).payment_method.card.expiration_year).toBe(29);
  });

  it("leaves a request without a card untouched", () => {
    const request = { payment_method: { card: null } };
    expect(toTwoDigitExpirationYear(request)).toBe(request);
  });
});

describe("payment method identifier", () => {
  /**
   * The enroll response carries no `id` — vaulted_token is the identifier, and it is
   * what retrieve/unenroll take as payment_method_id. Verified against api-staging on
   * 2026-09-21: enroll returned vaulted_token and no id; retrieve by vaulted_token → 200.
   * The finding was that nothing on the tool surface connected the two.
   */
  it("tells the caller that payment_method_id is the vaulted_token", async () => {
    const { paymentMethodRetrieveTool, paymentMethodUnenrollTool } = await import("../src/tools/paymentMethods");
    for (const tool of [paymentMethodRetrieveTool, paymentMethodUnenrollTool]) {
      expect(tool.schema.shape.payment_method_id.description).toContain("vaulted_token");
    }
  });

  it("points from vaulted_token in the enroll output to payment_method_id", async () => {
    const { yunoPaymentMethodOutputSchema } = await import("../src/schemas");
    expect(yunoPaymentMethodOutputSchema.shape.vaulted_token.description).toContain("payment_method_id");
  });

  /**
   * The two tests above read the source schemas. A client reads tools/list, and
   * compactSchema used to rebuild `.nullish()` wrappers without the description
   * sitting on them, so neither hint reached it.
   */
  it("says so in the live tools/list too", async () => {
    const client = await connect("staging_key");
    const listed = await client.listTools();
    type Listed = { properties?: Record<string, { description?: string }> };
    const enroll = listed.tools.find((tool) => tool.name === "paymentMethodEnroll")?.outputSchema as Listed;
    expect(enroll.properties?.vaulted_token?.description).toContain("payment_method_id");
    const retrieve = listed.tools.find((tool) => tool.name === "paymentMethodRetrieve")?.inputSchema as Listed;
    expect(retrieve.properties?.payment_method_id?.description).toContain("vaulted_token");
  });

  it("keeps every top-level parameter description in the live tools/list", async () => {
    const { tools } = await import("../src/tools");
    const client = await connect("staging_key");
    const listed = await client.listTools();
    const missing = tools.flatMap((tool) => {
      const properties = (listed.tools.find((listedTool) => listedTool.name === tool.method)?.inputSchema.properties ?? {}) as Record<
        string,
        { description?: string }
      >;
      return Object.entries(tool.schema.shape as Record<string, { description?: string }>)
        .filter(([key, value]) => value.description && !properties[key]?.description)
        .map(([key]) => `${tool.method}.${key}`);
    });
    expect(missing).toEqual([]);
  });
});

describe("paymentAuthorize never captures", () => {
  /**
   * Verified against api-staging on 2026-09-21: authorizing a vaulted card without
   * `detail.card` produced a PURCHASE transaction — a charge — and with
   * `detail.card.capture: false` an AUTHORIZE. The old code only set the flag when the
   * caller had already sent `detail.card`.
   */
  const base = { description: "d", country: "CO", merchant_order_id: "m", amount: { currency: "COP", value: 1 }, workflow: "DIRECT" as const };

  async function authorize(payment: Record<string, unknown>) {
    let body: Record<string, unknown> | undefined;
    const client = await connect("staging_key");
    globalThis.fetch = ((_url: string, init?: { body?: string }) => {
      body = init?.body ? (JSON.parse(init.body) as Record<string, unknown>) : undefined;
      return Promise.resolve(new Response(JSON.stringify({ id: PAYMENT_ID }), { status: 200 }));
    }) as unknown as typeof fetch;
    const result = await client.callTool({ name: "paymentAuthorize", arguments: { payment: { ...base, ...payment } } });
    type Detail = { capture?: boolean; installments?: number; payment_token?: string };
    return { result, body: body as { payment_method: { detail?: { card?: Detail; wallet?: Detail } } } | undefined };
  }

  async function sentBody(payment: Record<string, unknown>) {
    const { body } = await authorize(payment);
    if (!body) throw new Error("nothing was sent");
    return body;
  }

  it("disables capture for a vaulted card sent without detail.card", async () => {
    const body = await sentBody({ payment_method: { type: "CARD", vaulted_token: "v".repeat(36) } });
    expect(body.payment_method.detail?.card?.capture).toBe(false);
  });

  it("disables capture even when the caller asked for it", async () => {
    const body = await sentBody({ payment_method: { type: "CARD", token: "t", detail: { card: { capture: true } } } });
    expect(body.payment_method.detail?.card?.capture).toBe(false);
  });

  it("keeps the caller's other card details", async () => {
    const body = await sentBody({ payment_method: { type: "CARD", token: "t", detail: { card: { installments: 3 } } } });
    expect(body.payment_method.detail?.card).toEqual({ installments: 3, capture: false });
  });

  it("matches the card type case-insensitively", async () => {
    const body = await sentBody({ payment_method: { type: "card", token: "t" } });
    expect(body.payment_method.detail?.card?.capture).toBe(false);
  });

  /**
   * public-api reads a wallet's capture flag from detail.wallet, and defaults it to
   * true — a Google Pay or Apple Pay "authorization" was a purchase.
   */
  it.each(["GOOGLE_PAY", "APPLE_PAY", "google_pay"])("disables capture for a %s wallet sent without a detail", async (type) => {
    const body = await sentBody({ payment_method: { type, token: "t" } });
    expect(body.payment_method.detail?.wallet?.capture).toBe(false);
    expect(body.payment_method.detail?.card).toBeUndefined();
  });

  it("keeps the caller's wallet details and overrides capture: true", async () => {
    const body = await sentBody({ payment_method: { type: "APPLE_PAY", detail: { wallet: { payment_token: "ap", capture: true } } } });
    expect(body.payment_method.detail?.wallet).toEqual({ payment_token: "ap", capture: false });
  });

  it("disables capture on a wallet detail whatever the type says", async () => {
    const body = await sentBody({ payment_method: { type: "SOME_NEW_WALLET", detail: { wallet: { payment_token: "w" } } } });
    expect(body.payment_method.detail?.wallet?.capture).toBe(false);
  });

  it("refuses a type it cannot hold funds for, and sends nothing", async () => {
    const { result, body } = await authorize({ payment_method: { type: "PIX" } });
    expect(result.isError).toBe(true);
    expect(textFrom(result)).toContain("UNSUPPORTED_AUTHORIZATION");
    expect(textFrom(result)).toContain("paymentCreate");
    expect(body).toBeUndefined();
  });

  it("does not mutate the caller's payment", () => {
    const payment = { ...base, payment_method: { type: "CARD", detail: { card: { capture: true } } } };
    withCaptureDisabled(payment);
    expect(payment.payment_method.detail.card.capture).toBe(true);
  });
});
