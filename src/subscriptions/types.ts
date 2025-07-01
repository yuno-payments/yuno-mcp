import z from "zod";
import { YunoAdditionalData } from "../shared/types/additionalData";
import { YunoAmount, YunoMetadata } from "../shared/types/common";
import { amountSchema, cardDataSchema, metadataSchema } from "../shared/types";

export interface YunoSubscription {
  account_id?: string;
  name?: string;
  description?: string;
  merchant_reference?: string;
  amount?: {
    currency: string;
    value: number;
  };
  status?: string;
  additional_data?: YunoAdditionalData;
  frequency?: {
    type: "DAY" | "WEEK" | "MONTH";
    value: number;
  };
  billing_cycles?: {
    total: number;
  }; 
  payment_method?: {
    type?: string;
    vaulted_token?: string;
    card?: {
      card_data?: {
        number: string;
        expiration_month: number;
        expiration_year: number;
        security_code: string | number;
        holder_name: string;
      };
    };
    [key: string]: any;
  };
  trial_period?: {
    billing_cycles?: string;
    amount?: YunoAmount;
  }
  availability?: {
    start_at?: string;
    finish_at?: string;
  },
  metadata?: YunoMetadata[];
}

export const subscriptionCreateSchema = z.object({
  account_id: z.string().optional().describe("Account ID for the subscription"),
  name: z.string().min(3).max(255).describe("The name of the subscription"),
  description: z.string().min(3).max(255).optional().describe("The description of the subscription"),
  merchant_reference: z.string().min(3).max(255).optional().describe("Merchant reference for the subscription"),
  country: z.string().min(2).max(2).describe("Country (ISO 3166-1)"),
  amount: amountSchema,
  additional_data: z.any().optional().describe("Additional data for the subscription"),
  frequency: z.object({
    type: z.enum(["DAY", "WEEK", "MONTH"]),
    value: z.number(),
  }).optional().describe("Frequency of the subscription"),
  billing_cycles: z.object({
    total: z.number(),
  }).optional().describe("Total billing cycles"),
  customer_payer: z.object({
    id: z.string().describe("The unique identifier of the customer"),
  }),
  payment_method: z.object({
    type: z.string(),
    vaulted_token: z.string().optional(),
  }).optional().describe("Payment method for the subscription"),
  trial_period: z.any().optional().describe("Trial period for the subscription"),
  availability: z.any().optional().describe("Availability for the subscription"),
  metadata: metadataSchema,
  retries: z.any().optional().describe("Retries for the subscription"),
  initial_payment_validation: z.boolean().optional().describe("Initial payment validation flag"),
  billing_date: z.any().optional().describe("Billing date for the subscription"),
});

export const subscriptionUpdateSchema = z.object({
  subscriptionId: z.string().describe("The unique identifier of the subscription to update"),
  name: z.string().optional(),
  description: z.string().optional(),
  merchant_reference: z.string().optional(),
  country: z.string().optional(),
  amount: z.object({
    currency: z.string(),
    value: z.number(),
  }).optional(),
  frequency: z.object({
    type: z.enum(["DAY", "WEEK", "MONTH"]),
    value: z.number(),
  }).optional(),
  billing_cycles: z.object({
    total: z.number(),
  }).optional(),
  customer_payer: z.object({
    id: z.string(),
  }).optional(),
  payment_method: z.object({
    type: z.string(),
    vaulted_token: z.string(),
    card: z.object({
      verify: z.boolean().optional(),
      card_data: cardDataSchema.optional(),
    }).optional(),
  }).optional(),
  availability: z.object({
    start_at: z.string().optional(),
    finish_at: z.string().optional(),
  }).optional(),
  retries: z.object({
    retry_on_decline: z.boolean().optional(),
    amount: z.number().optional(),
  }).optional(),
  metadata: metadataSchema,
});
