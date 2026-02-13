import { expect, it, describe, rstest } from "@rstest/core";
import {
  subscriptionCreateTool,
  subscriptionRetrieveTool,
  subscriptionPauseTool,
  subscriptionResumeTool,
  subscriptionUpdateTool,
  subscriptionCancelTool,
} from "../src/tools/subscriptions";
import { subscriptionCreateSchema, subscriptionUpdateSchema } from "../src/schemas";
import z from "zod";
import { SubscriptionCreateSchema, SubscriptionUpdateSchema } from "../src/tools/subscriptions/types";

describe("subscriptionCreateTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      subscriptions: {
        create: rstest.fn().mockResolvedValue({ id: "sub_123", name: "Test Sub" }),
      },
      accountCode: "acc_1",
    };
    const input = {
      name: "Test Sub",
      country: "US",
      amount: { currency: "USD", value: 100 },
    } as const satisfies SubscriptionCreateSchema;
    const result = await subscriptionCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.create).toHaveBeenCalledWith({ ...input, account_id: "acc_1" });
    expect(result.content[0].text).toContain("sub_123");
    expect(result.content[0].text).toContain("Test Sub");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = {
      name: "Test Sub",
      country: "US",
      amount: { currency: "USD", value: 100 },
    };
    expect(() => subscriptionCreateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingName = { country: "US", amount: { currency: "USD", value: 100 } };
    const missingCountry = { name: "Test Sub", amount: { currency: "USD", value: 100 } };
    const missingAmount = { name: "Test Sub", country: "US" };
    const invalidCountry = { name: "Test Sub", country: "U", amount: { currency: "USD", value: 100 } };
    expect(() => subscriptionCreateSchema.parse(missingName)).toThrow();
    expect(() => subscriptionCreateSchema.parse(missingCountry)).toThrow();
    expect(() => subscriptionCreateSchema.parse(missingAmount)).toThrow();
    expect(() => subscriptionCreateSchema.parse(invalidCountry)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      subscriptions: {
        create: rstest.fn().mockResolvedValue({ id: "sub_456", name: "Full Sub", metadata: [] }),
      },
      accountCode: "acc_1",
    };
    const input = {
      name: "Full Sub",
      description: "A full subscription",
      merchant_reference: "ref-123",
      country: "US",
      amount: { currency: "USD", value: 200 },
      additional_data: {},
      frequency: { type: "MONTH", value: 1 },
      billing_cycles: { total: 12 },
      customer_payer: { id: "cus_2" },
      payment_method: { type: "CARD", vaulted_token: "vault_1" },
      trial_period: {},
      availability: {},
      metadata: [],
      retries: {},
      initial_payment_validation: true,
      billing_date: {},
    } as const satisfies SubscriptionCreateSchema;
    const result = await subscriptionCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.create).toHaveBeenCalledWith({ ...input, account_id: "acc_1" });
    expect(result.content[0].text).toContain("sub_456");
    expect(result.content[0].text).toContain("Full Sub");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      subscriptions: {
        create: rstest.fn().mockResolvedValue({ id: "sub_789", name: "Minimal Sub" }),
      },
      accountCode: "acc_1",
    };
    const input = {
      name: "Minimal Sub",
      country: "US",
      amount: { currency: "USD", value: 50 },
    };
    const result = await subscriptionCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.create).toHaveBeenCalledWith({ ...input, account_id: "acc_1" });
    expect(result.content[0].text).toContain("sub_789");
    expect(result.content[0].text).toContain("Minimal Sub");
  });
});

describe("subscriptionRetrieveTool", () => {
  const schema = z.object({ subscriptionId: z.string() });
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      subscriptions: {
        retrieve: rstest.fn().mockResolvedValue({ id: "sub_123", name: "Test Sub" }),
      },
    };
    const input = { subscriptionId: "sub_123" };
    const result = await subscriptionRetrieveTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.retrieve).toHaveBeenCalledWith("sub_123");
    expect(result.content[0].text).toContain("sub_123");
    expect(result.content[0].text).toContain("Test Sub");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { subscriptionId: null };
    expect(() => schema.parse(missingId)).toThrow();
    expect(() => schema.parse(invalidId)).toThrow();
  });
});

