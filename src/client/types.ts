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

export interface YunoInstallments {
  plan_id?: string;
  plan?: YunoInstallmentsPlan[];
}

export interface YunoInstallmentsPlan {
  installment: number;
  rate: number;
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

export interface YunoPaymentMethod {
  token?: string;
  vaulted_token?: string;
  type: string;
  detail?: YunoPaymentMethodDetail;
  vault_on_success?: boolean;
}

export interface YunoCheckout {
  session: string;
}

export interface YunoFraudScreening {
  stand_alone?: boolean;
}

export interface YunoSplitMarketplaceAmount {
  value: number;
  currency: string;
}

export interface YunoSplitMarketplaceLiability {
  processing_fee?: string;
  chargebacks?: boolean;
}

export interface YunoSplitMarketplaceItem {
  recipient_id?: string;
  provider_recipient_id?: string;
  type: string;
  merchant_reference?: string;
  amount: YunoSplitMarketplaceAmount;
  liability?: YunoSplitMarketplaceLiability;
}

export type YunoSplitMarketplace = YunoSplitMarketplaceItem[];

export interface YunoThreeDS {
  email: string;
  ip: string;
}

export interface YunoAdditionalData {
  order?: YunoOrder;
  airline?: YunoAirline;
  seller_details?: YunoSellerDetails;
}

export interface YunoPayment {
  account_id?: string;
  description: string;
  additional_data?: YunoAdditionalData;
  country: string;
  merchant_order_id: string;
  merchant_reference?: string;
  amount: YunoAmount;
  customer_payer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  workflow: 'SDK_CHECKOUT' | 'DIRECT' | 'REDIRECT';
  payment_method: YunoPaymentMethod;
  callback_url?: string;
  fraud_screening?: YunoFraudScreening;
  split_marketplace?: YunoSplitMarketplace;
  metadata?: YunoMetadata[];
}

export interface YunoOrderTax {
  type: string;
  tax_base?: number;
  value: number;
  percentage?: number;
}

export interface YunoOrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_amount: number;
  category: string;
  brand?: string;
  sku_code?: string;
  manufacture_part_number?: string;
}

export interface YunoOrderShipping {
  type?: string;
  description?: string;
  carrier?: string;
  deliver_at?: string;
}

export interface YunoOrderTicket {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  amount?: {
    currency: string;
    value: number;
  };
  event?: {
    id?: string;
    name?: string;
    description?: string;
    type?: string;
    date?: string;
    address?: YunoAddress;
  };
}

export interface YunoOrderAccountFundingParty {
  national_entity: string;
  first_name: string;
  last_name: string;
  legal_name?: string;
  email: string;
  country: string;
  date_of_birth?: string;
  document?: {
    document_type: string;
    document_number: string;
  };
  phone?: {
    country_code: string;
    number: string;
  };
  address?: YunoAddress;
}

export interface YunoOrderAccountFunding {
  sender?: YunoOrderAccountFundingParty;
  beneficiary?: YunoOrderAccountFundingParty;
}

export interface YunoOrderDiscount {
  id: string;
  name: string;
  unit_amount?: number;
}

export interface YunoOrder {
  shipping_amount?: number;
  fee_amount?: number;
  tip_amount?: string;
  taxes?: YunoOrderTax[];
  items?: YunoOrderItem[];
  shipping?: YunoOrderShipping;
  tickets?: YunoOrderTicket[];
  account_funding?: YunoOrderAccountFunding;
  discounts?: YunoOrderDiscount[];
  sales_channel?: string;
}

export interface YunoAirlineLeg {
  departure_airport: string;
  departure_datetime: string;
  departure_airport_country: string;
  departure_airport_city: string;
  departure_airport_timezone?: string;
  arrival_airport: string;
  arrival_airport_country: string;
  arrival_airport_city: string;
  arrival_airport_timezone?: string;
  arrival_datetime?: string;
  carrier_code: string;
  flight_number: string;
  fare_basis_code: string;
  fare_class_code: string;
  base_fare?: number;
  base_fare_currency?: string;
  stopover_code?: string;
}

export interface YunoAirlinePassenger {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  type?: string;
  date_of_birth?: string;
  nationality?: string;
  document?: {
    document_number: string;
    document_type: string;
  };
  loyalty_number?: string;
  loyalty_tier?: string;
  phone?: {
    country_code: string;
    number: string;
  };
}

export interface YunoAirlineTicket {
  ticket_number?: string;
  e_ticket?: boolean;
  restricted?: boolean;
  total_fare_amount?: number;
  total_tax_amount?: number;
  total_fee_amount?: number;
  issue?: {
    carrier_prefix_code?: string;
    travel_agent_code?: string;
    travel_agent_name?: string;
    booking_system_code?: string;
    booking_system_name?: string;
    date?: string;
    address?: string;
    city?: string;
    country?: string;
  };
}

export interface YunoAirline {
  pnr: string;
  legs?: YunoAirlineLeg[];
  passengers?: YunoAirlinePassenger[];
  tickets?: YunoAirlineTicket[];
}

export interface YunoSellerDetails {
  name?: string;
  email?: string;
  reference?: string;
  website?: string;
  industry?: string;
  merchant_category_code?: string;
  country: string;
  document?: {
    document_type: string;
    document_number: string;
  };
  phone?: {
    country_code?: string;
    number?: string;
  };
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