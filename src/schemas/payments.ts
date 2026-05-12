import { z } from "zod";
import { addressSchema, amountSchema, cardDataSchema, documentSchema, metadataSchema, phoneSchema } from "./shared";

const customerPayerSchema = z
  .object({
    id: z.string().min(36).max(64).nullish().describe("The unique identifier of the customer in uuid v4 format (MAX 64 ; MIN 36)"),
    merchant_customer_id: z.string().min(1).max(255).nullish().describe("The unique identifier for a customer in the merchant's system"),
    merchant_customer_created_at: z
      .string()
      .min(27)
      .max(27)
      .nullish()
      .describe("Customer´s registration date on the merchants platform (ISO 8601)"),
    first_name: z.string().min(1).max(255).nullish().describe("The customer's first name"),
    last_name: z.string().min(1).max(255).nullish().describe("The customer's last name"),
    gender: z.string().min(1).max(2).nullish().describe("The customer's gender (M/F/NB/NA/NK/U)"),
    date_of_birth: z.string().length(10).nullish().describe("The customer's date of birth in the YYYY-MM-DD format"),
    email: z.string().min(1).max(255).nullish().describe("The customer's e-mail"),
    nationality: z.string().length(2).nullish().describe("The customer's nationality (ISO 3166-1)"),
    ip_address: z.string().min(1).max(45).nullish().describe("The customer's IP address"),
    device_fingerprints: z
      .array(
        z
          .object({
            provider_id: z.string().describe("The fraud screening provider id").nullish(),
            id: z.string().describe("The device fingerprint associated to the provider").nullish(),
          })
          .passthrough(),
      )
      .max(4000)
      .nullish(),
    browser_info: z
      .object({
        user_agent: z.string().min(3).max(255).nullish(),
        accept_header: z.string().nullish(),
        platform: z.string().nullish(),
        color_depth: z.string().min(1).max(5).nullish(),
        screen_height: z.string().min(3).max(255).nullish(),
        screen_width: z.string().min(3).max(255).nullish(),
        javascript_enabled: z.boolean().nullish(),
        language: z.string().min(1).max(5).nullish(),
        accept_browser: z.string().nullish(),
        accept_content: z.string().nullish(),
        java_enabled: z.boolean().nullish(),
        browser_time_difference: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
    document: documentSchema.nullish(),
    billing_address: addressSchema.nullish(),
    shipping_address: addressSchema.nullish(),
    phone: phoneSchema.nullish(),
    geolocation: z
      .object({
        latitude: z.string().min(1).max(11).nullish(),
        longitude: z.string().min(1).max(11).nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const paymentCreateSchema = z
  .object({
    payment: z
      .object({
        account_id: z.string().nullish().describe("Account ID for the payment"),
        description: z.string().describe("Payment description"),
        additional_data: z.any().nullish(),
        country: z.string().describe("Customer's country (ISO 3166-1)"),
        merchant_order_id: z.string().describe("Unique identifier for the order"),
        merchant_reference: z.string().nullish(),
        amount: amountSchema.describe("Payment amount details"),
        customer_payer: customerPayerSchema.describe("Customer payer info").nullish(),
        checkout: z
          .object({
            session: z.string().describe("The checkout session ID"),
          })
          .passthrough()
          .nullish()
          .describe("Checkout session information"),
        workflow: z.enum(["SDK_CHECKOUT", "DIRECT", "REDIRECT"]).describe("Payment workflow type"),
        payment_method: z
          .object({
            token: z.string().nullish(),
            vaulted_token: z.string().nullish(),
            type: z.string().describe("Payment method type"),
            detail: z
              .object({
                card: z
                  .object({
                    capture: z.boolean().nullish(),
                    installments: z.number().nullish(),
                    first_installment_deferral: z.number().nullish(),
                    soft_descriptor: z.string().nullish(),
                    card_data: cardDataSchema.nullish(),
                    verify: z.boolean().nullish(),
                    stored_credentials: z
                      .object({
                        reason: z.string().nullish(),
                        usage: z.string().nullish(),
                        subscription_agreement_id: z.string().nullish(),
                        network_transaction_id: z.string().nullish(),
                      })
                      .passthrough()
                      .nullish(),
                  })
                  .passthrough()
                  .nullish(),
              })
              .passthrough()
              .nullish(),
            vault_on_success: z.boolean().nullish(),
          })
          .passthrough()
          .describe("Payment method details"),
        callback_url: z.string().nullish(),
        fraud_screening: z.any().nullish(),
        split_marketplace: z.any().nullish(),
        metadata: metadataSchema,
      })
      .passthrough()
      .refine(
        (payment) => payment.workflow !== "SDK_CHECKOUT" || (payment.checkout != null && payment.checkout.session != null),
        {
          message: "checkout.session is required when workflow is SDK_CHECKOUT",
          path: ["checkout", "session"],
        },
      ),
    idempotencyKey: z.string().uuid().nullish().describe("Unique key to prevent duplicate payments"),
  })
  .passthrough();

const operationPaymentResponseAdditionalDataSchema = z
  .object({
    receipt: z.boolean().nullish(),
    receipt_language: z.enum(["ES", "EN", "PT"]).nullish(),
  })
  .passthrough()
  .nullish();

const paymentRefundSchema = z
  .object({
    description: z.string().min(3).max(255).nullish(),
    reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER"]).nullish(),
    merchant_reference: z.string().min(3).max(255),
    amount: z
      .object({
        currency: z.string().min(3).max(3).nullish(),
        value: z.number().nullish(),
      })
      .passthrough()
      .nullish(),
    simplified_mode: z.boolean().nullish(),
    response_additional_data: operationPaymentResponseAdditionalDataSchema,
    customer_payer: z
      .object({
        first_name: z.string().min(3).max(255).nullish().describe("First name of the customer"),
        last_name: z.string().min(3).max(255).nullish().describe("Last name of the customer"),
        gender: z.string().nullish().describe("Gender of the customer (M/F/NB/NA/NK/U)"),
        date_of_birth: z.string().length(10).nullish().describe("Date of birth (YYYY-MM-DD)"),
        email: z.string().min(3).max(255).nullish().describe("Email of the customer"),
        nationality: z.string().length(2).nullish().describe("Nationality (ISO 3166-1)"),
        document: documentSchema.nullish(),
        phone: phoneSchema.nullish(),
        billing_address: addressSchema.nullish(),
        shipping_address: addressSchema.nullish(),
      })
      .passthrough()
      .nullish()
      .describe("Customer payer info"),
    payment_method: z
      .object({
        detail: z
          .object({
            bank_transfer: z
              .object({
                account_type: z.enum(["CHECKINGS", "SAVINGS"]).nullish(),
                bank_name: z.string().nullish(),
                bank_id: z.string().nullish(),
                beneficiary_name: z.string().nullish(),
                bank_account: z.string().nullish(),
                beneficiary_document_type: z.string().nullish(),
                beneficiary_document: z.string().nullish(),
                reference: z.string().nullish(),
              })
              .passthrough()
              .nullish(),
          })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish()
      .describe("Payment method details for the refund"),
  })
  .passthrough();

const paymentCancelSchema = z
  .object({
    description: z.string().min(3).max(255).nullish(),
    reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER"]).nullish(),
    merchant_reference: z.string().min(3).max(255),
    response_additional_data: operationPaymentResponseAdditionalDataSchema,
  })
  .passthrough();

const paymentCaptureAuthorizationSchema = z
  .object({
    merchant_reference: z.string().min(3).max(255),
    amount: z
      .object({
        currency: z.string().min(3).max(3),
        value: z.number(),
      })
      .passthrough(),
    reason: z.string().min(3).max(255),
    simplified_mode: z.boolean().nullish(),
  })
  .passthrough();

const yunoPaymentOutputSchema = z
  .object({
    account_id: z.string().nullish(),
    description: z.string().nullish(),
    additional_data: z.any().nullish(),
    country: z.string().nullish(),
    merchant_order_id: z.string().nullish(),
    merchant_reference: z.string().nullish(),
    amount: amountSchema.nullish(),
    customer_payer: z
      .object({
        id: z.string().nullish(),
        first_name: z.string().nullish(),
        last_name: z.string().nullish(),
        email: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
    workflow: z.string().nullish(),
    payment_method: z
      .object({
        token: z.string().nullish(),
        vaulted_token: z.string().nullish(),
        type: z.string().nullish(),
        detail: z
          .object({
            card: z
              .object({
                capture: z.boolean().nullish(),
                installments: z.number().nullish(),
                first_installment_deferral: z.number().nullish(),
                soft_descriptor: z.string().nullish(),
                card_data: z
                  .object({
                    number: z.string().nullish(),
                    expiration_month: z.number().nullish(),
                    expiration_year: z.number().nullish(),
                    security_code: z.string().nullish(),
                    holder_name: z.string().nullish(),
                    type: z.string().nullish(),
                  })
                  .passthrough()
                  .nullish(),
                verify: z.boolean().nullish(),
                stored_credentials: z
                  .object({
                    reason: z.string().nullish(),
                    usage: z.string().nullish(),
                    subscription_agreement_id: z.string().nullish(),
                    network_transaction_id: z.string().nullish(),
                  })
                  .passthrough()
                  .nullish(),
              })
              .passthrough()
              .nullish(),
          })
          .passthrough()
          .nullish(),
        vault_on_success: z.boolean().nullish(),
      })
      .passthrough()
      .nullish(),
    callback_url: z.string().nullish(),
    fraud_screening: z
      .object({ stand_alone: z.boolean().nullish() })
      .passthrough()
      .nullish(),
    split_marketplace: z
      .array(
        z
          .object({
            recipient_id: z.string().nullish(),
            provider_recipient_id: z.string().nullish(),
            type: z.string().nullish(),
            merchant_reference: z.string().nullish(),
            amount: z
              .object({
                value: z.number().nullish(),
                currency: z.string().nullish(),
              })
              .passthrough()
              .nullish(),
            liability: z
              .object({
                processing_fee: z.string().nullish(),
                chargebacks: z.boolean().nullish(),
              })
              .passthrough()
              .nullish(),
          })
          .passthrough(),
      )
      .nullish(),
    metadata: metadataSchema,
  })
  .passthrough();

const yunoPaymentListOutputSchema = z
  .object({
    items: z.array(yunoPaymentOutputSchema),
  })
  .passthrough();

export {
  paymentCreateSchema,
  paymentRefundSchema,
  paymentCancelSchema,
  paymentCaptureAuthorizationSchema,
  yunoPaymentOutputSchema,
  yunoPaymentListOutputSchema,
};
