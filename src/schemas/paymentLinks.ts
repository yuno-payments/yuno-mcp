import { z } from "zod";
import { addressSchema, amountSchema, documentSchema, metadataSchema, phoneSchema } from "./shared";

const customerPayerSchema = z
  .object({
    id: z.string().min(36).max(64).optional().describe("The unique identifier of the customer in uuid v4 format"),
    merchant_customer_id: z.string().min(3).max(255).optional().describe("The unique identifier for a customer in the merchant's system"),
    first_name: z.string().min(1).max(255).optional().describe("The customer's first name"),
    last_name: z.string().min(1).max(255).optional().describe("The customer's last name"),
    gender: z.string().min(1).max(2).optional().describe("The customer's gender (M/F/NA/NK)"),
    date_of_birth: z.string().length(10).optional().describe("The customer's date of birth in the YYYY-MM-DD format"),
    email: z.string().min(3).max(255).optional().describe("The customer's e-mail"),
    nationality: z.string().length(2).optional().describe("The customer's nationality (ISO 3166-1)"),
    document: documentSchema.optional(),
    billing_address: addressSchema.optional(),
    shipping_address: addressSchema.optional(),
    phone: phoneSchema.optional(),
    ip_address: z.string().min(1).max(45).optional().describe("The customer's IP address"),
  })
  .passthrough();

const paymentLinkCreateSchema = z
  .object({
    account_id: z.string().optional().describe("Account ID for the payment"),
    description: z.string().max(255).optional().describe("The description of the payment"),
    country: z.string().min(2).max(2).describe("Country (ISO 3166-1)"),
    merchant_order_id: z.string().min(3).max(255).optional().describe("The unique identifier of the customer's order"),
    amount: amountSchema.describe("Specifies the payment amount object"),
    capture: z.boolean().optional().describe("Whether to capture the payment immediately, true by default"),
    type: z.string().optional().describe("Payment link classification"),
    payment_method: z.any().optional().describe("Payment method configuration"),
    installments_plan: z.any().optional().describe("Installment arrangement details"),
    timezone: z.string().optional().describe("Availability timezone (e.g., UTC +03:00)"),
    payments_number: z.number().int().optional().describe("Count of linked payments"),
    split_payment_methods: z.boolean().optional().describe("Enable divided payment options"),
    taxes: z
      .array(
        z
          .object({
            type: z.string(),
            value: z.number(),
            tax_base: z.number().optional(),
            percentage: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
    customer_payer: customerPayerSchema.optional(),
    additional_data: z.any().optional(),
    callback_url: z.string().optional(),
    one_time_use: z.boolean().optional(),
    availability: z
      .object({
        start_at: z.string().optional(),
        finish_at: z.string().optional(),
      })
      .passthrough()
      .optional(),
    payment_method_types: z.array(z.string()),
    metadata: metadataSchema,
    vault_on_success: z.boolean().optional(),
  })
  .passthrough();

const paymentLinkCancelSchema = z
  .object({
    paymentLinkId: z.string().describe("The code of the payment link to cancel"),
  })
  .passthrough()
  .describe("Parameters for payment link cancellation");

export { paymentLinkCreateSchema, paymentLinkCancelSchema };
