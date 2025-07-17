import z from "zod";
import { addressSchema, amountSchema, cardDataSchema, documentSchema, metadataSchema, phoneSchema, YunoAmount, YunoMetadata } from "../shared/types";
import { YunoAdditionalData } from "../shared/types/additionalData";

export interface YunoPaymentMethodStoredCredentials {
  reason?: string;
  usage?: string;
  subscription_agreement_id?: string;
  network_transaction_id?: string;
}

export interface YunoPaymentMethodCardData {
  number: string;
  expiration_month?: number;
  expiration_year?: number;
  security_code?: string;
  holder_name: string;
  type?: string;
}

export interface YunoPaymentMethodCard {
  capture?: boolean;
  installments?: number;
  first_installment_deferral?: number;
  soft_descriptor?: string;
  card_data: YunoPaymentMethodCardData;
  verify?: boolean;
  stored_credentials?: YunoPaymentMethodStoredCredentials;
}

export interface YunoPaymentMethodDetail {
  card?: YunoPaymentMethodCard;
}

export interface YunoPaymentPaymentMethod {
  token?: string;
  vaulted_token?: string;
  type: string;
  detail?: YunoPaymentMethodDetail;
  vault_on_success?: boolean;
}

export interface YunoPaymentFraudScreening {
  stand_alone?: boolean;
}

export interface YunoPaymentSplitMarketplaceItem {
  recipient_id?: string;
  provider_recipient_id?: string;
  type: string;
  merchant_reference?: string;
  amount: {
    value: number;
    currency: string;
  };
  liability?: {
    processing_fee?: string;
    chargebacks?: boolean;
  };
}

export type YunoPaymentSplitMarketplace = YunoPaymentSplitMarketplaceItem[];

export interface YunoPayment {
  account_id?: string;
  description: string;
  additional_data?: YunoAdditionalData;
  country: string;
  merchant_order_id: string;
  merchant_reference?: string;
  amount: YunoAmount;
  customer_payer: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  workflow: "SDK_CHECKOUT" | "DIRECT" | "REDIRECT";
  payment_method: YunoPaymentPaymentMethod;
  callback_url?: string;
  fraud_screening?: YunoPaymentFraudScreening;
  split_marketplace?: YunoPaymentSplitMarketplace;
  metadata?: YunoMetadata[];
}

export const customerPayerSchema = z.object({
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
      z.object({
        provider_id: z.string().describe("The fraud screening provider id").optional(),
        id: z.string().describe("The device fingerprint associated to the provider").optional(),
      }),
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
    .optional(),
});

export const paymentCreateSchema = z.object({
  payment: z.object({
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
                  .optional(),
              })
              .optional(),
          })
          .optional(),
        vault_on_success: z.boolean().optional(),
      })
      .describe("Payment method details"),
    callback_url: z.string().optional(),
    fraud_screening: z.any().optional(),
    split_marketplace: z.any().optional(),
    metadata: metadataSchema,
  }),
  idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate payments"),
});

export type PaymentCreateSchema = z.infer<typeof paymentCreateSchema>;
export type PaymentCreateBody = Omit<PaymentCreateSchema, "idempotency_key">["payment"];

export const operationPaymentResponseAdditionalDataSchema = z
  .object({
    receipt: z.boolean().optional(),
    receipt_language: z.enum(["ES", "EN", "PT"]).optional(),
  })
  .optional();

export const paymentRefundSchema = z.object({
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
    .describe("Customer payer info"),
});

export type PaymentRefundSchema = z.infer<typeof paymentRefundSchema>;

export const paymentCancelSchema = z.object({
  paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
  transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
  body: z.object({
    description: z.string().min(3).max(255).optional(),
    reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER", ""]).optional(),
    merchant_reference: z.string().min(3).max(255),
    response_additional_data: operationPaymentResponseAdditionalDataSchema,
  }),
  idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate cancels"),
});

export type PaymentCancelSchema = z.infer<typeof paymentCancelSchema>;

export const paymentCaptureAuthorizationSchema = z.object({
  paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
  transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
  body: z.object({
    merchant_reference: z.string().min(3).max(255),
    amount: z
      .object({
        currency: z.enum(["ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"]),
        value: z.string(),
      })
      .optional(),
    reason: z.string().min(3).max(255),
    simplified_mode: z.boolean().optional(),
  }),
  idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate captures"),
});

export type PaymentCaptureAuthorizationSchema = z.infer<typeof paymentCaptureAuthorizationSchema>;
