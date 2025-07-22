import z from "zod";
import { customerUpdateSchema } from "../../schemas";
import type { YunoAddress, YunoDocument, YunoMetadata, YunoPhone } from "../../types";

export interface YunoCustomer {
  merchant_customer_id: string;
  first_name?: string;
  last_name?: string;
  gender?: "M" | "F" | "NB";
  date_of_birth?: string;
  email?: string;
  document?: YunoDocument;
  phone?: YunoPhone;
  billing_address?: YunoAddress;
  shipping_address?: YunoAddress;
  metadata?: YunoMetadata[];
  merchant_customer_created_at?: string;
}

export type CustomerUpdateSchema = z.infer<typeof customerUpdateSchema>;
