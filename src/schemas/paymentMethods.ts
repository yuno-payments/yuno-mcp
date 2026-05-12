import { z } from "zod";
import { cardDataSchema } from "./shared";

const paymentMethodEnrollSchema = z
  .object({
    account_id: z
      .string()
      .min(36)
      .max(64)
      .optional()
      .describe("The unique identifier of the account. You find this information on Yuno's Dashboard (MAX 64; MIN 36)."),
    country: z.string().min(2).max(2).describe("The transaction's country code (ISO 3166-1)."),
    type: z.string().min(3).max(255).describe("The payment method type (MAX 255; MIN 3; e.g. 'CARD', 'NU_PAY_ENROLLMENT')."),
    workflow: z.enum(["DIRECT"]).optional().describe("The payment workflow. For direct integration, use 'DIRECT'."),
    provider_data: z
      .object({
        id: z.string(),
        payment_method_token: z.string(),
      })
      .passthrough()
      .optional()
      .describe("Provider data for token migration, only if agreed with Yuno."),
    card_data: cardDataSchema.optional().describe("Card details for DIRECT workflow (PCI merchants only)."),
    callback_url: z.string().min(3).max(255).optional().describe("URL to return the customer after enrollment (for APMs)."),
    verify: z
      .object({
        vault_on_success: z.boolean(),
        currency: z.string().optional(),
      })
      .passthrough()
      .optional()
      .describe("Indicates whether to verify the payment with a verify transaction or not. null if not specified."),
  })
  .passthrough();

const yunoPaymentMethodOutputSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    country: z.string().optional(),
    status: z.string().optional(),
    sub_status: z.string().optional(),
    vaulted_token: z.string().optional(),
  })
  .passthrough();

export { paymentMethodEnrollSchema, yunoPaymentMethodOutputSchema };
