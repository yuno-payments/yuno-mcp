import z from "zod";
import { YunoAddress, YunoDocument, YunoMetadata, YunoPhone } from "../shared/types/common";
import { addressSchema, documentSchema, metadataSchema, phoneSchema } from "../shared/types/commonSchemas";

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

export const customerCreateSchema = z.object({
  merchant_customer_id: z.string().min(1).max(255),
  merchant_customer_created_at: z.string().optional(),
  first_name: z.string().min(1).max(255).optional(),
  last_name: z.string().min(1).max(255).optional(),
  gender: z.enum(["M", "F", "NB"]).optional(),
  date_of_birth: z.string().length(10).optional(),
  email: z.string().min(3).max(255),
  nationality: z.string().length(2).optional(),
  country: z.string().length(2).optional(),
  document: documentSchema,
  phone: phoneSchema,
  billing_address: addressSchema,
  shipping_address: addressSchema,
  metadata: metadataSchema,
});

export const customerUpdateSchema = z.object({
  customerId: z.string().min(36).max(64).describe("The unique identifier of the customer to update (MIN 36, MAX 64 characters)"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  gender: z.enum(["M", "F", "NB"]).optional(),
  date_of_birth: z.string().optional(),
  email: z.string().optional(),
  nationality: z.string().optional(),
  country: z.string().optional(),
  document: documentSchema,
  phone: phoneSchema,
  billing_address: addressSchema,
  shipping_address: addressSchema,
  metadata: metadataSchema,
  merchant_customer_created_at: z.string().optional(),
});

export type CustomerUpdateSchema = z.infer<typeof customerUpdateSchema>;
