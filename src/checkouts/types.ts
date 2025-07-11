import z from "zod";
import { YunoAmount, YunoMetadata, YunoCard, YunoCardData, YunoBrowserInfo, YunoDocument, YunoPhone, YunoAddress } from "../shared/types/common";
import { amountSchema, metadataSchema, cardDataSchema, browserInfoSchema, documentSchema, phoneSchema, addressSchema } from "../shared/types";

export interface YunoInstallmentsPlan {
  installment: number;
  rate: number;
}

export interface YunoInstallments {
  plan_id?: string;
  plan?: YunoInstallmentsPlan[];
}

export interface YunoCheckoutSession {
  account_id?: string;
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

export interface YunoOttCustomer {
  browser_info: YunoBrowserInfo;
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  document?: YunoDocument;
  phone?: YunoPhone;
  billing_address?: YunoAddress;
  shipping_address?: YunoAddress;
}

export interface YunoOttPaymentMethod {
  type: string;
  vault_on_success: boolean;
  card?: YunoCard;
  customer: YunoOttCustomer;
  vaulted_token?: string | null;
}

export interface YunoThreeDSecure {
  three_d_secure_setup_id?: string | null;
}

export interface YunoOttRequest {
  payment_method: YunoOttPaymentMethod;
  three_d_secure: YunoThreeDSecure;
  installment?: any | null;
  third_party_data?: any | null;
  device_fingerprints?: any | null;
}

export interface YunoOttResponseCustomer {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  gender: string;
  phone?: string | null;
  date_of_birth?: string | null;
  billing_address?: any | null;
  shipping_address?: any | null;
  document?: any | null;
  browser_info: YunoBrowserInfo;
  nationality?: string | null;
  device_fingerprint?: any | null;
}

export interface YunoOttResponse {
  token: string;
  vaulted_token?: string | null;
  vault_on_success: boolean;
  type: string;
  card_data?: YunoCardData;
  customer: YunoOttResponseCustomer;
  installment?: any | null;
  country: string;
  customer_session?: any | null;
}

export const checkoutSessionCreateSchema = z.object({
  account_id: z.string().min(36).max(64).describe("The unique identifier of the Yuno account").optional(),
  customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer"),
  merchant_order_id: z.string().min(3).max(255).describe("The unique identifier of the customer's order"),
  payment_description: z.string().min(1).max(255).describe("The description of the payment"),
  callback_url: z.string().min(3).max(526).optional().describe("The URL where we will redirect your customer after making the purchase"),
  country: z.string().min(2).max(2).describe("The customer's country (ISO 3166-1)"),
  amount: amountSchema.describe("Specifies the payment amount object"),
  metadata: metadataSchema,
  installments: z
    .object({
      plan_id: z.string().optional().describe("Plan Id of the installment plan created in Yuno"),
      plan: z
        .array(
          z.object({
            installment: z.number().int().describe("The number of monthly installments"),
            rate: z.number().describe("The rate applied to the final amount (percentage)"),
          }),
        )
        .optional()
        .describe("Installments to show the customer"),
    })
    .optional()
    .describe("The installment plan configuration"),
});

export const ottCreateSchema = z.object({
  sessionId: z.string().describe("The unique identifier of the checkout session"),
  payment_method: z.object({
    type: z.string().describe("Payment method type (e.g., 'CARD', 'NEQUI', etc.)"),
    vault_on_success: z.boolean().describe("Whether to vault the payment method on success"),
    card: cardDataSchema
      .extend({
        expiration_year: z.number().int().min(20).max(99).describe("Card expiration year (YY format)"),
        security_code: z.string().describe("Card security code (CVV)"),
        holder_name: z.string().describe("Cardholder name"),
      })
      .optional(),
    customer: z.object({
      browser_info: browserInfoSchema,
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().email().optional(),
      gender: z.string().optional(),
      date_of_birth: z.string().optional(),
      document: documentSchema.optional(),
      phone: phoneSchema.optional(),
      billing_address: addressSchema.optional(),
      shipping_address: addressSchema.optional(),
    }),
    vaulted_token: z.string().optional().nullable(),
  }),
  three_d_secure: z.object({
    three_d_secure_setup_id: z.string().optional().nullable().describe("3DS setup ID"),
  }),
  installment: z.any().optional().nullable().describe("Installment configuration"),
  third_party_data: z.any().optional().nullable().describe("Third party data"),
  device_fingerprints: z.any().optional().nullable().describe("Device fingerprints"),
});

export type YunoOttCreateSchema = z.infer<typeof ottCreateSchema>;
