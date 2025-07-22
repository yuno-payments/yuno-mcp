import { expect, it, describe, rstest } from "@rstest/core";
import {
  paymentMethodEnrollTool,
  paymentMethodRetrieveTool,
  paymentMethodRetrieveEnrolledTool,
  paymentMethodUnenrollTool,
} from "../src/tools/paymentMethods";
import { paymentMethodEnrollSchema } from "../src/schemas";
import z from "zod";
import { PaymentMethodEnrollSchema } from "../src/tools/paymentMethods/types";

describe("paymentMethodEnrollTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      paymentMethods: {
        enroll: rstest.fn().mockResolvedValue({ id: "pm_123", type: "CARD" }),
      },
    };
    const input = {
      customerId: "cus_123456789012345678901234567890123456",
      body: {
        account_id: "acc_123456789012345678901234567890123456",
        country: "US",
        type: "CARD",
      },
      idempotency_key: "b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6",
    };
    const result = await paymentMethodEnrollTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.paymentMethods.enroll).toHaveBeenCalledWith(input.customerId, input.body, input.idempotency_key);
    expect(result.content[0].text).toContain("pm_123");
    expect(result.content[0].text).toContain("CARD");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = {
      customerId: "cus_123456789012345678901234567890123456",
      body: {
        country: "US",
        type: "CARD",
      },
    };
    const schema = z.object({
      body: paymentMethodEnrollSchema,
      customerId: z.string().min(36).max(64),
      idempotency_key: z.string().uuid().optional(),
    });
    expect(() => schema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingCustomerId = {
      body: {
        country: "US",
        type: "CARD",
      },
    };
    const invalidCustomerId = {
      customerId: "short",
      body: {
        country: "US",
        type: "CARD",
      },
    };
    const missingBody = {
      customerId: "cus_123456789012345678901234567890123456",
    };
    const schema = z.object({
      body: paymentMethodEnrollSchema,
      customerId: z.string().min(36).max(64),
      idempotency_key: z.string().uuid().optional(),
    });
    expect(() => schema.parse(missingCustomerId)).toThrow();
    expect(() => schema.parse(invalidCustomerId)).toThrow();
    expect(() => schema.parse(missingBody)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      paymentMethods: {
        enroll: rstest.fn().mockResolvedValue({ id: "pm_456", type: "CARD", card_data: { number: "4111111111111111" } }),
      },
    };
    const input = {
      customerId: "cus_123456789012345678901234567890123456",
      body: {
        account_id: "acc_123456789012345678901234567890123456",
        country: "US",
        type: "CARD",
        workflow: "DIRECT",
        provider_data: { id: "prov_1", payment_method_token: "tok_1" },
        card_data: {
          number: "4111111111111111",
          expiration_month: 12,
          expiration_year: 2030,
          security_code: "123",
          holder_name: "John Doe",
          type: "VISA",
        },
        callback_url: "https://callback",
        verify: { vault_on_success: true, currency: "USD" },
      },
      idempotency_key: "b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6",
    } as const satisfies { customerId: string; body: PaymentMethodEnrollSchema; idempotency_key?: string };
    const result = await paymentMethodEnrollTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.paymentMethods.enroll).toHaveBeenCalledWith(input.customerId, input.body, input.idempotency_key);
    expect(result.content[0].text).toContain("pm_456");
    expect(result.content[0].text).toContain("CARD");
    expect(result.content[0].text).toContain("4111111111111111");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      paymentMethods: {
        enroll: rstest.fn().mockResolvedValue({ id: "pm_789", type: "CARD" }),
      },
    };
    const input = {
      customerId: "cus_123456789012345678901234567890123456",
      body: {
        country: "US",
        type: "CARD",
      },
      idempotency_key: "what-ever",
    } as const satisfies { customerId: string; body: PaymentMethodEnrollSchema; idempotency_key: string };
    const result = await paymentMethodEnrollTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.paymentMethods.enroll).toHaveBeenCalledWith(
      input.customerId,
      expect.objectContaining({
        ...input.body,
        account_id: "acc_123456789012345678901234567890123456",
      }),
      expect.any(String),
    );
    expect(result.content[0].text).toContain("pm_789");
    expect(result.content[0].text).toContain("CARD");
  });
});

describe("paymentMethodRetrieveTool", () => {
  const retrieveSchema = z.object({
    customer_id: z.string().min(36).max(64),
    payment_method_id: z.string().min(36).max(64),
  });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      paymentMethods: {
        retrieve: rstest.fn().mockResolvedValue({ id: "pm_123", type: "CARD" }),
      },
    };
    const input = { customer_id: "cus_123456789012345678901234567890123456", payment_method_id: "pm_123456789012345678901234567890123456" };
    const result = await paymentMethodRetrieveTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.paymentMethods.retrieve).toHaveBeenCalledWith(input.customer_id, input.payment_method_id);
    expect(result.content[0].text).toContain("pm_123");
    expect(result.content[0].text).toContain("CARD");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = { payment_method_id: "pm_123456789012345678901234567890123456" };
    const invalidId = { customer_id: null, payment_method_id: null };
    expect(() => retrieveSchema.parse(missingId)).toThrow();
    expect(() => retrieveSchema.parse(invalidId)).toThrow();
  });
});

describe("paymentMethodRetrieveEnrolledTool", () => {
  const retrieveEnrolledSchema = z.object({
    customer_id: z.string().min(36).max(64),
  });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      paymentMethods: {
        retrieveEnrolled: rstest.fn().mockResolvedValue([{ id: "pm_123", type: "CARD" }]),
      },
    };
    const input = { customer_id: "cus_123456789012345678901234567890123456" };
    const result = await paymentMethodRetrieveEnrolledTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.paymentMethods.retrieveEnrolled).toHaveBeenCalledWith(input.customer_id);
    expect(result.content[0].text).toContain("pm_123");
    expect(result.content[0].text).toContain("CARD");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { customer_id: null };
    expect(() => retrieveEnrolledSchema.parse(missingId)).toThrow();
    expect(() => retrieveEnrolledSchema.parse(invalidId)).toThrow();
  });
});

describe("paymentMethodUnenrollTool", () => {
  const unenrollSchema = z.object({
    customer_id: z.string().min(36).max(64),
    payment_method_id: z.string().min(36).max(64),
  });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      paymentMethods: {
        unenroll: rstest.fn().mockResolvedValue({ id: "pm_123", unenrolled: true }),
      },
    };
    const input = { customer_id: "cus_123456789012345678901234567890123456", payment_method_id: "pm_123456789012345678901234567890123456" };
    const result = await paymentMethodUnenrollTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.paymentMethods.unenroll).toHaveBeenCalledWith(input.customer_id, input.payment_method_id);
    expect(result.content[0].text).toContain("pm_123");
    expect(result.content[0].text).toContain("true");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = { payment_method_id: "pm_123456789012345678901234567890123456" };
    const invalidId = { customer_id: null, payment_method_id: null };
    expect(() => unenrollSchema.parse(missingId)).toThrow();
    expect(() => unenrollSchema.parse(invalidId)).toThrow();
  });
});
