import z from "zod";
import { YunoAmount, YunoMetadata } from "../shared/types/common";
import { amountSchema, metadataSchema } from "../shared/types";

export interface YunoInstallmentsPlan {
  installment: number;
  rate: number;
}

export interface YunoInstallments {
  plan_id?: string;
  plan?: YunoInstallmentsPlan[];
}

export interface YunoCheckoutSession {
  amount: YunoAmount;
  customer_id?: string;
  merchant_order_id: string;
  payment_description: string;
  country?: string;
  callback_url?: string;
  metadata?: YunoMetadata[];
  installments?: YunoInstallments;
}

export interface YunoCheckoutPaymentMethod {
  type: string;
  name: string;
  category?: string;
  provider?: string;
  status?: string;
  vaulted_token?: string;
  [key: string]: any;
}

export interface YunoCheckoutPaymentMethodsResponse {
  payment_methods: YunoCheckoutPaymentMethod[];
}

export const checkoutSessionCreateSchema = z.object({
  customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer"),
  merchant_order_id: z.string().min(3).max(255).describe("The unique identifier of the customer's order"),
  payment_description: z.string().min(1).max(255).describe("The description of the payment"),
  callback_url: z.string().min(3).max(526).optional().describe("The URL where we will redirect your customer after making the purchase"),
  country: z.string().min(2).max(2).describe("The customer's country (ISO 3166-1)"),
  amount: amountSchema.describe("Specifies the payment amount object"),
  metadata: metadataSchema,
  installments: z.object({
    plan_id: z.string().optional().describe("Plan Id of the installment plan created in Yuno"),
    plan: z.array(
      z.object({
        installment: z.number().int().describe("The number of monthly installments"),
        rate: z.number().describe("The rate applied to the final amount (percentage)")
      })
    ).optional().describe("Installments to show the customer")
  }).optional().describe("The installment plan configuration")
});