describe("subscriptionPauseTool", () => {
  const schema = z.object({ subscriptionId: z.string() });
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      subscriptions: {
        pause: rstest.fn().mockResolvedValue({ id: "sub_123", status: "paused" }),
      },
    };
    const input = { subscriptionId: "sub_123" };
    const result = await subscriptionPauseTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.pause).toHaveBeenCalledWith("sub_123");
    expect(result.content[0].text).toContain("paused");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { subscriptionId: null };
    expect(() => schema.parse(missingId)).toThrow();
    expect(() => schema.parse(invalidId)).toThrow();
  });
});

describe("subscriptionResumeTool", () => {
  const schema = z.object({ subscriptionId: z.string() });
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      subscriptions: {
        resume: rstest.fn().mockResolvedValue({ id: "sub_123", status: "active" }),
      },
    };
    const input = { subscriptionId: "sub_123" };
    const result = await subscriptionResumeTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.resume).toHaveBeenCalledWith("sub_123");
    expect(result.content[0].text).toContain("active");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { subscriptionId: null };
    expect(() => schema.parse(missingId)).toThrow();
    expect(() => schema.parse(invalidId)).toThrow();
  });
});

describe("subscriptionUpdateTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      subscriptions: {
        update: rstest.fn().mockResolvedValue({ id: "sub_123", name: "Updated Sub" }),
      },
    };
    const input = { subscriptionId: "sub_123", name: "Updated Sub" };
    const result = await subscriptionUpdateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.update).toHaveBeenCalledWith("sub_123", { name: "Updated Sub" });
    expect(result.content[0].text).toContain("sub_123");
    expect(result.content[0].text).toContain("Updated Sub");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = { subscriptionId: "sub_123" };
    expect(() => subscriptionUpdateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = { name: "fail" };
    const invalidId = { subscriptionId: null, name: "fail" };
    expect(() => subscriptionUpdateSchema.parse(missingId)).toThrow();
    expect(() => subscriptionUpdateSchema.parse(invalidId)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      subscriptions: {
        update: rstest.fn().mockResolvedValue({ id: "sub_456", name: "Full Sub", metadata: [] }),
      },
    };
    const input = {
      subscriptionId: "sub_456",
      name: "Full Sub",
      description: "A full subscription",
      merchant_reference: "ref-456",
      country: "US",
      amount: { currency: "USD", value: 200 },
      frequency: { type: "MONTH", value: 1 },
      billing_cycles: { total: 12 },
      customer_payer: { id: "cus_2" },
      payment_method: {
        type: "CARD",
        vaulted_token: "vault_1",
        card: {
          verify: true,
          card_data: { number: "4111111111111111", expiration_month: 12, expiration_year: 2030, security_code: "123", holder_name: "Test User" },
        },
      },
      availability: { start_at: "2024-01-01", finish_at: "2024-12-31" },
      retries: { retry_on_decline: true, amount: 10 },
      metadata: [],
    } as const satisfies SubscriptionUpdateSchema;
    const result = await subscriptionUpdateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    const { subscriptionId, ...updateFields } = input;
    expect(mockYunoClient.subscriptions.update).toHaveBeenCalledWith(subscriptionId, updateFields);
    expect(result.content[0].text).toContain("sub_456");
    expect(result.content[0].text).toContain("Full Sub");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      subscriptions: {
        update: rstest.fn().mockResolvedValue({ id: "sub_789", name: "Minimal Sub" }),
      },
    };
    const input = { subscriptionId: "sub_789" };
    const result = await subscriptionUpdateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.update).toHaveBeenCalledWith("sub_789", {});
    expect(result.content[0].text).toContain("sub_789");
    expect(result.content[0].text).toContain("Minimal Sub");
  });
});

describe("subscriptionCancelTool", () => {
  const schema = z.object({ subscriptionId: z.string() });
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      subscriptions: {
        cancel: rstest.fn().mockResolvedValue({ id: "sub_123", status: "cancelled" }),
      },
    };
    const input = { subscriptionId: "sub_123" };
    const result = await subscriptionCancelTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.subscriptions.cancel).toHaveBeenCalledWith("sub_123");
    expect(result.content[0].text).toContain("cancelled");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { subscriptionId: null };
    expect(() => schema.parse(missingId)).toThrow();
    expect(() => schema.parse(invalidId)).toThrow();
  });
});
