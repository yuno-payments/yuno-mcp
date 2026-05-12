import { z } from "zod";
import { addressSchema, metadataSchema, phoneSchema, documentSchema } from "./shared";

const yunoCustomerOutputSchema = z
  .object({
    merchant_customer_id: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    gender: z.string().nullish(),
    date_of_birth: z.string().nullish(),
    email: z.string().nullish(),
    document: documentSchema,
    phone: phoneSchema,
    billing_address: addressSchema,
    shipping_address: addressSchema,
    metadata: metadataSchema,
    merchant_customer_created_at: z.string().nullish(),
  })
  .passthrough();

const customerCreateSchema = z
  .object({
    merchant_customer_id: z.string().min(3).max(255),
    merchant_customer_created_at: z.string().nullish(),
    first_name: z.string().min(3).max(255).nullish(),
    last_name: z.string().min(3).max(255).nullish(),
    gender: z.string().nullish(),
    date_of_birth: z.string().length(10).nullish(),
    email: z.string().min(3).max(255).nullish(),
    nationality: z.string().length(2).nullish(),
    country: z.string().length(2).nullish(),
    document: documentSchema,
    phone: phoneSchema,
    billing_address: addressSchema,
    shipping_address: addressSchema,
    metadata: metadataSchema,
  })
  .passthrough();

const customerUpdateSchema = z
  .object({
    customerId: z.string().min(36).max(64).describe("The unique identifier of the customer to update (MIN 36, MAX 64 characters)"),
    merchant_customer_id: z.string().min(3).max(255).nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    gender: z.string().nullish(),
    date_of_birth: z.string().nullish(),
    email: z.string().nullish(),
    nationality: z.string().nullish(),
    country: z.string().nullish(),
    document: documentSchema,
    phone: phoneSchema,
    billing_address: addressSchema,
    shipping_address: addressSchema,
    metadata: metadataSchema,
    merchant_customer_created_at: z.string().nullish(),
  })
  .passthrough();

export { customerCreateSchema, customerUpdateSchema, yunoCustomerOutputSchema };
