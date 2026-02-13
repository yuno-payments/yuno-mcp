import { z } from "zod";

const financialCostSchema = z
  .object({
    type: z.string().min(3).max(255).describe("Financial cost type (e.g., CFT, TEA, CET, CAT)"),
    rate: z.number().min(0).max(100000).describe("Financial cost rate as decimal"),
  })
  .passthrough();

const installmentPlanCreateSchema = z
  .object({
    name: z.string().describe("Name of the installment plan"),
    account_id: z.array(z.string()).optional().describe("Account IDs for the plan"),
    merchant_reference: z.string().describe("Merchant reference for the plan"),
    installments_plan: z
      .array(
        z
          .object({
            installment: z.number().int().describe("Number of monthly installments"),
            rate: z.number().describe("Rate applied to the final amount as a multiplier (e.g., 1.20 for 20%)"),
            financial_costs: z.array(financialCostSchema).optional().describe("Financial costs for this installment option"),
            type: z.enum(["MERCHANT_INSTALLMENTS", "ISSUER_INSTALLMENTS"]).optional().describe("Type of installment plan"),
          })
          .passthrough(),
      )
      .describe("Installments to show the customer"),
    country_code: z.string().min(2).max(2).optional().describe("Country code (ISO 3166-1 alpha-2)"),
    brand: z.array(z.string()).optional().describe("Brands for the plan"),
    issuer: z.string().optional().describe("Issuer for the plan"),
    iin: z.array(z.string()).optional().describe("IINs for the plan"),
    first_installment_deferral: z.number().int().max(3).optional().describe("Months to wait before first installment"),
    amount: z
      .object({
        currency: z.string().min(3).max(3),
        min_value: z.number().optional(),
        max_value: z.number().optional(),
      })
      .passthrough()
      .optional()
      .describe("Amount limits for the plan"),
    availability: z
      .object({
        start_at: z.string().optional(),
        finish_at: z.string().optional(),
      })
      .passthrough()
      .optional()
      .describe("Availability period for the plan"),
  })
  .passthrough();

const installmentPlanUpdateSchema = z
  .object({
    planId: z.string().describe("The unique identifier of the installment plan to update"),
    name: z.string().optional(),
    account_id: z.array(z.string()).optional().describe("Account IDs for the plan"),
    merchant_reference: z.string().optional(),
    installments_plan: z
      .array(
        z
          .object({
            installment: z.number().int().optional(),
            rate: z.number().optional(),
            financial_costs: z.array(financialCostSchema).optional(),
            type: z.enum(["MERCHANT_INSTALLMENTS", "ISSUER_INSTALLMENTS"]).optional(),
          })
          .passthrough(),
      )
      .optional(),
    country_code: z.string().min(2).max(2).optional(),
    scheme: z.string().optional().describe("Card's scheme information"),
    brand: z.array(z.string()).optional(),
    issuer: z.string().optional(),
    iin: z.array(z.string()).optional(),
    first_installment_deferral: z.number().int().max(3).optional(),
    amount: z
      .object({
        currency: z.string().min(3).max(3).optional(),
        min_value: z.number().optional(),
        max_value: z.number().optional(),
      })
      .passthrough()
      .optional(),
    availability: z
      .object({
        start_at: z.string().optional(),
        finish_at: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export { installmentPlanCreateSchema, installmentPlanUpdateSchema };
