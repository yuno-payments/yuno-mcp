import { YunoAddress, YunoMetadata, YunoPhone } from "./common";

export interface YunoCustomerDocument {
  document_type: string;
  document_number: string;
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