import { z } from "zod";
import { cardDataSchema } from "./shared";

const paymentMethodEnrollSchema = z
  .object({
    account_id: z
      .string()
      .min(36)
      .max(64)
      .nullish()
      .describe("The unique identifier of the account. You find this information on Yuno's Dashboard (MAX 64; MIN 36)."),
    country: z.string().min(2).max(2).describe("The transaction's country code (ISO 3166-1)."),
    type: z.string().min(3).max(255).describe("The payment method type (MAX 255; MIN 3; e.g. 'CARD', 'NU_PAY_ENROLLMENT')."),
    workflow: z.enum(["DIRECT"]).nullish().describe("The payment workflow. For direct integration, use 'DIRECT'."),
    provider_data: z
      .object({
        id: z.string(),
        payment_method_token: z.string(),
      })
      .passthrough()
      .nullish()
      .describe("Provider data for token migration, only if agreed with Yuno."),
    card_data: cardDataSchema.nullish().describe("Card details for DIRECT workflow (PCI merchants only)."),
    callback_url: z.string().min(3).max(255).nullish().describe("URL to return the customer after enrollment (for APMs)."),
    verify: z
      .object({
        vault_on_success: z.boolean(),
        currency: z.string().nullish(),
      })
      .passthrough()
      .nullish()
      .describe("Indicates whether to verify the payment with a verify transaction or not. null if not specified."),
  })
  .passthrough();

const yunoPaymentMethodOutputSchema = z
  .object({
    name: z.string().nullish(),
    description: z.string().nullish(),
    type: z.string().nullish(),
    country: z.string().nullish(),
    status: z.string().nullish(),
    sub_status: z.string().nullish(),
    // The API returns no `id` for a payment method: vaulted_token is its identifier
    // (verified against api-staging 2026-09-21), and it is what retrieve/unenroll
    // expect as payment_method_id.
    vaulted_token: z
      .string()
      .nullish()
      .describe("Identifies this payment method. Pass it as payment_method_id to paymentMethodRetrieve and paymentMethodUnenroll."),
  })
  .passthrough();

const yunoPaymentMethodListOutputSchema = z
  .object({
    payment_methods: z.array(yunoPaymentMethodOutputSchema).nullish(),
  })
  .passthrough();

export { paymentMethodEnrollSchema, yunoPaymentMethodOutputSchema, yunoPaymentMethodListOutputSchema };
