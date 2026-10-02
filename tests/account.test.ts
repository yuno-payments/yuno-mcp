import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { initializeYunoMCP } from "../src/index";
import { YunoClient } from "../src/client";
import { tools } from "../src/tools";
import { accountIdPath } from "../src/tools/account";
import { EXAMPLES } from "../src/tools/describe/examples";
import type { Tool } from "../src/types";

const DEFAULT_ACCOUNT = "d".repeat(36);
const OTHER_ACCOUNT = "o".repeat(36);
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

type Sent = { url: string; body: unknown };

/** Records every request; each one is answered with `status` and `body`. */
function stubFetch(status = 200, body: unknown = { id: "x" }): Sent[] {
  const sent: Sent[] = [];
  globalThis.fetch = ((url: string, init?: { body?: string }) => {
    sent.push({ url, body: init?.body ? JSON.parse(init.body) : undefined });
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  }) as unknown as typeof fetch;
  return sent;
}

async function connect(mode?: "read-only" | "full"): Promise<Client> {
  const result = await initializeYunoMCP({ accountCode: DEFAULT_ACCOUNT, publicApiKey: "sandbox_key", privateSecretKey: "s", mode });
  if (!result?.yunoMCP) throw new Error("initializeYunoMCP failed");
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
  return client;
}

const texts = (result: unknown): string[] =>
  (result as { content: { type: string; text?: string }[] }).content.filter((item) => item.type === "text").map((item) => item.text ?? "");

const ACCOUNT_SCOPED = [
  "checkoutSessionCreate",
  "installmentPlanCreate",
  "installmentPlanRetrieveAll",
  "installmentPlanUpdate",
  "paymentAuthorize",
  "paymentCreate",
  "paymentLinkCreate",
  "paymentMethodEnroll",
  "recipientCreate",
  "recipientDelete",
  "recipientRetrieve",
  "recipientUpdate",
  "subscriptionCreate",
  "subscriptionUpdate",
];

describe("accountContext", () => {
  it("reports the default account, the environment and the account-scoped tools without calling the API", async () => {
    const sent = stubFetch();
    const result = await (await connect()).callTool({ name: "accountContext", arguments: {} });

    expect(result.isError).toBeFalsy();
    expect(JSON.parse(texts(result)[0])).toEqual({
      account_id: DEFAULT_ACCOUNT,
      environment: "sandbox",
      tools_accepting_account_id: expect.any(Array),
    });
    expect([...JSON.parse(texts(result)[0]).tools_accepting_account_id].sort()).toEqual(ACCOUNT_SCOPED);
    expect(sent).toEqual([]);
  });

  it("derives its list from the input schemas", () => {
    const scoped = tools.filter((tool) => accountIdPath(tool.schema)).map((tool) => tool.method);
    expect(scoped.sort()).toEqual(ACCOUNT_SCOPED);
    expect(accountIdPath(tools.find((tool) => tool.method === "paymentCreate")!.schema)).toEqual(["payment", "account_id"]);
  });

  it("is available in read-only mode", async () => {
    stubFetch();
    const client = await connect("read-only");
    const listed = (await client.listTools()).tools.find((tool) => tool.name === "accountContext");
    expect(listed?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });

    const result = await client.callTool({ name: "accountContext", arguments: {} });
    expect(JSON.parse(texts(result)[0]).account_id).toBe(DEFAULT_ACCOUNT);
  });

  it("takes no parameters", async () => {
    stubFetch();
    const result = await (await connect()).callTool({ name: "accountContext", arguments: { account_id: OTHER_ACCOUNT } });
    expect(result.isError).toBe(true);
  });
});

describe("server instructions", () => {
  it("name the default account and environment and point at accountContext", async () => {
    stubFetch();
    const instructions = (await connect()).getInstructions() ?? "";
    expect(instructions).toContain(DEFAULT_ACCOUNT);
    expect(instructions).toContain("sandbox");
    expect(instructions).toContain("accountContext");
    expect(instructions).toContain("account_id");
    expect(instructions.length).toBeLessThan(600);
  });
});

