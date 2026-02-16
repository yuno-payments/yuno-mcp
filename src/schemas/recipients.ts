import { z } from "zod";
import { addressSchema, documentSchema, phoneSchema } from "./shared";

const legalRepresentativeSchema = z
  .object({
    merchant_reference: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().optional(),
    date_of_birth: z.string().optional(),
    country: z.string().min(2).max(2).optional(),
    nationality: z.string().min(2).max(2).optional(),
    title: z.string().optional(),
    publicly_exposed_person: z.boolean().optional(),
    ultimate_beneficial_owner: z.boolean().optional(),
  })
  .passthrough();

const withdrawalMethodsBankSchema = z
  .object({
    code: z.string().min(3).max(3),
    branch: z.string().min(3).max(3),
    branch_digit: z.string().min(3).max(3).optional(),
    account: z.string().min(3).max(250),
    account_digit: z.string().min(3).max(250).optional(),
    account_type: z.enum(["CHECKINGS", "SAVINGS"]),
    routing: z.string().optional(),
    country: z.string().min(2).max(2),
    currency: z.string().min(3).max(3),
    payout_schedule: z.enum(["DAY", "WEEK", "MONTH", "HOLD"]).optional(),
  })
  .passthrough();

const documentationItemSchema = z
  .object({
    file_name: z.string().min(3).max(255),
    content_type: z.enum(["application/pdf", "image/jpeg", "image/png"]),
    content_category: z.string().describe("Document category (e.g., IDENTIFICATION_DOCUMENT, BANK_STATEMENT)"),
    content: z.string().describe("Base64-encoded content (max 2MB)"),
  })
  .passthrough();

const onboardingSchema = z
  .object({
    account_id: z.string().optional(),
    type: z.enum(["PREVIOUSLY_ONBOARDED", "ONBOARD_ONTO_THE_PROVIDER"]),
    workflow: z.enum(["HOSTED_BY_PROVIDER", "DIRECT"]),
    description: z.string().optional(),
    callback_url: z.string().optional(),
    provider: z
      .object({
        id: z.string().describe("Provider ID (e.g., PAGARME, STRIPE, ADYEN)"),
        connection_id: z.string(),
        recipient_id: z.string().optional(),
        recipient_type: z.enum(["MEAL", "FOOD", "MULTI_BENEFITS", "FLEET"]).optional(),
      })
      .passthrough(),
    documentation: z.array(documentationItemSchema).optional(),
    withdrawal_methods: z
      .object({
        bank: withdrawalMethodsBankSchema.optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const recipientCreateSchema = z
  .object({
    account_id: z.string().min(36).max(64).optional().describe("Account ID for the recipient"),
    merchant_recipient_id: z.string().optional().describe("The unique identifier for the recipient in the merchant system"),
    national_entity: z.enum(["INDIVIDUAL", "ENTITY"]).describe("Beneficiary's national entity type. Could be INDIVIDUAL or ENTITY"),
    entity_type: z
      .enum(["GOVERNMENTAL", "PUBLIC", "NON_PROFIT", "PRIVATE"])
      .optional()
      .describe("The Beneficiary's type of organization"),
    first_name: z.string().optional().describe("First name of the recipient"),
    last_name: z.string().optional().describe("Last name of the recipient"),
    date_of_birth: z.string().optional().describe("Date of birth of the recipient (YYYY-MM-DD)"),
    legal_name: z.string().optional().describe("Legal name of the recipient (required for ENTITY)"),
    email: z.string().email().optional().describe("Email of the recipient"),
    country: z.string().min(2).max(2).optional().describe("Country code (ISO 3166-1)"),
    website: z.string().optional().describe("Seller website URL"),
    industry: z.string().optional().describe("Industry category"),
    merchant_category_code: z.string().optional().describe("MCC code"),
    document: documentSchema,
    phone: phoneSchema,
    address: addressSchema,
    legal_representatives: z.array(legalRepresentativeSchema).optional().describe("Legal representatives (required for ENTITY)"),
    withdrawal_methods: z
      .object({
        bank: withdrawalMethodsBankSchema.optional(),
      })
      .passthrough()
      .optional()
      .describe("Withdrawal methods for the recipient"),
    documentation: z.array(documentationItemSchema).optional().describe("Supporting documentation"),
    onboardings: z.array(onboardingSchema).optional().describe("Provider onboarding configurations"),
    terms_of_service: z
      .object({
        acceptance: z.boolean(),
        date: z.string(),
        ip: z.string().optional(),
      })
      .passthrough()
      .optional()
      .describe("Terms of service acceptance"),
  })
  .passthrough();

const recipientUpdateSchema = z
  .object({
    recipientId: z.string().describe("The unique identifier of the recipient to update"),
    merchant_recipient_id: z.string().optional().describe("The unique identifier of the recipient in the merchant system"),
    national_entity: z.enum(["INDIVIDUAL", "ENTITY"]).optional().describe("Beneficiary's national entity type"),
    entity_type: z.enum(["GOVERNMENTAL", "PUBLIC", "NON_PROFIT", "PRIVATE"]).optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    legal_name: z.string().optional(),
    email: z.string().optional(),
    date_of_birth: z.string().optional(),
    country: z.string().min(2).max(2).optional(),
    website: z.string().optional(),
    industry: z.string().optional(),
    merchant_category_code: z.string().optional(),
    document: documentSchema,
    phone: phoneSchema,
    address: addressSchema,
    legal_representatives: z.array(legalRepresentativeSchema).optional(),
    withdrawal_methods: z
      .object({
        bank: withdrawalMethodsBankSchema.optional(),
      })
      .passthrough()
      .optional(),
    documentation: z.array(documentationItemSchema).optional(),
    onboardings: z.array(onboardingSchema).optional(),
    terms_of_service: z
      .object({
        acceptance: z.boolean().optional(),
        date: z.string().optional(),
        ip: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export { recipientCreateSchema, recipientUpdateSchema };
