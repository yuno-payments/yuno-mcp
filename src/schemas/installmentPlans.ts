import { z } from "zod";

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
            rate: z.number().describe("Rate applied to the final amount (percentage)"),
            type: z.enum(["MERCHANT_INSTALLMENTS", "ISSUER_INSTALLMENTS"]).optional().describe("Type of installment plan"),
          })
          .passthrough(),
      )
      .describe("Installments to show the customer"),
    country_code: z.string().describe("Country code (ISO 3166-1 alpha-2)"),
    brand: z.array(z.string()).optional().describe("Brands for the plan"),
    issuer: z.string().optional().describe("Issuer for the plan"),
    iin: z.array(z.string()).optional().describe("IINs for the plan"),
    first_installment_deferral: z.number().int().optional().describe("First installment deferral"),
    amount: z
      .object({
        currency: z.string(),
        min_value: z.number().optional(),
        max_value: z.number().optional(),
      })
      .passthrough()
      .optional()
      .describe("Amount limits for the plan"),
    availability: z
      .object({
        start_at: z.string(),
        finish_at: z.string(),
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
    installments_plan: z
      .array(
        z
          .object({
            installment: z.number().int().optional(),
            rate: z.number().optional(),
            type: z.enum(["MERCHANT_INSTALLMENTS", "ISSUER_INSTALLMENTS"]).optional(),
          })
          .passthrough(),
      )
      .optional(),
    brand: z.array(z.string()).optional(),
    issuer: z.string().optional(),
    iin: z.array(z.string()).optional(),
    first_installment_deferral: z.number().int().optional(),
    amount: z
      .object({
        currency: z.string().optional(),
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
