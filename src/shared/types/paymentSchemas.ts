import z from "zod";

export const paymentCreateSchema = z.object({
  payment: z.object({
    account_id: z.string().optional().describe("Account ID for the payment"),
    description: z.string().describe("Payment description"),
    additional_data: z.any().optional(),
    country: z.string().describe("Customer's country (ISO 3166-1)"),
    merchant_order_id: z.string().describe("Unique identifier for the order"),
    merchant_reference: z.string().optional(),
    amount: z.object({
      currency: z.enum([
        "ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"
      ]).describe("The currency used to make the payment (ISO 4217)"),
      value: z.number().describe("Payment amount")
    }).describe("Payment amount details"),
    customer_payer: z.object({
      id: z.string().describe("Customer unique identifier"),
      first_name: z.string().describe("First name of the customer"),
      last_name: z.string().describe("Last name of the customer"),
      email: z.string().describe("Email of the customer")
    }).describe("Customer payer info"),
    workflow: z.enum(["SDK_CHECKOUT", "DIRECT", "REDIRECT"]).describe("Payment workflow type"),
    payment_method: z.object({
      token: z.string().optional(),
      vaulted_token: z.string().optional(),
      type: z.string().describe("Payment method type"),
      detail: z.object({
        card: z.object({
          capture: z.boolean().optional(),
          installments: z.number().optional(),
          first_installment_deferral: z.number().optional(),
          soft_descriptor: z.string().optional(),
          card_data: z.object({
            number: z.string(),
            expiration_month: z.number().optional(),
            expiration_year: z.number().optional(),
            security_code: z.string().optional(),
            holder_name: z.string(),
            type: z.string().optional(),
          }),
          verify: z.boolean().optional(),
          stored_credentials: z.object({
            reason: z.string().optional(),
            usage: z.string().optional(),
            subscription_agreement_id: z.string().optional(),
            network_transaction_id: z.string().optional(),
          }).optional(),
        }).optional(),
      }).optional(),
      vault_on_success: z.boolean().optional(),
    }).describe("Payment method details"),
    callback_url: z.string().optional(),
    fraud_screening: z.any().optional(),
    split_marketplace: z.any().optional(),
    metadata: z.any().optional()
  }),
  idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate payments")
});

export const operationPaymentResponseAdditionalDataSchema = z.object({
  receipt: z.boolean().optional(),
  receipt_language: z.enum(["ES", "EN", "PT"]).optional(),
}).optional()

export const paymentRefundSchema = z.object({
  description: z.string().min(3).max(255).optional(),
  reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER"]).optional(),
  merchant_reference: z.string().min(3).max(255),
  amount: z.object({
    currency: z.enum(["ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"]).optional(),
    value: z.string().optional(),
  }).optional(),
  simplified_mode: z.boolean().optional(),
  response_additional_data: operationPaymentResponseAdditionalDataSchema,
  customer_payer: z.object({
    id: z.string().describe("Customer unique identifier").optional(),
    first_name: z.string().describe("First name of the customer").optional(),
    last_name: z.string().describe("Last name of the customer").optional(),
    email: z.string().describe("Email of the customer").optional()
  }).describe("Customer payer info"),
})
