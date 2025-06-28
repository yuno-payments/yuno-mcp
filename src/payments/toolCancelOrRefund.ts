import { z } from "zod";
import { Tool } from "../shared/types";
import { paymentRefundSchema } from "../shared/types/paymentSchemas";
import { YunoClient } from "../client";
import { randomUUID } from "crypto";

export const paymentCancelOrRefundTool: Tool = {
  method: "payments.cancelOrRefund",
  description: "Cancel or refund a payment in Yuno.",
  schema: z.object({
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds")
  }),
  handler: async (yunoClient: YunoClient, { paymentId, body, idempotency_key }: any, _extra?: any) => {
    const idempotencyKey = idempotency_key || randomUUID();
    const response = await yunoClient.payments.cancelOrRefund(paymentId, body, idempotencyKey);
    return {
      content: [
        {
          type: "text" as const,
          text: `cancelOrRefund response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
}; 