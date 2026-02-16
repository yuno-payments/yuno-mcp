import { z } from "zod";
import { addressSchema, amountSchema, metadataSchema, browserInfoSchema, cardDataSchema, documentSchema, phoneSchema } from "./shared";

const checkoutSessionCreateSchema = z
  .object({
    account_id: z.string().min(36).max(64).describe("The unique identifier of the Yuno account").optional(),
    customer_id: z.string().min(36).max(64).optional().describe("The unique identifier of the customer"),
    merchant_order_id: z.string().min(3).max(255).describe("The unique identifier of the customer's order"),
    payment_description: z.string().min(1).max(255).describe("The description of the payment"),
    callback_url: z.string().min(3).max(526).optional().describe("The URL where we will redirect your customer after making the purchase"),
    country: z.string().min(2).max(2).describe("The customer's country (ISO 3166-1)"),
    amount: amountSchema.optional().describe("Specifies the payment amount object"),
    alternative_amount: z
      .object({
        currency: z.string().min(3).max(3).optional().nullable(),
        value: z.number().optional(),
      })
      .passthrough()
      .optional()
      .describe("Alternative currency representation"),
    workflow: z.enum(["SDK_CHECKOUT", "CHECKOUT", "SDK_SEAMLESS"]).optional().describe("Checkout workflow type"),
    metadata: metadataSchema,
    installments: z
      .object({
        plan_id: z.string().optional().describe("Plan Id of the installment plan created in Yuno"),
        plan: z
          .array(
            z
              .object({
                installment: z.number().int().describe("The number of monthly installments"),
                rate: z.number().describe("The rate applied to the final amount (percentage)"),
              })
              .passthrough(),
          )
          .optional()
          .describe("Installments to show the customer"),
      })
      .passthrough()
      .optional()
      .describe("The installment plan configuration"),
  })
  .passthrough();

const ottCreateSchema = z
  .object({
    sessionId: z.string().describe("The unique identifier of the checkout session"),
    payment_method: z
      .object({
        type: z.string().describe("Payment method type (e.g., 'CARD', 'NEQUI', etc.)"),
        vault_on_success: z.boolean().describe("Whether to vault the payment method on success"),
        card: cardDataSchema
          .extend({
            expiration_year: z.number().int().min(20).max(99).describe("Card expiration year (YY format)"),
            security_code: z.string().describe("Card security code (CVV)"),
            holder_name: z.string().describe("Cardholder name"),
          })
          .optional(),
        customer: z
          .object({
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
          })
          .passthrough(),
        vaulted_token: z.string().optional().nullable(),
      })
      .passthrough(),
    three_d_secure: z
      .object({
        three_d_secure_setup_id: z.string().optional().nullable().describe("3DS setup ID"),
      })
      .passthrough(),
    installment: z.any().optional().nullable().describe("Installment configuration"),
    third_party_data: z.any().optional().nullable().describe("Third party data"),
    device_fingerprints: z.any().optional().nullable().describe("Device fingerprints"),
  })
  .passthrough();

export { checkoutSessionCreateSchema, ottCreateSchema };
