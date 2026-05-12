import { z } from "zod";
import { amountSchema, cardDataSchema, metadataSchema } from "./shared";

const yunoSubscriptionOutputSchema = z
  .object({
    account_id: z.string().nullish(),
    name: z.string().nullish(),
    description: z.string().nullish(),
    merchant_reference: z.string().nullish(),
    amount: z
      .object({
        currency: z.string(),
        value: z.number(),
      })
      .passthrough()
      .nullish(),
    status: z.string().nullish(),
    additional_data: z.any().nullish(),
    frequency: z
      .object({
        type: z.enum(["DAY", "WEEK", "MONTH"]),
        value: z.number().nullish(),
      })
      .passthrough()
      .nullish(),
    billing_cycles: z
      .object({
        total: z.number(),
      })
      .passthrough()
      .nullish(),
    payment_method: z
      .object({
        type: z.enum(["CARD"]).nullish(),
        vaulted_token: z.string().nullish(),
        card: z
          .object({
            installments: z.number().nullish(),
            network_transaction_id: z.string().nullish(),
            verify: z.boolean().nullish(),
            card_data: z
              .object({
                number: z.string(),
                expiration_month: z.number(),
                expiration_year: z.number(),
                security_code: z.union([z.string(), z.number()]),
                holder_name: z.string(),
              })
              .passthrough()
              .nullish(),
          })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
    trial_period: z
      .object({
        billing_cycles: z.number().nullish(),
        amount: amountSchema.nullish(),
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
    metadata: metadataSchema,
  })
  .passthrough();

const subscriptionCreateSchema = z
  .object({
    account_id: z.string().nullish().describe("Account ID for the subscription"),
    name: z.string().min(3).max(255).describe("The name of the subscription"),
    description: z.string().min(3).max(255).nullish().describe("The description of the subscription"),
    merchant_reference: z.string().min(3).max(255).nullish().describe("Merchant reference for the subscription"),
    country: z.string().min(2).max(2).describe("Country (ISO 3166-1)"),
    amount: amountSchema,
    additional_data: z.any().nullish().describe("Additional data for the subscription"),
    frequency: z
      .object({
        type: z.enum(["DAY", "WEEK", "MONTH"]),
        value: z.number().nullish(),
      })
      .passthrough()
      .nullish()
      .describe("Frequency of the subscription"),
    billing_cycles: z
      .object({
        total: z.number(),
      })
      .passthrough()
      .nullish()
      .describe("Total billing cycles"),
    customer_payer: z
      .object({
        id: z.string().describe("The unique identifier of the customer"),
      })
      .passthrough()
      .nullish(),
    payment_method: z
      .object({
        type: z.enum(["CARD"]).describe("Payment method type"),
        vaulted_token: z.string().describe("Vaulted token for enrolled card"),
        card: z
          .object({
            installments: z.number().int().min(1).max(50).nullish().describe("Number of installments"),
            network_transaction_id: z.string().nullish().describe("Visa/Mastercard ID from initial payment"),
          })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .describe("Payment method for the subscription"),
    trial_period: z
      .object({
        billing_cycles: z.number().int().min(1).nullish().describe("Trial duration in billing cycles"),
        amount: amountSchema.nullish().describe("Discounted amount during trial"),
      })
      .passthrough()
      .nullish()
      .describe("Trial period for the subscription"),
    availability: z
      .object({
        start_at: z.string().nullish().describe("Start date (ISO 8601)"),
        finish_at: z.string().nullish().describe("End date (ISO 8601)"),
      })
      .passthrough()
      .nullish()
      .describe("Availability for the subscription"),
    metadata: metadataSchema,
    retries: z
      .object({
        retry_on_decline: z.boolean().nullish().describe("Enable retry logic"),
        amount: z.number().int().max(6).nullish().describe("Retry count (max 6)"),
        strategy: z.string().nullish().describe("Schedule strategy"),
        schedule: z
          .array(
            z
              .object({
                attempt: z.number().nullish(),
                delay_seconds: z.number().nullish(),
              })
              .passthrough(),
          )
          .nullish()
          .describe("Per-attempt schedule"),
        stop_on_hard_decline: z.boolean().nullish().describe("Halt retries after hard decline"),
      })
      .passthrough()
      .nullish()
      .describe("Retries for the subscription"),
    initial_payment_validation: z.boolean().nullish().describe("Initial payment validation flag"),
    billing_date: z
      .object({
        type: z.enum(["PREPAID", "POSTDATE", "DAY"]).nullish().describe("Billing date type"),
        day: z.number().int().min(1).max(31).nullish().describe("Day of month for DAY type"),
      })
      .passthrough()
      .nullish()
      .describe("Billing date for the subscription"),
  })
  .passthrough();

const subscriptionUpdateSchema = z
  .object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to update"),
    account_id: z.string().nullish().describe("Account ID"),
    name: z.string().nullish(),
    description: z.string().nullish(),
    merchant_reference: z.string().nullish(),
    country: z.string().nullish(),
    amount: z
      .object({
        currency: z.string(),
        value: z.number(),
      })
      .passthrough()
      .nullish(),
    frequency: z
      .object({
        type: z.enum(["DAY", "WEEK", "MONTH"]),
        value: z.number().nullish(),
        monthly_billing_day: z.number().int().min(1).max(31).nullish().describe("Monthly billing day"),
      })
      .passthrough()
      .nullish(),
    billing_cycles: z
      .object({
        total: z.number(),
      })
      .passthrough()
      .nullish(),
    customer_payer: z
      .object({
        id: z.string(),
      })
      .passthrough()
      .nullish(),
    payment_method: z
      .object({
        type: z.enum(["CARD"]).nullish(),
        vaulted_token: z.string().nullish(),
        card: z
          .object({
            verify: z.boolean().nullish(),
            card_data: cardDataSchema.nullish(),
          })
          .passthrough()
          .nullish(),
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
    retries: z
      .object({
        retry_on_decline: z.boolean().nullish(),
        amount: z.number().nullish(),
      })
      .passthrough()
      .nullish(),
    metadata: metadataSchema,
  })
  .passthrough();

export { subscriptionCreateSchema, subscriptionUpdateSchema, yunoSubscriptionOutputSchema };
