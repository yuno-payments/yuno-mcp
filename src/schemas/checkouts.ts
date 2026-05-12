import { z } from "zod";
import { addressSchema, amountSchema, metadataSchema, browserInfoSchema, cardDataSchema, documentSchema, phoneSchema } from "./shared";

const yunoCheckoutSessionOutputSchema = z
  .object({
    account_id: z.string().nullish(),
    amount: amountSchema,
    customer_id: z.string().nullish(),
    merchant_order_id: z.string(),
    payment_description: z.string(),
    country: z.string().nullish(),
    callback_url: z.string().nullish(),
    metadata: metadataSchema,
    installments: z
      .object({
        plan_id: z.string().nullish(),
        plan: z
          .array(
            z
              .object({
                installment: z.number().int(),
                rate: z.number(),
              })
              .passthrough(),
          )
          .nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const yunoCheckoutPaymentMethodsOutputSchema = z
  .object({
    payment_methods: z.array(
      z
        .object({
          type: z.string(),
          name: z.string(),
          category: z.string().nullish(),
          provider: z.string().nullish(),
          status: z.string().nullish(),
          vaulted_token: z.string().nullish(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

const yunoOttOutputSchema = z
  .object({
    token: z.string(),
    vaulted_token: z.string().nullish(),
    vault_on_success: z.boolean(),
    type: z.string(),
    card_data: cardDataSchema.nullish(),
    customer: z
      .object({
        first_name: z.string().nullish(),
        last_name: z.string().nullish(),
        email: z.string().nullish(),
        gender: z.string(),
        phone: z.string().nullish(),
        date_of_birth: z.string().nullish(),
        billing_address: z.any().nullish(),
        shipping_address: z.any().nullish(),
        document: z.any().nullish(),
        browser_info: browserInfoSchema,
        nationality: z.string().nullish(),
        device_fingerprint: z.any().nullish(),
      })
      .passthrough(),
    installment: z.any().nullish(),
    country: z.string(),
    customer_session: z.any().nullish(),
  })
  .passthrough();

const checkoutSessionCreateSchema = z
  .object({
    account_id: z.string().min(36).max(64).describe("The unique identifier of the Yuno account").nullish(),
    customer_id: z.string().min(36).max(64).nullish().describe("The unique identifier of the customer"),
    merchant_order_id: z.string().min(3).max(255).describe("The unique identifier of the customer's order"),
    payment_description: z.string().min(1).max(255).describe("The description of the payment"),
    callback_url: z.string().min(3).max(526).nullish().describe("The URL where we will redirect your customer after making the purchase"),
    country: z.string().min(2).max(2).describe("The customer's country (ISO 3166-1)"),
    amount: amountSchema.nullish().describe("Specifies the payment amount object"),
    alternative_amount: z
      .object({
        currency: z.string().min(3).max(3).nullish(),
        value: z.number().nullish(),
      })
      .passthrough()
      .nullish()
      .describe("Alternative currency representation"),
    workflow: z.enum(["SDK_CHECKOUT", "CHECKOUT", "SDK_SEAMLESS"]).nullish().describe("Checkout workflow type"),
    metadata: metadataSchema,
    installments: z
      .object({
        plan_id: z.string().nullish().describe("Plan Id of the installment plan created in Yuno"),
        plan: z
          .array(
            z
              .object({
                installment: z.number().int().describe("The number of monthly installments"),
                rate: z.number().describe("The rate applied to the final amount (percentage)"),
              })
              .passthrough(),
          )
          .nullish()
          .describe("Installments to show the customer"),
      })
      .passthrough()
      .nullish()
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
          .nullish(),
        customer: z
          .object({
            browser_info: browserInfoSchema,
            first_name: z.string().nullish(),
            last_name: z.string().nullish(),
            email: z.string().email().nullish(),
            gender: z.string().nullish(),
            date_of_birth: z.string().nullish(),
            document: documentSchema.nullish(),
            phone: phoneSchema.nullish(),
            billing_address: addressSchema.nullish(),
            shipping_address: addressSchema.nullish(),
          })
          .passthrough(),
        vaulted_token: z.string().nullish(),
      })
      .passthrough(),
    three_d_secure: z
      .object({
        three_d_secure_setup_id: z.string().nullish().describe("3DS setup ID"),
      })
      .passthrough(),
    installment: z.any().nullish().describe("Installment configuration"),
    third_party_data: z.any().nullish().describe("Third party data"),
    device_fingerprints: z.any().nullish().describe("Device fingerprints"),
  })
  .passthrough();

export {
  checkoutSessionCreateSchema,
  ottCreateSchema,
  yunoCheckoutSessionOutputSchema,
  yunoCheckoutPaymentMethodsOutputSchema,
  yunoOttOutputSchema,
};
