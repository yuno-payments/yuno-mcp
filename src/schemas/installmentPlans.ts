import { z } from "zod";

const financialCostSchema = z
  .object({
    type: z.string().min(3).max(255).describe("Financial cost type (e.g., CFT, TEA, CET, CAT)"),
    rate: z.number().min(0).max(100000).describe("Financial cost rate as decimal"),
  })
  .passthrough();

const installmentPlanCreateSchema = z
  .object({
    name: z.string().min(1).max(255).describe("Name of the installment plan"),
    account_id: z.array(z.string()).nullish().describe("Account IDs for the plan"),
    merchant_reference: z.string().describe("Merchant reference for the plan"),
    installments_plan: z
      .array(
        z
          .object({
            installment: z.number().int().describe("Number of monthly installments"),
            rate: z.number().describe("Rate applied to the final amount as a multiplier (e.g., 1.20 for 20%)"),
            financial_costs: z.array(financialCostSchema).nullish().describe("Financial costs for this installment option"),
            type: z.enum(["MERCHANT_INSTALLMENTS", "ISSUER_INSTALLMENTS"]).nullish().describe("Type of installment plan"),
          })
          .passthrough(),
      )
      .describe("Installments to show the customer"),
    country_code: z.string().min(2).max(2).describe("Country code (ISO 3166-1 alpha-2)"),
    brand: z.array(z.string()).nullish().describe("Brands for the plan"),
    issuer: z.string().nullish().describe("Issuer for the plan"),
    iin: z.array(z.string()).nullish().describe("IINs for the plan"),
    first_installment_deferral: z.number().int().max(3).nullish().describe("Months to wait before first installment"),
    amount: z
      .object({
        currency: z.string().min(3).max(3),
        min_value: z.number().nullish(),
        max_value: z.number().nullish(),
      })
      .passthrough()
      .describe("Amount limits for the plan"),
    availability: z
      .object({
        start_at: z.string().nullish(),
        finish_at: z.string().nullish(),
      })
      .passthrough()
      .nullish()
      .describe("Availability period for the plan"),
  })
  .passthrough();

const installmentPlanUpdateSchema = z
  .object({
    planId: z.string().describe("The unique identifier of the installment plan to update"),
    name: z.string().nullish(),
    account_id: z.array(z.string()).nullish().describe("Account IDs for the plan"),
    merchant_reference: z.string().nullish(),
    installments_plan: z
      .array(
        z
          .object({
            installment: z.number().int().nullish(),
            rate: z.number().nullish(),
            financial_costs: z.array(financialCostSchema).nullish(),
            type: z.enum(["MERCHANT_INSTALLMENTS", "ISSUER_INSTALLMENTS"]).nullish(),
          })
          .passthrough(),
      )
      .nullish(),
    country_code: z.string().min(2).max(2).nullish(),
    scheme: z.string().nullish().describe("Card's scheme information"),
    brand: z.array(z.string()).nullish(),
    issuer: z.string().nullish(),
    iin: z.array(z.string()).nullish(),
    first_installment_deferral: z.number().int().max(3).nullish(),
    amount: z
      .object({
        currency: z.string().min(3).max(3).nullish(),
        min_value: z.number().nullish(),
        max_value: z.number().nullish(),
      })
      .passthrough()
      .nullish(),
    availability: z
      .object({
        start_at: z.string().nullish(),
        finish_at: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const yunoInstallmentPlanOutputSchema = z
  .object({
    name: z.string(),
    account_id: z.array(z.string()).nullish(),
    merchant_reference: z.string(),
    installments_plan: z
      .array(
        z
          .object({
            installment: z.number(),
            rate: z.number(),
            financial_costs: z
              .array(
                z
                  .object({
                    type: z.string(),
                    rate: z.number(),
                  })
                  .passthrough(),
              )
              .nullish(),
            type: z.string().nullish(),
          })
          .passthrough(),
      )
      .nullish(),
    country_code: z.string().nullish(),
    brand: z.array(z.string()).nullish(),
    issuer: z.string().nullish(),
    iin: z.array(z.string()).nullish(),
    first_installment_deferral: z.number().nullish(),
    amount: z
      .object({
        currency: z.string().nullish(),
        min_value: z.number().nullish(),
        max_value: z.number().nullish(),
      })
      .passthrough()
      .nullish(),
    availability: z
      .object({
        start_at: z.string().nullish(),
        finish_at: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const yunoInstallmentPlanListOutputSchema = z
  .object({
    items: z.array(yunoInstallmentPlanOutputSchema).nullish(),
  })
  .passthrough();

export {
  installmentPlanCreateSchema,
  installmentPlanUpdateSchema,
  yunoInstallmentPlanOutputSchema,
  yunoInstallmentPlanListOutputSchema,
};
