import { z } from "zod";
import { addressSchema, documentSchema, phoneSchema } from "./shared";

const recipientCreateSchema = z.object({
  account_id: z.string().min(36).max(64).optional().describe("Account ID for the recipient"),
  merchant_recipient_id: z.string().optional().describe("The unique identifier for the recipient in the merchant system"),
  national_entity: z.enum(["INDIVIDUAL", "ENTITY"]).describe("Beneficiary's national entity type. Could be INDIVIDUAL or ENTITY"),
  entity_type: z
    .enum(["GOVERNMENTAL", "PUBLIC", "NON_PROFIT", "PRIVATE"])
    .optional()
    .describe("The Beneficiary's type of organization. GOVERNMENTAL, PUBLIC, NON_PROFIT, PRIVATE"),
  first_name: z.string().optional().describe("First name of the recipient"),
  last_name: z.string().optional().describe("Last name of the recipient"),
  date_of_birth: z.string().optional().describe("Date of birth of the recipient"),
  legal_name: z.string().optional().describe("Legal name of the recipient"),
  email: z.string().email().optional().describe("Email of the recipient"),
  country: z.string().min(2).max(2).optional().describe("Country code (ISO 3166-1)"),
  document: documentSchema,
  phone: phoneSchema,
  address: addressSchema,
  bank: z
    .object({
      code: z.string().min(3).max(3),
      branch: z.string().min(3).max(3),
      branch_digit: z.string().min(3).max(3).optional(),
      account: z.string().min(3).max(250),
      account_digit: z.string().min(3).max(250).optional(),
      account_type: z.string().min(1).max(3),
      routing: z.string().optional(),
      country: z.string().min(2).max(2),
      currency: z.string().min(3).max(3),
    })
    .optional()
    .describe("Withdrawal methods for the recipient"),
  providers: z.array(
    z
      .object({
        id: z.string(),
        recipient_id: z.string(),
      })
      .describe("Providers for the recipient"),
  ),
});

const recipientUpdateSchema = z.object({
  recipientId: z.string().describe("The unique identifier of the recipient to update"),
  merchant_recipientId: z.string().describe("The unique identifier of the recipient to update"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  national_entity: z.enum(["INDIVIDUAL", "ENTITY"]).optional().describe("Beneficiary's national entity type. Could be INDIVIDUAL or ENTITY"),
  legal_name: z.string().optional().describe("Legal name of the recipient"),
  email: z.string().optional(),
  phone: z.object({ number: z.string(), country_code: z.string() }).optional(),
  address: z
    .object({
      address_line_1: z.string(),
      address_line_2: z.string().optional(),
      country: z.string().min(2).max(2).optional(),
      state: z.string(),
      city: z.string(),
      zip_code: z.string(),
      neighborhood: z.string().optional(),
    })
    .optional(),
  bank: z
    .object({
      code: z.string().min(3).max(3),
      branch: z.string().min(3).max(3),
      branch_digit: z.string().min(3).max(3).optional(),
      account: z.string().min(3).max(250),
      account_digit: z.string().min(3).max(250).optional(),
      account_type: z.string().min(1).max(3),
      routing: z.string().optional(),
      country: z.string().min(2).max(2),
      currency: z.string().min(3).max(3),
    })
    .optional()
    .describe("Withdrawal methods for the recipient"),
  providers: z.array(
    z
      .object({
        id: z.string().optional(),
        recipient_id: z.string().optional(),
      })
      .optional()
      .describe("Providers for the recipient"),
  ),
});

export { recipientCreateSchema, recipientUpdateSchema };
