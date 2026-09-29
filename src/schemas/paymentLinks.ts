import { z } from "zod";
import { addressSchema, amountSchema, documentSchema, metadataSchema, paymentAdditionalDataSchema, phoneSchema } from "./shared";

const paymentLinkPaymentMethodSchema = z
  .object({
    type: z.string().nullish().describe("Payment method type (e.g., CARD, PIX, BOLETO)"),
    vaulted_token: z.string().nullish().describe("Token of an enrolled payment method"),
    token: z.string().nullish().describe("One-time-use token"),
    detail: z
      .object({
        card: z
          .object({
            capture: z.boolean().nullish(),
            installments: z.number().nullish(),
            first_installment_deferral: z.number().nullish(),
            soft_descriptor: z.string().nullish(),
            verify: z.boolean().nullish(),
          })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
    vault_on_success: z.boolean().nullish(),
  })
  .passthrough();

const installmentsPlanSchema = z
  .object({
    plan_id: z.string().nullish().describe("Installment plan id created in Yuno"),
    plan: z
      .array(
        z
          .object({
            installment: z.number().int().describe("Number of monthly installments"),
            rate: z.number().describe("Rate applied to the final amount (percentage)"),
          })
          .passthrough(),
      )
      .nullish()
      .describe("Installment options to show the customer"),
  })
  .passthrough();

const yunoPaymentLinkOutputSchema = z
  .object({
    account_id: z.string().nullish(),
    description: z.string().nullish(),
    country: z.string(),
    merchant_order_id: z.string().nullish(),
    additional_data: paymentAdditionalDataSchema.nullish(),
    url: z.string().nullish(),
    status: z.string().nullish(),
    amount: z
      .object({
        currency: z.string(),
        value: z.number(),
      })
      .passthrough(),
    payment_method_types: z.array(z.string()),
    metadata: metadataSchema,
    cancelled_at: z.string().nullish(),
  })
  .passthrough();

const customerPayerSchema = z
  .object({
    id: z.string().min(36).max(64).nullish().describe("The unique identifier of the customer in uuid v4 format"),
    merchant_customer_id: z.string().min(3).max(255).nullish().describe("The unique identifier for a customer in the merchant's system"),
    first_name: z.string().min(1).max(255).nullish().describe("The customer's first name"),
    last_name: z.string().min(1).max(255).nullish().describe("The customer's last name"),
    gender: z.string().min(1).max(2).nullish().describe("The customer's gender (M/F/NA/NK)"),
    date_of_birth: z.string().length(10).nullish().describe("The customer's date of birth in the YYYY-MM-DD format"),
    email: z.string().min(3).max(255).nullish().describe("The customer's e-mail"),
    nationality: z.string().length(2).nullish().describe("The customer's nationality (ISO 3166-1)"),
    document: documentSchema.nullish(),
    billing_address: addressSchema.nullish(),
    shipping_address: addressSchema.nullish(),
    phone: phoneSchema.nullish(),
    ip_address: z.string().min(1).max(45).nullish().describe("The customer's IP address"),
  })
  .passthrough();

const paymentLinkCreateSchema = z
  .object({
    account_id: z.string().nullish().describe("Account ID for the payment"),
    description: z.string().min(1).max(255).describe("The description of the payment"),
    country: z.string().min(2).max(2).describe("Country (ISO 3166-1)"),
    merchant_order_id: z.string().min(3).max(255).nullish().describe("The unique identifier of the customer's order"),
    amount: amountSchema.describe("Specifies the payment amount object"),
    capture: z.boolean().nullish().describe("Whether to capture the payment immediately, true by default"),
    type: z.string().nullish().describe("Payment link classification"),
    payment_method: paymentLinkPaymentMethodSchema.nullish().describe("Payment method configuration"),
    installments_plan: installmentsPlanSchema.nullish().describe("Installment arrangement details"),
    timezone: z.string().nullish().describe("Availability timezone (e.g., UTC +03:00)"),
    payments_number: z.number().int().nullish().describe("Count of linked payments"),
    split_payment_methods: z.boolean().nullish().describe("Enable divided payment options"),
    taxes: z
      .array(
        z
          .object({
            type: z.string(),
            value: z.number(),
            tax_base: z.number().nullish(),
            percentage: z.number().nullish(),
          })
          .passthrough(),
      )
      .nullish(),
    customer_payer: customerPayerSchema.nullish(),
    additional_data: paymentAdditionalDataSchema.nullish(),
    callback_url: z.string().nullish(),
    one_time_use: z.boolean().nullish(),
    availability: z
      .object({
        start_at: z.string().nullish(),
        finish_at: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
    payment_method_types: z.array(z.string()),
    metadata: metadataSchema,
    vault_on_success: z.boolean().nullish(),
  })
  .passthrough();

const paymentLinkCancelSchema = z
  .object({
    payment_link_id: z.string().describe("The code of the payment link to cancel"),
  })
  .passthrough()
  .describe("Parameters for payment link cancellation");

export { paymentLinkCreateSchema, paymentLinkCancelSchema, yunoPaymentLinkOutputSchema };
