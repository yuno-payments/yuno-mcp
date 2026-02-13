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
        value: z.number().optional(),
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
      .passthrough()
      .optional(),
    payment_method: z
      .object({
        type: z.enum(["CARD"]).describe("Payment method type"),
        vaulted_token: z.string().optional().describe("Vaulted token for enrolled card"),
        card: z
          .object({
            installments: z.number().int().min(1).max(50).optional().describe("Number of installments"),
            network_transaction_id: z.string().optional().describe("Visa/Mastercard ID from initial payment"),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional()
      .describe("Payment method for the subscription"),
    trial_period: z
      .object({
        billing_cycles: z.number().int().min(1).optional().describe("Trial duration in billing cycles"),
        amount: amountSchema.optional().describe("Discounted amount during trial"),
      })
      .passthrough()
      .optional()
      .describe("Trial period for the subscription"),
    availability: z
      .object({
        start_at: z.string().optional().describe("Start date (ISO 8601)"),
        finish_at: z.string().optional().describe("End date (ISO 8601)"),
      })
      .passthrough()
      .optional()
      .describe("Availability for the subscription"),
    metadata: metadataSchema,
    retries: z
      .object({
        retry_on_decline: z.boolean().optional().describe("Enable retry logic"),
        amount: z.number().int().max(6).optional().describe("Retry count (max 6)"),
        strategy: z.string().optional().describe("Schedule strategy"),
        schedule: z
          .array(
            z
              .object({
                attempt: z.number().optional(),
                delay_seconds: z.number().optional(),
              })
              .passthrough(),
          )
          .optional()
          .describe("Per-attempt schedule"),
        stop_on_hard_decline: z.boolean().optional().describe("Halt retries after hard decline"),
      })
      .passthrough()
      .optional()
      .describe("Retries for the subscription"),
    initial_payment_validation: z.boolean().optional().describe("Initial payment validation flag"),
    billing_date: z
      .object({
        type: z.enum(["PREPAID", "POSTDATE", "DAY"]).optional().describe("Billing date type"),
        day: z.number().int().min(1).max(31).optional().describe("Day of month for DAY type"),
      })
      .passthrough()
      .optional()
      .describe("Billing date for the subscription"),
  })
  .passthrough();

const subscriptionUpdateSchema = z
  .object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to update"),
    account_id: z.string().optional().describe("Account ID"),
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
        value: z.number().optional(),
        monthly_billing_day: z.number().int().min(1).max(31).optional().describe("Monthly billing day"),
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
        type: z.enum(["CARD"]).optional(),
        vaulted_token: z.string().optional(),
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
