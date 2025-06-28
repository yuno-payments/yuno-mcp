import { YunoAmount, YunoMetadata } from "./common";

export interface YunoInstallmentsPlan {
  installment: number;
  rate: number;
}

export interface YunoInstallments {
  plan_id?: string;
  plan?: YunoInstallmentsPlan[];
}

export interface YunoCheckoutSession {
  account_id: string;
  amount: YunoAmount;
  customer_id: string;
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
