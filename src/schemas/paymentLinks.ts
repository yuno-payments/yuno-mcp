import { z } from "zod";
import { addressSchema, amountSchema, documentSchema, metadataSchema, phoneSchema } from "./shared";

const customerPayerSchema = z.object({
  id: z.string().min(36).max(64).optional().describe("The unique identifier of the customer in uuid v4 format (MAX 64 ; MIN 36)").optional(),
  merchant_customer_id: z.string().min(1).max(255).optional().describe("The unique identifier for a customer in the merchant's system").optional(),
  first_name: z.string().min(1).max(255).optional().describe("The customer's first name").optional(),
  last_name: z.string().min(1).max(255).optional().describe("The customer's last name").optional(),
  gender: z.string().min(1).max(2).optional().describe("The customer's gender (M/F/NB/NA/NK/U)").optional(),
  date_of_birth: z.string().length(10).optional().describe("The customer's date of birth in the YYYY-MM-DD format").optional(),
  email: z.string().min(1).max(255).optional().describe("The customer's e-mail").optional(),
  nationality: z.string().length(2).optional().describe("The customer's nationality (ISO 3166-1)").optional(),
  document: documentSchema.optional(),
  billing_address: addressSchema.optional(),
  shipping_address: addressSchema.optional(),
  phone: phoneSchema.optional(),
  ipAddress: z.string().min(1).max(45).optional(),
});

const paymentLinkCreateSchema = z.object({
  account_id: z.string().optional().describe("Account ID for the payment"),
  description: z.string().max(255).describe("The description of the payment"),
  country: z.string().min(2).max(2).describe("Country (ISO 3166-1)"),
  merchant_order_id: z.string().min(3).max(255).describe("The unique identifier of the customer's order"),
  amount: amountSchema.describe("Specifies the payment amount object"),
  capture: z.boolean().optional().describe("Whether to capture the payment immediately, true by default"),
  taxes: z
    .array(
      z.object({
        type: z.string(),
        value: z.number(),
        tax_base: z.number().optional(),
        percentage: z.number().optional(),
      }),
    )
    .optional(),
  customer_payer: customerPayerSchema.optional(),
  additional_data: z.any().optional(),
  callback_url: z.string().url().optional(),
  one_time_use: z.boolean().optional(),
  availability: z
    .object({
      start_at: z.string().optional(),
      finish_at: z.string().optional(),
    })
    .optional(),
  payment_method_types: z.array(z.string()),
  metadata: metadataSchema,
  vault_on_success: z.boolean().optional(),
});

const paymentLinkCancelSchema = z
  .object({
    description: z.string().optional().describe("Reason for the cancellation"),
    reason: z
      .enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER", "OTHER"])
      .optional()
      .describe("Reason for the cancellation. Values could be DUPLICATE, FRAUDULENT, REQUESTED_BY_CUSTOMER, and OTHER."),
    merchant_reference: z.string().optional().describe("Merchant reference for the cancellation"),
  })
  .describe("Body for payment link cancellation");

export { paymentLinkCreateSchema, paymentLinkCancelSchema };
