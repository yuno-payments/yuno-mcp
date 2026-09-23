import { z } from "zod";
import {
  addressSchema,
  amountSchema,
  browserInfoSchema,
  cardDataSchema,
  cardDataResponseSchema,
  deviceFingerprintsSchema,
  documentSchema,
  metadataSchema,
  phoneSchema,
} from "./shared";

const installmentConfigSchema = z
  .object({
    plan_id: z.string().nullish().describe("Installment plan id"),
    plan: z
      .array(
        z
          .object({
            installment: z.number().int(),
            rate: z.number(),
          })
          .loose(),
      )
      .nullish(),
  })
  .loose();

const thirdPartyDataSchema = z
  .object({
    payer_authentication: z
      .object({
        cavv: z.string().nullish(),
        eci: z.string().nullish(),
        xid: z.string().nullish(),
        version: z.string().nullish(),
        directory_server_transaction_id: z.string().nullish(),
        acs_transaction_id: z.string().nullish(),
      })
      .loose()
      .nullish()
      .describe("3DS payer authentication data"),
  })
  .loose()
  .describe("Third-party data (e.g., external 3DS results). Shape is not formally documented; passthrough allows provider-specific fields.");

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
              .loose(),
          )
          .nullish(),
      })
      .loose()
      .nullish(),
  })
  .loose();

// Raw API response: a bare array of payment methods. The array root means it
// cannot be used as an MCP outputSchema (structuredContent requires an object
// root), so the tool declares no outputSchema and passes the response through.
const yunoCheckoutPaymentMethodsOutputSchema = z.array(
  z
    .object({
      type: z.string(),
      name: z.string(),
      description: z.string().nullish(),
      category: z.string().nullish(),
      icon: z.string().nullish(),
      vaulted_token: z.string().nullish(),
      preferred: z.boolean().nullish(),
      last_successfully_used: z.string().nullish(),
      last_successfully_used_at: z.string().nullish(),
      checkout: z
        .object({
          session: z.string().nullish(),
          sdk_required_action: z.boolean().nullish(),
          conditions: z
            .object({
              enabled: z.boolean().nullish(),
              rules: z.array(z.object({}).loose()).nullish(),
            })
            .loose()
            .nullish(),
        })
        .loose()
        .nullish(),
    })
    .loose(),
);

const yunoOttOutputSchema = z
  .object({
    token: z.string(),
    vaulted_token: z.string().nullish(),
    vault_on_success: z.boolean(),
    type: z.string(),
    card_data: cardDataResponseSchema.nullish(),
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
      .loose(),
    installment: z.any().nullish(),
    country: z.string(),
    customer_session: z.any().nullish(),
  })
  .loose();

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
      .loose()
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
              .loose(),
          )
          .nullish()
          .describe("Installments to show the customer"),
      })
      .loose()
      .nullish()
      .describe("The installment plan configuration"),
  })
  .loose();

const ottCreateSchema = z
  .object({
    session_id: z.string().describe("The unique identifier of the checkout session"),
    payment_method: z
      .object({
        type: z.string().describe("Payment method type (e.g., 'CARD', 'NEQUI', etc.)"),
        vault_on_success: z.boolean().describe("Whether to vault the payment method on success"),
        // Either format is accepted here, and the handler normalizes to YY before
        // calling the API. YY can only name 2000-2099, so a 4-digit year outside
        // that range is rejected rather than wrapped (2100 would become 00).
        card: cardDataSchema
          .extend({
            expiration_year: cardDataSchema.shape.expiration_year
              .refine((year) => year <= 99 || (year >= 2000 && year <= 2099), {
                message: "checkoutSessionCreateOtt sends a 2-digit year, so a 4-digit expiration_year must be 2000-2099",
              })
              .describe("Card expiration year, as YY (29) or YYYY (2029, 2000-2099)"),
            security_code: z.string().describe("Card security code (CVV)"),
            holder_name: z.string().describe("Cardholder name"),
          })
          .nullish(),
        customer: z
          .object({
            browser_info: browserInfoSchema,
            first_name: z.string().nullish(),
            last_name: z.string().nullish(),
            email: z.email().nullish(),
            gender: z.string().nullish(),
            date_of_birth: z.string().nullish(),
            document: documentSchema.nullish(),
            phone: phoneSchema.nullish(),
            billing_address: addressSchema.nullish(),
            shipping_address: addressSchema.nullish(),
          })
          .loose(),
        vaulted_token: z.string().nullish(),
      })
      .loose(),
    three_d_secure: z
      .object({
        three_d_secure_setup_id: z.string().nullish().describe("3DS setup ID"),
      })
      .loose(),
    installment: installmentConfigSchema.nullish().describe("Installment configuration (plan_id or explicit plan)"),
    third_party_data: thirdPartyDataSchema.nullish(),
    device_fingerprints: deviceFingerprintsSchema.nullish().describe("Device fingerprints from fraud screening providers"),
  })
  .loose();

export {
  checkoutSessionCreateSchema,
  ottCreateSchema,
  yunoCheckoutSessionOutputSchema,
  yunoCheckoutPaymentMethodsOutputSchema,
  yunoOttOutputSchema,
};
