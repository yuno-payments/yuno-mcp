import { z } from "zod";
import { addressSchema, documentSchema, phoneSchema } from "./shared";

const legalRepresentativeSchema = z
  .object({
    merchant_reference: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    email: z.string().nullish(),
    date_of_birth: z.string().nullish(),
    country: z.string().min(2).max(2).nullish(),
    nationality: z.string().min(2).max(2).nullish(),
    title: z.string().nullish(),
    publicly_exposed_person: z.boolean().nullish(),
    ultimate_beneficial_owner: z.boolean().nullish(),
  })
  .passthrough();

const withdrawalMethodsBankSchema = z
  .object({
    code: z.string().min(3).max(3),
    branch: z.string().min(3).max(3),
    branch_digit: z.string().min(3).max(3).nullish(),
    account: z.string().min(3).max(250),
    account_digit: z.string().min(3).max(250).nullish(),
    account_type: z.enum(["CHECKINGS", "SAVINGS"]),
    routing: z.string().nullish(),
    country: z.string().min(2).max(2),
    currency: z.string().min(3).max(3),
    payout_schedule: z.enum(["DAY", "WEEK", "MONTH", "HOLD"]).nullish(),
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
    account_id: z.string().nullish(),
    type: z.enum(["PREVIOUSLY_ONBOARDED", "ONBOARD_ONTO_THE_PROVIDER"]),
    workflow: z.enum(["HOSTED_BY_PROVIDER", "DIRECT"]),
    description: z.string().nullish(),
    callback_url: z.string().nullish(),
    provider: z
      .object({
        id: z.string().describe("Provider ID (e.g., PAGARME, STRIPE, ADYEN)"),
        connection_id: z.string(),
        recipient_id: z.string().nullish(),
        recipient_type: z.enum(["MEAL", "FOOD", "MULTI_BENEFITS", "FLEET"]).nullish(),
      })
      .passthrough(),
    documentation: z.array(documentationItemSchema).nullish(),
    withdrawal_methods: z
      .object({
        bank: withdrawalMethodsBankSchema.nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const recipientCreateSchema = z
  .object({
    account_id: z.string().min(36).max(64).nullish().describe("Account ID for the recipient"),
    merchant_recipient_id: z.string().describe("The unique identifier for the recipient in the merchant system"),
    national_entity: z.enum(["INDIVIDUAL", "ENTITY"]).describe("Beneficiary's national entity type. Could be INDIVIDUAL or ENTITY"),
    entity_type: z
      .enum(["GOVERNMENTAL", "PUBLIC", "NON_PROFIT", "PRIVATE"])
      .nullish()
      .describe("The Beneficiary's type of organization"),
    first_name: z.string().nullish().describe("First name of the recipient"),
    last_name: z.string().nullish().describe("Last name of the recipient"),
    date_of_birth: z.string().nullish().describe("Date of birth of the recipient (YYYY-MM-DD)"),
    legal_name: z.string().nullish().describe("Legal name of the recipient (required for ENTITY)"),
    email: z.string().email().nullish().describe("Email of the recipient"),
    country: z.string().min(2).max(2).describe("Country code (ISO 3166-1)"),
    website: z.string().nullish().describe("Seller website URL"),
    industry: z.string().nullish().describe("Industry category"),
    merchant_category_code: z.string().nullish().describe("MCC code"),
    document: documentSchema,
    phone: phoneSchema,
    address: addressSchema,
    legal_representatives: z.array(legalRepresentativeSchema).nullish().describe("Legal representatives (required for ENTITY)"),
    withdrawal_methods: z
      .object({
        bank: withdrawalMethodsBankSchema.nullish(),
      })
      .passthrough()
      .nullish()
      .describe("Withdrawal methods for the recipient"),
    documentation: z.array(documentationItemSchema).nullish().describe("Supporting documentation"),
    onboardings: z.array(onboardingSchema).nullish().describe("Provider onboarding configurations"),
    terms_of_service: z
      .object({
        acceptance: z.boolean(),
        date: z.string(),
        ip: z.string().nullish(),
      })
      .passthrough()
      .nullish()
      .describe("Terms of service acceptance"),
  })
  .passthrough();

const recipientUpdateSchema = z
  .object({
    recipientId: z.string().describe("The unique identifier of the recipient to update"),
    merchant_recipient_id: z.string().nullish().describe("The unique identifier of the recipient in the merchant system"),
    national_entity: z.enum(["INDIVIDUAL", "ENTITY"]).nullish().describe("Beneficiary's national entity type"),
    entity_type: z.enum(["GOVERNMENTAL", "PUBLIC", "NON_PROFIT", "PRIVATE"]).nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    legal_name: z.string().nullish(),
    email: z.string().nullish(),
    date_of_birth: z.string().nullish(),
    country: z.string().min(2).max(2).nullish(),
    website: z.string().nullish(),
    industry: z.string().nullish(),
    merchant_category_code: z.string().nullish(),
    document: documentSchema,
    phone: phoneSchema,
    address: addressSchema,
    legal_representatives: z.array(legalRepresentativeSchema).nullish(),
    withdrawal_methods: z
      .object({
        bank: withdrawalMethodsBankSchema.nullish(),
      })
      .passthrough()
      .nullish(),
    documentation: z.array(documentationItemSchema).nullish(),
    onboardings: z.array(onboardingSchema).nullish(),
    terms_of_service: z
      .object({
        acceptance: z.boolean().nullish(),
        date: z.string().nullish(),
        ip: z.string().nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough();

const yunoRecipientOutputSchema = z
  .object({
    id: z.string().nullish(),
    account_id: z.string().nullish(),
    merchant_recipient_id: z.string().nullish(),
    national_entity: z.string().nullish(),
    entity_type: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    legal_name: z.string().nullish(),
    email: z.string().nullish(),
    date_of_birth: z.string().nullish(),
    country: z.string().nullish(),
    website: z.string().nullish(),
    industry: z.string().nullish(),
    merchant_category_code: z.string().nullish(),
    status: z.string().nullish(),
    document: documentSchema,
    phone: phoneSchema,
    address: addressSchema,
    withdrawal_methods: z
      .object({
        bank: z
          .object({
            code: z.string().nullish(),
            branch: z.string().nullish(),
            account: z.string().nullish(),
            account_type: z.string().nullish(),
            branch_digit: z.string().nullish(),
            account_digit: z.string().nullish(),
            routing: z.string().nullish(),
            country: z.string().nullish(),
            currency: z.string().nullish(),
            payout_schedule: z.string().nullish(),
          })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
    legal_representatives: z
      .array(
        z
          .object({
            merchant_reference: z.string().nullish(),
            first_name: z.string().nullish(),
            last_name: z.string().nullish(),
            email: z.string().nullish(),
            date_of_birth: z.string().nullish(),
            country: z.string().nullish(),
            nationality: z.string().nullish(),
            title: z.string().nullish(),
            publicly_exposed_person: z.boolean().nullish(),
            ultimate_beneficial_owner: z.boolean().nullish(),
          })
          .passthrough(),
      )
      .nullish(),
  })
  .passthrough();

export { recipientCreateSchema, recipientUpdateSchema, yunoRecipientOutputSchema };
