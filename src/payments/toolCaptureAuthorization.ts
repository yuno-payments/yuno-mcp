import { z } from "zod";
import { Tool } from "../shared/types/common";
import { YunoClient } from "../client";
import { randomUUID } from "crypto";

export const paymentCaptureAuthorizationSchema = z.object({
  paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
  transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
  body: z.object({
    merchant_reference: z.string().min(3).max(255),
    amount: z.object({
      currency: z.enum([
        "ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"
      ]),
      value: z.string(),
    }).optional(),
    reason: z.string().min(3).max(255),
    simplified_mode: z.boolean().optional(),
  }),
  idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate captures")
});

export const paymentCaptureAuthorizationTool: Tool = {
  method: "payments.captureAuthorization",
  description: "Capture an authorized payment in Yuno.",
  schema: paymentCaptureAuthorizationSchema,
  handler: async (yunoClient: YunoClient, { paymentId, transactionId, body, idempotency_key }: any, _extra?: any) => {
    const idempotencyKey = idempotency_key || randomUUID();
    const response = await yunoClient.payments.captureAuthorization(paymentId, transactionId, body, idempotencyKey);
    return {
      content: [
        {
          type: "text" as const,
          text: `captureAuthorization response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
}; 