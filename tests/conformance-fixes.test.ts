import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { initializeYunoMCP } from "../src/index";
import { cardDataSchema, ottCreateSchema } from "../src/schemas";
import { toTwoDigitExpirationYear } from "../src/tools/checkouts";

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
});
