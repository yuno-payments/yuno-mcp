import { expect, it, describe, rstest, afterEach } from "@rstest/core";
import { recipientCreateSchema, recipientUpdateSchema } from "../src/schemas";
import { recipientCreateTool, recipientRetrieveTool, recipientUpdateTool, recipientDeleteTool } from "../src/tools/recipients";
import { YunoClient } from "../src/client";

const RECIPIENT_ID = "r".repeat(36);

const minimalRecipient = {
  merchant_recipient_id: "mr-1",
  national_entity: "INDIVIDUAL" as const,
  country: "CO",
};

describe("recipientCreateTool", () => {
  it("should create a recipient, call YunoClient, and return the result", async () => {
    const mockYunoClient = {
      accountCode: "acct-from-client",
      recipients: {
        create: rstest.fn().mockResolvedValue({ body: { id: RECIPIENT_ID, ...minimalRecipient }, status: 201, headers: {} }),
      },
    };
    const result = await recipientCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(minimalRecipient);
    expect(mockYunoClient.recipients.create).toHaveBeenCalledWith({ ...minimalRecipient, account_id: "acct-from-client" });
    expect(result.content[0].text).toContain(RECIPIENT_ID);
  });

  it("should keep an explicit account_id instead of the client's account code", async () => {
    const mockYunoClient = {
      accountCode: "acct-from-client",
      recipients: { create: rstest.fn().mockResolvedValue({ body: { id: RECIPIENT_ID }, status: 201, headers: {} }) },
    };
    const input = { ...minimalRecipient, account_id: "a".repeat(36) };
    await recipientCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.recipients.create).toHaveBeenCalledWith(expect.objectContaining({ account_id: input.account_id }));
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    expect(() => recipientCreateSchema.parse(minimalRecipient)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    expect(() => recipientCreateSchema.parse({ national_entity: "INDIVIDUAL", country: "CO" })).toThrow();
    expect(() => recipientCreateSchema.parse({ ...minimalRecipient, national_entity: "PERSON" })).toThrow();
    expect(() => recipientCreateSchema.parse({ ...minimalRecipient, country: "COL" })).toThrow();
    expect(() => recipientCreateSchema.parse({ ...minimalRecipient, email: "not-an-email" })).toThrow();
  });

  it("should accept nested optional objects and an ENTITY recipient", () => {
    const entity = {
      ...minimalRecipient,
      national_entity: "ENTITY" as const,
      entity_type: "PRIVATE" as const,
      legal_name: "Acme SAS",
      document: { document_type: "NIT", document_number: "900123456" },
      phone: { number: "3001234567", country_code: "57" },
      address: { address_line_1: "Calle 1", city: "Bogota" },
      legal_representatives: [{ first_name: "Ada", last_name: "Lovelace" }],
    };
    expect(() => recipientCreateSchema.parse(entity)).not.toThrow();
  });

  it("should return the raw body as a structured object when type is object", async () => {
    const body = { id: RECIPIENT_ID, status: "ACTIVE" };
    const mockYunoClient = {
      accountCode: "acct",
      recipients: { create: rstest.fn().mockResolvedValue({ body, status: 201, headers: {} }) },
    };
    const result = await recipientCreateTool.handler({ yunoClient: mockYunoClient as any, type: "object" })(minimalRecipient);
    expect(result.content[0]).toEqual({ type: "object", object: body });
  });
});

describe("recipientRetrieveTool", () => {
  it("should retrieve a recipient by id", async () => {
    const mockYunoClient = {
      recipients: { retrieve: rstest.fn().mockResolvedValue({ body: { id: RECIPIENT_ID }, status: 200, headers: {} }) },
    };
    const result = await recipientRetrieveTool.handler({ yunoClient: mockYunoClient as any, type: "text" })({
      recipient_id: RECIPIENT_ID,
    });
    expect(mockYunoClient.recipients.retrieve).toHaveBeenCalledWith(RECIPIENT_ID, undefined);
    expect(result.content[0].text).toContain(RECIPIENT_ID);
  });

  it("should require recipient_id", () => {
    expect(() => recipientRetrieveTool.schema.parse({})).toThrow();
  });

  it("should be marked read-only and non-destructive", () => {
    expect(recipientRetrieveTool.annotations.readOnlyHint).toBe(true);
    expect(recipientRetrieveTool.annotations.destructiveHint).toBe(false);
  });
});

describe("recipientUpdateTool", () => {
  it("should split recipient_id from the update body", async () => {
    const mockYunoClient = {
      recipients: { update: rstest.fn().mockResolvedValue({ body: { id: RECIPIENT_ID }, status: 200, headers: {} }) },
    };
    await recipientUpdateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })({
      recipient_id: RECIPIENT_ID,
      first_name: "Ada",
    });
    expect(mockYunoClient.recipients.update).toHaveBeenCalledWith(RECIPIENT_ID, { first_name: "Ada" }, undefined);
  });

  it("should validate an update with only recipient_id", () => {
    expect(() => recipientUpdateSchema.parse({ recipient_id: RECIPIENT_ID })).not.toThrow();
  });

  it("should fail validation without recipient_id", () => {
    expect(() => recipientUpdateSchema.parse({ first_name: "Ada" })).toThrow();
  });
});

