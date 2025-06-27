import { z } from "zod";
import { Tool } from "../shared/types";
import { YunoClient } from "../client";
import { operationPaymentResponseAdditionalDataSchema } from "../shared/types/paymentSchemas";
import { randomUUID } from "crypto";

export const paymentCancelSchema = z.object({
  paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
  transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
  body: z.object({
    description: z.string().min(3).max(255).optional(),
    reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER", ""]).optional(),
    merchant_reference: z.string().min(3).max(255),
    response_additional_data: operationPaymentResponseAdditionalDataSchema,
  }),
  idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate cancels")
});

export const paymentCancelTool: Tool = {
  method: "payments.cancel",
  description: "Cancel a payment in Yuno.",
  schema: paymentCancelSchema,
  handler: async (yunoClient: YunoClient, { paymentId, transactionId, body, idempotency_key }: any, _extra?: any) => {
    const idempotencyKey = idempotency_key || randomUUID();
    const cancelResponse = await yunoClient.payments.cancel(paymentId, transactionId, body, idempotencyKey);
    return {
      content: [
        {
          type: "text" as const,
          text: `cancel response: ${JSON.stringify(cancelResponse, null, 4)}`,
        },
      ],
    };
  },
}; 