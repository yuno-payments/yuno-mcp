import { z } from "zod";
import { amountSchema, cardDataSchema, metadataSchema } from "./shared";

const subscriptionCreateSchema = z
  .object({
    account_id: z.string().optional().describe("Account ID for the subscription"),
    name: z.string().min(3).max(255).describe("The name of the subscription"),
    description: z.string().min(3).max(255).optional().describe("The description of the subscription"),
    merchant_reference: z.string().min(3).max(255).optional().describe("Merchant reference for the subscription"),
    country: z.string().min(2).max(2).describe("Country (ISO 3166-1)"),
    amount: amountSchema,
    additional_data: z.any().optional().describe("Additional data for the subscription"),
    frequency: z
      .object({
        type: z.enum(["DAY", "WEEK", "MONTH"]),
        value: z.number(),
      })
      .passthrough()
      .optional()
      .describe("Frequency of the subscription"),
    billing_cycles: z
      .object({
        total: z.number(),
      })
      .passthrough()
      .optional()
      .describe("Total billing cycles"),
    customer_payer: z
      .object({
        id: z.string().describe("The unique identifier of the customer"),
      })
      .passthrough(),
    payment_method: z
      .object({
        type: z.string(),
        vaulted_token: z.string().optional(),
      })
      .passthrough()
      .optional()
      .describe("Payment method for the subscription"),
    trial_period: z.any().optional().describe("Trial period for the subscription"),
    availability: z.any().optional().describe("Availability for the subscription"),
    metadata: metadataSchema,
    retries: z.any().optional().describe("Retries for the subscription"),
    initial_payment_validation: z.boolean().optional().describe("Initial payment validation flag"),
    billing_date: z.any().optional().describe("Billing date for the subscription"),
  })
  .passthrough();

const subscriptionUpdateSchema = z
  .object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to update"),
    name: z.string().optional(),
    description: z.string().optional(),
    merchant_reference: z.string().optional(),
    country: z.string().optional(),
    amount: z
      .object({
        currency: z.string(),
        value: z.number(),
      })
      .passthrough()
      .optional(),
    frequency: z
      .object({
        type: z.enum(["DAY", "WEEK", "MONTH"]),
        value: z.number(),
      })
      .passthrough()
      .optional(),
    billing_cycles: z
      .object({
        total: z.number(),
      })
      .passthrough()
      .optional(),
    customer_payer: z
      .object({
        id: z.string(),
      })
      .passthrough()
      .optional(),
    payment_method: z
      .object({
        type: z.string(),
        vaulted_token: z.string(),
        card: z
          .object({
            verify: z.boolean().optional(),
            card_data: cardDataSchema.optional(),
          })
          .passthrough()
          .optional(),
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
    retries: z
      .object({
        retry_on_decline: z.boolean().optional(),
        amount: z.number().optional(),
      })
      .passthrough()
      .optional(),
    metadata: metadataSchema,
  })
  .passthrough();

export { subscriptionCreateSchema, subscriptionUpdateSchema };