describe("recipientDeleteTool", () => {
  it("should delete a recipient by id", async () => {
    const mockYunoClient = {
      recipients: { delete: rstest.fn().mockResolvedValue({ body: { id: RECIPIENT_ID, status: "DELETED" }, status: 200, headers: {} }) },
    };
    const result = await recipientDeleteTool.handler({ yunoClient: mockYunoClient as any, type: "text" })({
      recipient_id: RECIPIENT_ID,
    });
    expect(mockYunoClient.recipients.delete).toHaveBeenCalledWith(RECIPIENT_ID, undefined);
    expect(result.content[0].text).toContain("DELETED");
  });

  // Through the server, tests/advertised-schema.test.ts covers the same case.
  it("should tolerate an empty body from a no-content delete", async () => {
    const mockYunoClient = {
      recipients: { delete: rstest.fn().mockResolvedValue({ body: undefined, status: 201, headers: {} }) },
    };
    const result = await recipientDeleteTool.handler({ yunoClient: mockYunoClient as any, type: "text" })({
      recipient_id: RECIPIENT_ID,
    });
    expect(result.content[1].text).toContain("HTTP 201");
  });

  it("should be flagged destructive so production calls hit the confirm gate", () => {
    expect(recipientDeleteTool.annotations.destructiveHint).toBe(true);
  });
});

describe("recipient account override", () => {
  const OTHER_ACCOUNT = "o".repeat(36);
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function recordedRequests(): { url: string; body?: string }[] {
    const requests: { url: string; body?: string }[] = [];
    globalThis.fetch = ((url: string, init?: { body?: string }) => {
      requests.push({ url, body: init?.body });
      return Promise.resolve(new Response(JSON.stringify({ id: RECIPIENT_ID }), { status: 200 }));
    }) as unknown as typeof fetch;
    return requests;
  }

  const yunoClient = () => YunoClient.initialize({ accountCode: "acct-default", publicApiKey: "sandbox_key", privateSecretKey: "s" });

  it("sends the passed account_id in the query of retrieve, update and delete", async () => {
    const requests = recordedRequests();
    const client = yunoClient();
    await recipientRetrieveTool.handler({ yunoClient: client, type: "object" })({ recipient_id: RECIPIENT_ID, account_id: OTHER_ACCOUNT });
    await recipientUpdateTool.handler({ yunoClient: client, type: "object" })({
      recipient_id: RECIPIENT_ID,
      account_id: OTHER_ACCOUNT,
      first_name: "Ada",
    });
    await recipientDeleteTool.handler({ yunoClient: client, type: "object" })({ recipient_id: RECIPIENT_ID, account_id: OTHER_ACCOUNT });

    expect(requests.map((request) => new URL(request.url).searchParams.get("account_id"))).toEqual([OTHER_ACCOUNT, OTHER_ACCOUNT, OTHER_ACCOUNT]);
    // A selector, not a field to update.
    expect(JSON.parse(requests[1].body ?? "{}")).toEqual({ first_name: "Ada" });
  });

  it("falls back to the client's account when none is passed", async () => {
    const requests = recordedRequests();
    await recipientRetrieveTool.handler({ yunoClient: yunoClient(), type: "object" })({ recipient_id: RECIPIENT_ID });
    expect(new URL(requests[0].url).searchParams.get("account_id")).toBe("acct-default");
  });

  it("encodes a recipient_id that carries its own query, so only the intended account_id is sent", async () => {
    const requests = recordedRequests();
    const client = yunoClient();
    const recipientId = "x?account_id=O&z=";
    await recipientRetrieveTool.handler({ yunoClient: client, type: "object" })({ recipient_id: recipientId });
    await recipientUpdateTool.handler({ yunoClient: client, type: "object" })({ recipient_id: recipientId, first_name: "Ada" });
    await recipientDeleteTool.handler({ yunoClient: client, type: "object" })({ recipient_id: recipientId, account_id: OTHER_ACCOUNT });

    const urls = requests.map((request) => new URL(request.url));
    expect(urls.map((url) => url.pathname.endsWith("/recipients/x%3Faccount_id%3DO%26z%3D"))).toEqual([true, true, true]);
    expect(urls.map((url) => url.searchParams.getAll("account_id"))).toEqual([["acct-default"], ["acct-default"], [OTHER_ACCOUNT]]);
    expect(urls.map((url) => [...url.searchParams.keys()])).toEqual([["account_id"], ["account_id"], ["account_id"]]);
  });

  it("URL-encodes the account_id", async () => {
    const requests = recordedRequests();
    await yunoClient().recipients.retrieve(RECIPIENT_ID, "a&b=c/d");
    expect(requests[0].url).toContain("account_id=a%26b%3Dc%2Fd");
  });

  it("accepts account_id in the three schemas", () => {
    for (const tool of [recipientRetrieveTool, recipientUpdateTool, recipientDeleteTool]) {
      expect(() => tool.schema.parse({ recipient_id: RECIPIENT_ID, account_id: OTHER_ACCOUNT })).not.toThrow();
    }
  });
});
