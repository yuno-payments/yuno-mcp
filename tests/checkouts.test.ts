import { checkoutSessionCreateTool, checkoutSessionRetrievePaymentMethodsTool } from "../src/checkouts";
import { checkoutSessionCreateSchema } from "../src/checkouts/types";
import z from "zod";

describe("checkoutSessionCreateTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      checkoutSessions: {
        create: jest.fn().mockResolvedValue({ id: "chk_123", merchant_order_id: "order_1" }),
      },
    };
    const input = {
      account_id: "acc_123456789012345678901234567890123456",
      customer_id: "cus_123456789012345678901234567890123456",
      merchant_order_id: "order_1",
      payment_description: "desc",
      country: "US",
      amount: { currency: "USD", value: 100 },
    };
    const result = await checkoutSessionCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.checkoutSessions.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("chk_123");
    expect(result.content[0].text).toContain("order_1");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = {
      customer_id: "cus_123456789012345678901234567890123456",
      merchant_order_id: "ord_1",
      payment_description: "desc",
      country: "US",
      amount: { currency: "USD", value: 100 },
    };
    expect(() => checkoutSessionCreateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingCustomerId = {
      merchant_order_id: "ord_1",
      payment_description: "desc",
      country: "US",
      amount: { currency: "USD", value: 100 },
    };
    const invalidCustomerId = {
      customer_id: "short",
      merchant_order_id: "ord_1",
      payment_description: "desc",
      country: "US",
      amount: { currency: "USD", value: 100 },
    };
    expect(() => checkoutSessionCreateSchema.parse(missingCustomerId)).toThrow();
    expect(() => checkoutSessionCreateSchema.parse(invalidCustomerId)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      checkoutSessions: {
        create: jest.fn().mockResolvedValue({ id: "chk_456", merchant_order_id: "order_2", metadata: [] }),
      },
    };
    const input = {
      account_id: "acc_123456789012345678901234567890123456",
      customer_id: "cus_123456789012345678901234567890123456",
      merchant_order_id: "order_2",
      payment_description: "desc",
      country: "US",
      callback_url: "https://callback",
      amount: { currency: "USD", value: 100 },
      metadata: [],
      installments: {
        plan_id: "plan_1",
        plan: [{ installment: 3, rate: 1.5 }],
      },
    };
    const result = await checkoutSessionCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.checkoutSessions.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("chk_456");
    expect(result.content[0].text).toContain("order_2");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      checkoutSessions: {
        create: jest.fn().mockResolvedValue({ id: "chk_789", merchant_order_id: "order_3" }),
      },
    };
    const input = {
      customer_id: "cus_123456789012345678901234567890123456",
      merchant_order_id: "order_3",
      payment_description: "desc",
      country: "US",
      amount: { currency: "USD", value: 100 },
    };
    const result = await checkoutSessionCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.checkoutSessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...input,
        account_id: "acc_123456789012345678901234567890123456",
      }),
    );
    expect(result.content[0].text).toContain("chk_789");
    expect(result.content[0].text).toContain("order_3");
  });
});

describe("checkoutSessionRetrievePaymentMethodsTool", () => {
  const retrieveSchema = z.object({ sessionId: z.string() });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      checkoutSessions: {
        retrievePaymentMethods: jest.fn().mockResolvedValue({ payment_methods: [{ type: "card", name: "Visa" }] }),
      },
    };
    const input = { sessionId: "sess_123" };
    const result = await checkoutSessionRetrievePaymentMethodsTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.checkoutSessions.retrievePaymentMethods).toHaveBeenCalledWith("sess_123");
    expect(result.content[0].text).toContain("card");
    expect(result.content[0].text).toContain("Visa");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { sessionId: null };
    expect(() => retrieveSchema.parse(missingId)).toThrow();
    expect(() => retrieveSchema.parse(invalidId)).toThrow();
  });
});
