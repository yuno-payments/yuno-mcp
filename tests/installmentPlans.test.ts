import {
  installmentPlanCreateTool,
  installmentPlanUpdateTool,
  installmentPlanRetrieveTool,
  installmentPlanDeleteTool,
} from "../src/installmentPlans";
import { installmentPlanCreateSchema, installmentPlanUpdateSchema } from "../src/installmentPlans/types";
import z from "zod";

describe("installmentPlanCreateTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      accountCode: "acc_123",
      installmentPlans: {
        create: jest.fn().mockResolvedValue({ id: "plan_123", name: "Plan 1" }),
      },
    };
    const input = {
      name: "Plan 1",
      merchant_reference: "ref_1",
      installments_plan: [{ installment: 3, rate: 1.5 }],
      country_code: "US",
    };
    const result = await installmentPlanCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.installmentPlans.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...input,
        account_id: "acc_123",
      }),
    );
    expect(result.content[0].text).toContain("plan_123");
    expect(result.content[0].text).toContain("Plan 1");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = {
      name: "Plan 1",
      merchant_reference: "ref_1",
      installments_plan: [{ installment: 3, rate: 1.5 }],
      country_code: "US",
    };
    expect(() => installmentPlanCreateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingName = {
      merchant_reference: "ref_1",
      installments_plan: [{ installment: 3, rate: 1.5 }],
      country_code: "US",
    };
    const invalidInstallments = {
      name: "Plan 1",
      merchant_reference: "ref_1",
      installments_plan: null,
      country_code: "US",
    };
    expect(() => installmentPlanCreateSchema.parse(missingName)).toThrow();
    expect(() => installmentPlanCreateSchema.parse(invalidInstallments)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      accountCode: "acc_123",
      installmentPlans: {
        create: jest.fn().mockResolvedValue({ id: "plan_456", name: "Full Plan", brand: [] }),
      },
    };
    const input = {
      name: "Full Plan",
      account_id: ["acc_123"],
      merchant_reference: "ref_full",
      installments_plan: [{ installment: 6, rate: 2.0, type: "MERCHANT_INSTALLMENTS" }],
      country_code: "US",
      brand: [],
      issuer: "Bank",
      iin: [],
      first_installment_deferral: 1,
      amount: { currency: "USD", min_value: 10, max_value: 1000 },
      availability: { start_at: "2024-01-01", finish_at: "2024-12-31" },
    };
    const result = await installmentPlanCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.installmentPlans.create).toHaveBeenCalledWith({ ...input, account_id: ["acc_123"] });
    expect(result.content[0].text).toContain("plan_456");
    expect(result.content[0].text).toContain("Full Plan");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      accountCode: "acc_123",
      installmentPlans: {
        create: jest.fn().mockResolvedValue({ id: "plan_789", name: "Minimal Plan" }),
      },
    };
    const input = {
      name: "Minimal Plan",
      merchant_reference: "ref_min",
      installments_plan: [{ installment: 1, rate: 0.5 }],
      country_code: "US",
    };
    const result = await installmentPlanCreateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.installmentPlans.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...input,
        account_id: "acc_123",
      }),
    );
    expect(result.content[0].text).toContain("plan_789");
    expect(result.content[0].text).toContain("Minimal Plan");
  });
});

describe("installmentPlanUpdateTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      installmentPlans: {
        update: jest.fn().mockResolvedValue({ id: "plan_123", name: "Updated Plan" }),
      },
    };
    const input = {
      planId: "plan_123",
      name: "Updated Plan",
    };
    const result = await installmentPlanUpdateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.installmentPlans.update).toHaveBeenCalledWith("plan_123", { name: "Updated Plan" });
    expect(result.content[0].text).toContain("plan_123");
    expect(result.content[0].text).toContain("Updated Plan");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = { planId: "plan_123" };
    expect(() => installmentPlanUpdateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = { name: "fail" };
    const invalidId = { planId: null, name: "fail" };
    expect(() => installmentPlanUpdateSchema.parse(missingId)).toThrow();
    expect(() => installmentPlanUpdateSchema.parse(invalidId)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      installmentPlans: {
        update: jest.fn().mockResolvedValue({ id: "plan_456", name: "Full Update", brand: [] }),
      },
    };
    const input = {
      planId: "plan_456",
      name: "Full Update",
      installments_plan: [{ installment: 12, rate: 3.0, type: "ISSUER_INSTALLMENTS" }],
      brand: [],
      issuer: "Bank",
      iin: [],
      first_installment_deferral: 2,
      amount: { currency: "USD", min_value: 20, max_value: 2000 },
      availability: { start_at: "2024-06-01", finish_at: "2024-12-31" },
    };
    const result = await installmentPlanUpdateTool.handler(mockYunoClient as any, input);
    const { planId, ...updateFields } = input;
    expect(mockYunoClient.installmentPlans.update).toHaveBeenCalledWith(planId, updateFields);
    expect(result.content[0].text).toContain("plan_456");
    expect(result.content[0].text).toContain("Full Update");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      installmentPlans: {
        update: jest.fn().mockResolvedValue({ id: "plan_789", name: "Minimal Update" }),
      },
    };
    const input = { planId: "plan_789" };
    const result = await installmentPlanUpdateTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.installmentPlans.update).toHaveBeenCalledWith("plan_789", {});
    expect(result.content[0].text).toContain("plan_789");
    expect(result.content[0].text).toContain("Minimal Update");
  });
});

describe("installmentPlanRetrieveTool", () => {
  const retrieveSchema = z.object({ planId: z.string() });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      installmentPlans: {
        retrieve: jest.fn().mockResolvedValue({ id: "plan_123", name: "Plan 1" }),
      },
    };
    const input = { planId: "plan_123" };
    const result = await installmentPlanRetrieveTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.installmentPlans.retrieve).toHaveBeenCalledWith("plan_123");
    expect(result.content[0].text).toContain("plan_123");
    expect(result.content[0].text).toContain("Plan 1");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { planId: null };
    expect(() => retrieveSchema.parse(missingId)).toThrow();
    expect(() => retrieveSchema.parse(invalidId)).toThrow();
  });
});

describe("installmentPlanDeleteTool", () => {
  const deleteSchema = z.object({ planId: z.string() });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      installmentPlans: {
        delete: jest.fn().mockResolvedValue({ id: "plan_123", deleted: true }),
      },
    };
    const input = { planId: "plan_123" };
    const result = await installmentPlanDeleteTool.handler(mockYunoClient as any, input);
    expect(mockYunoClient.installmentPlans.delete).toHaveBeenCalledWith("plan_123");
    expect(result.content[0].text).toContain("plan_123");
    expect(result.content[0].text).toContain("true");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { planId: null };
    expect(() => deleteSchema.parse(missingId)).toThrow();
    expect(() => deleteSchema.parse(invalidId)).toThrow();
  });
});
