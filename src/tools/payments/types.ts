import z from "zod";
import { paymentCancelSchema, paymentCaptureAuthorizationSchema, paymentCreateSchema, paymentRefundSchema } from "../../schemas";
import type { YunoAmount, YunoMetadata, YunoAdditionalData } from "../../types";

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

export type PaymentCreateSchema = z.infer<typeof paymentCreateSchema>;
export type PaymentCreateBody = Omit<PaymentCreateSchema, "idempotency_key">["payment"];

export type PaymentRefundSchema = z.infer<typeof paymentRefundSchema>;

export type PaymentCancelSchema = z.infer<typeof paymentCancelSchema>;

export type PaymentCaptureAuthorizationSchema = z.infer<typeof paymentCaptureAuthorizationSchema>;
