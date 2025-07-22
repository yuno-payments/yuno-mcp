import z from "zod";
import { YunoAmount, YunoMetadata, YunoCard, YunoCardData, YunoBrowserInfo, YunoDocument, YunoPhone, YunoAddress } from "../../types";
import { ottCreateSchema } from "../../schemas/checkouts";

export interface YunoInstallmentsPlan {
  installment: number;
  rate: number;
}

export interface YunoInstallments {
  plan_id?: string;
  plan?: YunoInstallmentsPlan[];
}

export interface YunoCheckoutSession {
  account_id?: string;
  amount: YunoAmount;
  customer_id?: string;
  merchant_order_id: string;
  payment_description: string;
  country?: string;
  callback_url?: string;
  metadata?: YunoMetadata[];
  installments?: YunoInstallments;
}

export interface YunoCheckoutPaymentMethod {
  type: string;
  name: string;
  category?: string;
  provider?: string;
  status?: string;
  vaulted_token?: string;
  [key: string]: any;
}

export interface YunoCheckoutPaymentMethodsResponse {
  payment_methods: YunoCheckoutPaymentMethod[];
}

export interface YunoOttCustomer {
  browser_info: YunoBrowserInfo;
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: string;
  date_of_birth?: string;
  document?: YunoDocument;
  phone?: YunoPhone;
  billing_address?: YunoAddress;
  shipping_address?: YunoAddress;
}

export interface YunoOttPaymentMethod {
  type: string;
  vault_on_success: boolean;
  card?: YunoCard;
  customer: YunoOttCustomer;
  vaulted_token?: string | null;
}

export interface YunoThreeDSecure {
  three_d_secure_setup_id?: string | null;
}

export interface YunoOttRequest {
  payment_method: YunoOttPaymentMethod;
  three_d_secure: YunoThreeDSecure;
  installment?: any | null;
  third_party_data?: any | null;
  device_fingerprints?: any | null;
}

export interface YunoOttResponseCustomer {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  gender: string;
  phone?: string | null;
  date_of_birth?: string | null;
  billing_address?: any | null;
  shipping_address?: any | null;
  document?: any | null;
  browser_info: YunoBrowserInfo;
  nationality?: string | null;
  device_fingerprint?: any | null;
}

export interface YunoOttResponse {
  token: string;
  vaulted_token?: string | null;
  vault_on_success: boolean;
  type: string;
  card_data?: YunoCardData;
  customer: YunoOttResponseCustomer;
  installment?: any | null;
  country: string;
  customer_session?: any | null;
}

export type YunoOttCreateSchema = z.infer<typeof ottCreateSchema>;
