export interface YunoClientConfig {
  accountCode: string;
  publicApiKey: string;
  privateSecretKey: string;
  baseUrl?: string;
}

export interface YunoAmount {
  currency: string;
  value: number;
}

export interface YunoCustomerDocument {
  document_type: string;
  document_number: string;
}

export interface YunoPhone {
  number: string;
  country_code: string;
}

export interface YunoAddress {
  address_line_1: string;
  address_line_2?: string;
  country: string;
  state: string;
  city: string;
  zip_code: string;
  neighborhood?: string;
}

export interface YunoMetadata {
  key: string;
  value: string;
}

export interface YunoCustomer {
  merchant_customer_id: string;
  first_name: string;
  last_name: string;
  gender?: 'M' | 'F' | 'NB';
  date_of_birth?: string;
  email: string;
  nationality?: string;
  country: string;
  document?: YunoCustomerDocument;
  phone?: YunoPhone;
  billing_address?: YunoAddress;
  shipping_address?: YunoAddress;
  metadata?: YunoMetadata[];
  merchant_customer_created_at?: string;
}

export interface YunoCheckoutSession {
  amount: YunoAmount;
  customer_id: string;
  merchant_order_id: string;
  payment_description: string;
  country?: string;
}

export interface YunoPaymentMethod {
  type: string;
  token?: string;
}

export interface YunoCheckout {
  session: string;
}

export interface YunoPayment {
  description: string;
  merchant_order_id: string;
  country?: string;
  amount: YunoAmount;
  payment_method: YunoPaymentMethod;
  workflow: 'SDK_CHECKOUT' | 'DIRECT' | 'REDIRECT';
  checkout?: YunoCheckout;
} 