import { paymentLinkCreateTool, paymentLinkRetrieveTool, paymentLinkCancelTool } from "../src/paymentLinks";
import { paymentLinkCreateSchema, paymentLinkCancelSchema } from "../src/paymentLinks/types";
import z from "zod";

describe("paymentLinkCreateTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      accountCode: "acc_123",
      paymentLinks: {
        create: jest.fn().mockResolvedValue({ id: "plink_123", description: "Test link" }),
      },
    };
    const input = {
      account_id: "acc_123",
      description: "Test link",
      country: "US",
      merchant_order_id: "order_1",
      amount: { currency: "USD", value: 100 },
      payment_method_types: ["card"],
    };
    const result = await paymentLinkCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.paymentLinks.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("plink_123");
    expect(result.content[0].text).toContain("Test link");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = {
      description: "Test link",
      country: "US",
      merchant_order_id: "order_1",
      amount: { currency: "USD", value: 100 },
      payment_method_types: ["card"],
    };
    expect(() => paymentLinkCreateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingDescription = {
      country: "US",
      merchant_order_id: "order_1",
      amount: { currency: "USD", value: 100 },
      payment_method_types: ["card"],
    };
    const invalidCountry = {
      description: "Test link",
      country: "U",
      merchant_order_id: "order_1",
      amount: { currency: "USD", value: 100 },
      payment_method_types: ["card"],
    };
    expect(() => paymentLinkCreateSchema.parse(missingDescription)).toThrow();
    expect(() => paymentLinkCreateSchema.parse(invalidCountry)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      accountCode: "acc_123",
      paymentLinks: {
        create: jest.fn().mockResolvedValue({ id: "plink_456", description: "Full link", metadata: [] }),
      },
    };
    const input = {
      account_id: "acc_123",
      description: "Full link",
      country: "US",
      merchant_order_id: "order_2",
      amount: { currency: "USD", value: 100 },
      payment_method_types: ["card", "bank"],
      capture: true,
      taxes: [{ type: "VAT", value: 10 }],
      customer_payer: { first_name: "John", last_name: "Doe" },
      additional_data: {},
      callback_url: "https://callback",
      one_time_use: true,
      availability: { start_at: "2024-01-01", finish_at: "2024-12-31" },
      metadata: [],
      vault_on_success: true,
    };
    const result = await paymentLinkCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.paymentLinks.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("plink_456");
    expect(result.content[0].text).toContain("Full link");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      accountCode: "acc_123",
      paymentLinks: {
        create: jest.fn().mockResolvedValue({ id: "plink_789", description: "Minimal link" }),
      },
    };
    const input = {
      description: "Minimal link",
      country: "US",
      merchant_order_id: "order_3",
      amount: { currency: "USD", value: 100 },
      payment_method_types: ["card"],
    };
    const result = await paymentLinkCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.paymentLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...input,
        account_id: "acc_123",
      }),
    );
    expect(result.content[0].text).toContain("plink_789");
    expect(result.content[0].text).toContain("Minimal link");
  });
});

describe("paymentLinkRetrieveTool", () => {
  const retrieveSchema = z.object({ paymentLinkId: z.string() });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      paymentLinks: {
        retrieve: jest.fn().mockResolvedValue({ id: "plink_123", description: "Test link" }),
      },
    };
    const input = { paymentLinkId: "plink_123" };
    const result = await paymentLinkRetrieveTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.paymentLinks.retrieve).toHaveBeenCalledWith("plink_123");
    expect(result.content[0].text).toContain("plink_123");
    expect(result.content[0].text).toContain("Test link");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { paymentLinkId: null };
    expect(() => retrieveSchema.parse(missingId)).toThrow();
    expect(() => retrieveSchema.parse(invalidId)).toThrow();
  });
});

describe("paymentLinkCancelTool", () => {
  const cancelSchema = z.object({ paymentLinkId: z.string(), body: paymentLinkCancelSchema });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      paymentLinks: {
        cancel: jest.fn().mockResolvedValue({ id: "plink_123", cancelled: true }),
      },
    };
    const input = { paymentLinkId: "plink_123", body: { reason: "REQUESTED_BY_CUSTOMER" } };
    const result = await paymentLinkCancelTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.paymentLinks.cancel).toHaveBeenCalledWith("plink_123", { reason: "REQUESTED_BY_CUSTOMER" });
    expect(result.content[0].text).toContain("plink_123");
    expect(result.content[0].text).toContain("true");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = { body: { reason: "REQUESTED_BY_CUSTOMER" } };
    const invalidId = { paymentLinkId: null, body: { reason: "REQUESTED_BY_CUSTOMER" } };
    const missingBody = { paymentLinkId: "plink_123" };
    expect(() => cancelSchema.parse(missingId)).toThrow();
    expect(() => cancelSchema.parse(invalidId)).toThrow();
    expect(() => cancelSchema.parse(missingBody)).toThrow();
  });
});
