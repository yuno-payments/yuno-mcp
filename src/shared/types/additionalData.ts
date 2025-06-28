import { YunoAddress } from "./common";

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

export interface YunoAdditionalData {
  order?: YunoOrder;
  airline?: YunoAirline;
  seller_details?: YunoSellerDetails;
}