describe("the account named on an API error", () => {
  const error = { code: "INVALID_PARAMETERS", messages: ["payment method not available"] };

  it("names the default account when none was passed", async () => {
    const sent = stubFetch(400, error);
    const result = await (await connect()).callTool({ name: "paymentLinkCreate", arguments: EXAMPLES.paymentLinkCreate as Record<string, unknown> });

    expect(result.isError).toBe(true);
    expect(JSON.parse(texts(result)[0])).toEqual(error);
    expect(texts(result).at(-1)).toBe(`Request sent with account_id ${DEFAULT_ACCOUNT} (the default account; none was passed in the call).`);
    expect(sent[0].body).toMatchObject({ account_id: DEFAULT_ACCOUNT });
  });

  it("names the account passed in the call, nested or not", async () => {
    const sent = stubFetch(400, error);
    const client = await connect();
    const link = await client.callTool({
      name: "paymentLinkCreate",
      arguments: { ...(EXAMPLES.paymentLinkCreate as Record<string, unknown>), account_id: OTHER_ACCOUNT },
    });
    const examplePayment = (EXAMPLES.paymentCreate as { payment: Record<string, unknown> }).payment;
    const payment = await client.callTool({
      name: "paymentCreate",
      arguments: { payment: { ...examplePayment, account_id: OTHER_ACCOUNT } },
    });

    for (const result of [link, payment]) {
      expect(result.isError).toBe(true);
      expect(texts(result).at(-1)).toBe(`Request sent with account_id ${OTHER_ACCOUNT} (passed in the call).`);
    }
    expect(sent.map((request) => JSON.stringify(request.body))).toEqual([
      expect.stringContaining(OTHER_ACCOUNT),
      expect.stringContaining(OTHER_ACCOUNT),
    ]);
  });

  it("says no account was sent by a tool that does not apply the default", async () => {
    const sent = stubFetch(404, { code: "NOT_FOUND" });
    const result = await (await connect()).callTool({ name: "subscriptionUpdate", arguments: { subscription_id: "s".repeat(36) } });

    expect(result.isError).toBe(true);
    expect(texts(result).at(-1)).toBe(
      "Request sent with no account_id (none was passed in the call, and this tool does not apply the default account).",
    );
    expect(JSON.stringify(sent[0])).not.toContain(DEFAULT_ACCOUNT);
  });

  it("adds nothing to a tool that is not account-scoped", async () => {
    stubFetch(404, { code: "CUSTOMER_NOT_FOUND" });
    const result = await (await connect()).callTool({ name: "customerRetrieve", arguments: { customer_id: "c".repeat(36) } });

    expect(result.isError).toBe(true);
    expect(texts(result).join("\n")).not.toContain("account_id");
  });

  it("adds nothing to a successful call", async () => {
    stubFetch(200, { id: "link" });
    const result = await (await connect()).callTool({ name: "paymentLinkCreate", arguments: EXAMPLES.paymentLinkCreate as Record<string, unknown> });
    expect(texts(result).join("\n")).not.toContain("Request sent with");
  });

  /**
   * The error note trusts appliesDefaultAccountId to say whether a handler falls back
   * to the default account. This checks the flag against what each handler sends.
   */
  it.each((tools as readonly Tool[]).filter((tool) => accountIdPath(tool.schema)).map((tool) => [tool.method, tool] as const))(
    "%s: appliesDefaultAccountId matches whether the default account is sent",
    async (_method, tool) => {
      const sent = stubFetch();
      const yunoClient = YunoClient.initialize({ accountCode: DEFAULT_ACCOUNT, publicApiKey: "sandbox_key", privateSecretKey: "s" });
      const [parent] = accountIdPath(tool.schema) ?? [];
      const input = parent === "account_id" ? {} : { [parent]: {} };
      await tool
        .handler({ yunoClient, type: "object" })(input)
        .catch(() => undefined);

      expect(sent).toHaveLength(1);
      expect(JSON.stringify(sent[0]).includes(DEFAULT_ACCOUNT)).toBe(tool.appliesDefaultAccountId === true);
    },
  );
});
