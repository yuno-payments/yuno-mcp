import z from "zod";

export const addressSchema = z
  .object({
    address_line_1: z.string(),
    address_line_2: z.string().optional(),
    country: z.string().min(2).max(2).optional().describe("Country (ISO 3166-1)"),
    state: z.string(),
    city: z.string(),
    zip_code: z.string(),
    neighborhood: z.string().optional(),
  })
  .optional();

export const metadataSchema = z.array(z.object({ key: z.string(), value: z.string() })).optional();

export const phoneSchema = z
  .object({
    number: z.string(),
    country_code: z.string(),
  })
  .optional();

export const documentSchema = z
  .object({
    document_type: z.string(),
    document_number: z.string(),
  })
  .optional();

export const cardDataSchema = z.object({
  number: z.string().min(8).max(19),
  expiration_month: z.number().min(1).max(12),
  expiration_year: z.number().min(1).max(9999),
  security_code: z.string().min(3).max(4).optional(),
  holder_name: z.string().min(3).max(26).optional(),
  type: z.string().optional(),
});

export const amountSchema = z.object({
  currency: z.string().min(3).max(3).describe("The currency used to make the payment (ISO 4217)"),
  value: z.number().min(0).describe("The payment amount"),
});
