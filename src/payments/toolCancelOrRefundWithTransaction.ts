import { z } from "zod";
import { Tool } from "../shared/types/common";
import { paymentRefundSchema } from "../shared/types/paymentSchemas";
import { YunoClient } from "../client";
import { randomUUID } from "crypto";

export const paymentCancelOrRefundWithTransactionTool: Tool = {
  method: "payments.cancelOrRefundWithTransaction",
  description: "Cancel or refund a payment with transaction in Yuno.",
  schema: z.object({
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds")
  }),
  handler: async (yunoClient: YunoClient, { paymentId, transactionId, body, idempotency_key }: any, _extra?: any) => {
    const idempotencyKey = idempotency_key || randomUUID();
    const response = await yunoClient.payments.cancelOrRefundWithTransaction(paymentId, transactionId, body, idempotencyKey);
    return {
      content: [
        {
          type: "text" as const,
          text: `cancelOrRefundWithTransaction response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
}; 