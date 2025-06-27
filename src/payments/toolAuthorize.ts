import { z } from "zod";
import { Tool } from "../shared/types/common";
import { YunoClient } from "../client";
import { randomUUID } from "crypto";
import { paymentCreateSchema } from "../shared/types/paymentSchemas";

export const paymentAuthorizeTool: Tool = {
  method: "payments.authorize",
  description: "Authorize a payment in Yuno.",
  schema: paymentCreateSchema,
  handler: async (yunoClient: YunoClient, { payment, idempotency_key }: any, _extra?: any) => {
    const paymentWithAccount = { ...payment, account_id: payment.account_id || yunoClient.accountCode };
    const idempotencyKey = idempotency_key || randomUUID();
    const paymentResponse = await yunoClient.payments.create(paymentWithAccount, idempotencyKey);
    return {
      content: [
        {
          type: "text" as const,
          text: `authorize response: ${JSON.stringify(paymentResponse, null, 4)}`,
        },
      ],
    };
  },
}; 