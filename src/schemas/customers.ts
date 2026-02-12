import { z } from "zod";
import { addressSchema, metadataSchema, phoneSchema, documentSchema } from "./shared";

const customerCreateSchema = z
  .object({
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
  })
  .passthrough();

const customerUpdateSchema = z
  .object({
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
  })
  .passthrough();

export { customerCreateSchema, customerUpdateSchema };
