import z from "zod";
import { installmentPlanCreateSchema, installmentPlanUpdateSchema } from "../../schemas";

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

export type InstallmentPlanCreateSchema = z.infer<typeof installmentPlanCreateSchema>;

export type InstallmentPlanUpdateSchema = z.infer<typeof installmentPlanUpdateSchema>;
export type InstallmentPlanUpdateBody = Omit<InstallmentPlanUpdateSchema, "planId">;
