import z from "zod";

export interface YunoInstallmentPlan {
  name: string;
  account_id?: string[];
  merchant_reference: string;
  installments_plan?: Array<{
    installment: number;
    rate: number;
    type?: "MERCHANT_INSTALLMENTS" | "ISSUER_INSTALLMENTS";
  }>;
  country_code: string;
  brand?: string[];
  issuer?: string;
  iin?: string[];
  first_installment_deferral?: number;
  amount?: {
    currency: string;
    min_value?: number;
    max_value?: number;
  };
  availability?: {
    start_at: string;
    finish_at: string;
  };
}

export const installmentPlanCreateSchema = z.object({
  name: z.string().describe("Name of the installment plan"),
  account_id: z.array(z.string()).optional().describe("Account IDs for the plan"),
  merchant_reference: z.string().describe("Merchant reference for the plan"),
  installments_plan: z
    .array(
      z.object({
        installment: z.number().int().describe("Number of monthly installments"),
        rate: z.number().describe("Rate applied to the final amount (percentage)"),
        type: z.enum(["MERCHANT_INSTALLMENTS", "ISSUER_INSTALLMENTS"]).optional().describe("Type of installment plan"),
      }),
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
    .optional()
    .describe("Amount limits for the plan"),
  availability: z
    .object({
      start_at: z.string(),
      finish_at: z.string(),
    })
    .optional()
    .describe("Availability period for the plan"),
});

export type InstallmentPlanCreateSchema = z.infer<typeof installmentPlanCreateSchema>;

export const installmentPlanUpdateSchema = z.object({
  planId: z.string().describe("The unique identifier of the installment plan to update"),
  name: z.string().optional(),
  installments_plan: z
    .array(
      z.object({
        installment: z.number().int().optional(),
        rate: z.number().optional(),
        type: z.enum(["MERCHANT_INSTALLMENTS", "ISSUER_INSTALLMENTS"]).optional(),
      }),
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
    .optional(),
  availability: z
    .object({
      start_at: z.string().optional(),
      finish_at: z.string().optional(),
    })
    .optional(),
});

export type InstallmentPlanUpdateSchema = z.infer<typeof installmentPlanUpdateSchema>;
export type InstallmentPlanUpdateBody = Omit<InstallmentPlanUpdateSchema, "planId">;