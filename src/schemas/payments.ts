import { z } from "zod";
import { addressSchema, amountSchema, cardDataSchema, documentSchema, metadataSchema, phoneSchema } from "./shared";

const customerPayerSchema = z
  .object({
    id: z.string().min(36).max(64).optional().describe("The unique identifier of the customer in uuid v4 format (MAX 64 ; MIN 36)").optional(),
    merchant_customer_id: z.string().min(1).max(255).optional().describe("The unique identifier for a customer in the merchant's system").optional(),
    merchant_customer_created_at: z
      .string()
      .min(27)
      .max(27)
      .optional()
      .describe("Customer´s registration date on the merchants platform (ISO 8601)")
      .optional(),
    first_name: z.string().min(1).max(255).optional().describe("The customer's first name").optional(),
    last_name: z.string().min(1).max(255).optional().describe("The customer's last name").optional(),
    gender: z.string().min(1).max(2).optional().describe("The customer's gender (M/F/NB/NA/NK/U)").optional(),
    date_of_birth: z.string().length(10).optional().describe("The customer's date of birth in the YYYY-MM-DD format").optional(),
    email: z.string().min(1).max(255).optional().describe("The customer's e-mail").optional(),
    nationality: z.string().length(2).optional().describe("The customer's nationality (ISO 3166-1)").optional(),
    ip_address: z.string().min(1).max(45).optional().describe("The customer's IP address").optional(),
    device_fingerprints: z
      .array(
        z
          .object({
            provider_id: z.string().describe("The fraud screening provider id").optional(),
            id: z.string().describe("The device fingerprint associated to the provider").optional(),
          })
          .passthrough(),
      )
      .max(4000)
      .optional(),
    browser_info: z
      .object({
        user_agent: z.string().min(3).max(255).optional(),
        accept_header: z.string().optional(),
        platform: z.string().optional(),
        color_depth: z.string().min(1).max(5).optional(),
        screen_height: z.string().min(3).max(255).optional(),
        screen_width: z.string().min(3).max(255).optional(),
        javascript_enabled: z.boolean().optional(),
        language: z.string().min(1).max(5).optional(),
        accept_browser: z.string().optional(),
        accept_content: z.string().optional(),
        java_enabled: z.boolean().optional(),
        browser_time_difference: z.string().optional(),
      })
      .passthrough()
      .optional(),
    document: documentSchema.optional(),
    billing_address: addressSchema.optional(),
    shipping_address: addressSchema.optional(),
    phone: phoneSchema.optional(),
    geolocation: z
      .object({
        latitude: z.string().min(1).max(11).optional(),
        longitude: z.string().min(1).max(11).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const paymentCreateSchema = z
  .object({
    payment: z
      .object({
        account_id: z.string().optional().describe("Account ID for the payment"),
        description: z.string().describe("Payment description"),
        additional_data: z.any().optional(),
        country: z.string().describe("Customer's country (ISO 3166-1)"),
        merchant_order_id: z.string().describe("Unique identifier for the order"),
        merchant_reference: z.string().optional(),
        amount: amountSchema.describe("Payment amount details"),
        customer_payer: customerPayerSchema.describe("Customer payer info").optional(),
        workflow: z.enum(["SDK_CHECKOUT", "DIRECT", "REDIRECT"]).describe("Payment workflow type"),
        payment_method: z
          .object({
            token: z.string().optional(),
            vaulted_token: z.string().optional(),
            type: z.string().describe("Payment method type"),
            detail: z
              .object({
                card: z
                  .object({
                    capture: z.boolean().optional(),
                    installments: z.number().optional(),
                    first_installment_deferral: z.number().optional(),
                    soft_descriptor: z.string().optional(),
                    card_data: cardDataSchema,
                    verify: z.boolean().optional(),
                    stored_credentials: z
                      .object({
                        reason: z.string().optional(),
                        usage: z.string().optional(),
                        subscription_agreement_id: z.string().optional(),
                        network_transaction_id: z.string().optional(),
                      })
                      .passthrough()
                      .optional(),
                  })
                  .passthrough()
                  .optional(),
              })
              .passthrough()
              .optional(),
            vault_on_success: z.boolean().optional(),
          })
          .passthrough()
          .describe("Payment method details"),
        callback_url: z.string().optional(),
        fraud_screening: z.any().optional(),
        split_marketplace: z.any().optional(),
        metadata: metadataSchema,
      })
      .passthrough(),
    idempotencyKey: z.string().uuid().optional().describe("Unique key to prevent duplicate payments"),
  })
  .passthrough();

const operationPaymentResponseAdditionalDataSchema = z
  .object({
    receipt: z.boolean().optional(),
    receipt_language: z.enum(["ES", "EN", "PT"]).optional(),
  })
  .passthrough()
  .optional();

const paymentRefundSchema = z
  .object({
    description: z.string().min(3).max(255).optional(),
    reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER"]).optional(),
    merchant_reference: z.string().min(3).max(255),
    amount: z
      .object({
        currency: z
          .enum(["ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"])
          .optional(),
        value: z.string().optional(),
      })
      .passthrough()
      .optional(),
    simplified_mode: z.boolean().optional(),
    response_additional_data: operationPaymentResponseAdditionalDataSchema,
    customer_payer: z
      .object({
        id: z.string().describe("Customer unique identifier").optional(),
        first_name: z.string().describe("First name of the customer").optional(),
        last_name: z.string().describe("Last name of the customer").optional(),
        email: z.string().describe("Email of the customer").optional(),
      })
      .passthrough()
      .describe("Customer payer info"),
  })
  .passthrough();

const paymentCancelSchema = z
  .object({
    description: z.string().min(3).max(255).optional(),
    reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER", ""]).optional(),
    merchant_reference: z.string().min(3).max(255),
    response_additional_data: operationPaymentResponseAdditionalDataSchema,
  })
  .passthrough();

const paymentCaptureAuthorizationSchema = z
  .object({
    merchant_reference: z.string().min(3).max(255),
    amount: z
      .object({
        currency: z.enum(["ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"]),
        value: z.string(),
      })
      .passthrough()
      .optional(),
    reason: z.string().min(3).max(255),
    simplified_mode: z.boolean().optional(),
  })
  .passthrough();

export { paymentCreateSchema, paymentRefundSchema, paymentCancelSchema, paymentCaptureAuthorizationSchema };
