import { expect, it, describe, rstest } from "@rstest/core";
import { recipientCreateSchema, recipientUpdateSchema } from "../src/schemas";
import { recipientCreateTool, recipientRetrieveTool, recipientUpdateTool, recipientDeleteTool } from "../src/tools/recipients";

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
    expect(mockYunoClient.recipients.retrieve).toHaveBeenCalledWith(RECIPIENT_ID);
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
    expect(mockYunoClient.recipients.update).toHaveBeenCalledWith(RECIPIENT_ID, { first_name: "Ada" });
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
    expect(mockYunoClient.recipients.delete).toHaveBeenCalledWith(RECIPIENT_ID);
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
