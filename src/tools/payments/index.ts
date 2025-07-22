import z from "zod";
import { paymentCancelSchema, paymentCaptureAuthorizationSchema, paymentCreateSchema, paymentRefundSchema } from "../../schemas";
import { randomUUID } from "node:crypto";
import type { HandlerContext, Output, Tool } from "../../types";
import type {
  PaymentCancelSchema,
  PaymentCaptureAuthorizationSchema,
  PaymentCreateBody,
  PaymentCreateSchema,
  PaymentRefundSchema,
  YunoPayment,
} from "./types";

export const paymentCreateTool = {
  method: "paymentCreate",
  description: "Create a new payment in Yuno.",
  schema: paymentCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ payment, idempotency_key }: PaymentCreateSchema): Promise<Output<TType, YunoPayment>> => {
      const paymentWithAccount = {
        ...payment,
        account_id: payment.account_id || yunoClient.accountCode,
      } satisfies PaymentCreateBody;
      const idempotencyKey = idempotency_key || randomUUID();
      const paymentResponse = await yunoClient.payments.create(paymentWithAccount, idempotencyKey);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(paymentResponse, null, 4),
            },
          ],
        } as Output<TType, YunoPayment>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: paymentResponse,
          },
        ],
      } as Output<TType, YunoPayment>;
    },
} as const satisfies Tool;

export const paymentRetrieveTool = {
  method: "paymentRetrieve",
  description: "Retrieve a payment by ID in Yuno.",
  schema: z.object({
    payment_id: z.string().describe("The unique identifier of the payment"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ payment_id }: { payment_id: string }): Promise<Output<TType, YunoPayment>> => {
      const payment = await yunoClient.payments.retrieve(payment_id);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(payment, null, 4),
            },
          ],
        } as Output<TType, YunoPayment>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: payment,
          },
        ],
      } as Output<TType, YunoPayment>;
    },
} as const satisfies Tool;

export const paymentRetrieveByMerchantOrderIdTool = {
  method: "paymentRetrieveByMerchantOrderId",
  description: "Retrieve payments by merchant order ID in Yuno.",
  schema: z.object({
    merchant_order_id: z.string().describe("The unique identifier of the order for the payment (merchant_order_id)"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ merchant_order_id }: { merchant_order_id: string }): Promise<Output<TType, YunoPayment[]>> => {
      const payments = await yunoClient.payments.retrieveByMerchantOrderId(merchant_order_id);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(payments, null, 4),
            },
          ],
        } as Output<TType, YunoPayment[]>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: payments,
          },
        ],
      } as Output<TType, YunoPayment[]>;
    },
} as const satisfies Tool;

export const paymentRefundTool = {
  method: "paymentRefund",
  description: "Refund a payment in Yuno.",
  schema: z.object({
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      paymentId,
      transactionId,
      body,
      idempotency_key,
    }: {
      paymentId: string;
      transactionId: string;
      body: PaymentRefundSchema;
      idempotency_key: string;
    }): Promise<Output<TType, YunoPayment>> => {
      const idempotencyKey = idempotency_key || randomUUID();
      const refundResponse = await yunoClient.payments.refund(paymentId, transactionId, body, idempotencyKey);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(refundResponse, null, 4),
            },
          ],
        } as Output<TType, YunoPayment>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: refundResponse,
          },
        ],
      } as Output<TType, YunoPayment>;
    },
} as const satisfies Tool;

export const paymentCancelOrRefundTool = {
  method: "paymentCancelOrRefund",
  description: "Cancel or refund a payment in Yuno.",
  schema: z.object({
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      paymentId,
      body,
      idempotency_key,
    }: {
      paymentId: string;
      body: PaymentRefundSchema;
      idempotency_key: string;
    }): Promise<Output<TType, YunoPayment>> => {
      const idempotencyKey = idempotency_key || randomUUID();
      const response = await yunoClient.payments.cancelOrRefund(paymentId, body, idempotencyKey);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response, null, 4),
            },
          ],
        } as Output<TType, YunoPayment>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: response,
          },
        ],
      } as Output<TType, YunoPayment>;
    },
} as const satisfies Tool;

export const paymentCancelOrRefundWithTransactionTool = {
  method: "paymentCancelOrRefundWithTransaction",
  description: "Cancel or refund a payment with transaction in Yuno.",
  schema: z.object({
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      paymentId,
      transactionId,
      body,
      idempotency_key,
    }: {
      paymentId: string;
      transactionId: string;
      body: PaymentRefundSchema;
      idempotency_key: string;
    }): Promise<Output<TType, YunoPayment>> => {
      const idempotencyKey = idempotency_key || randomUUID();
      const response = await yunoClient.payments.cancelOrRefundWithTransaction(paymentId, transactionId, body, idempotencyKey);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response, null, 4),
            },
          ],
        } as Output<TType, YunoPayment>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: response,
          },
        ],
      } as Output<TType, YunoPayment>;
    },
} as const satisfies Tool;

export const paymentCancelTool = {
  method: "paymentCancel",
  description: "Cancel a payment in Yuno.",
  schema: paymentCancelSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      paymentId,
      transactionId,
      body,
      idempotency_key,
    }: {
      paymentId: string;
      transactionId: string;
      body: PaymentCancelSchema;
      idempotency_key: string;
    }): Promise<Output<TType, YunoPayment>> => {
      const idempotencyKey = idempotency_key || randomUUID();
      const cancelResponse = await yunoClient.payments.cancel(paymentId, transactionId, body, idempotencyKey);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(cancelResponse, null, 4),
            },
          ],
        } as Output<TType, YunoPayment>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: cancelResponse,
          },
        ],
      } as Output<TType, YunoPayment>;
    },
} as const satisfies Tool;

export const paymentAuthorizeTool = {
  method: "paymentAuthorize",
  description: "Authorize a payment in Yuno.",
  schema: paymentCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      payment,
      idempotency_key,
    }: {
      payment: PaymentCreateSchema["payment"];
      idempotency_key: string;
    }): Promise<Output<TType, YunoPayment>> => {
      const paymentWithAccount = {
        ...payment,
        account_id: payment.account_id || yunoClient.accountCode,
      };
      const idempotencyKey = idempotency_key || randomUUID();
      const paymentResponse = await yunoClient.payments.authorize(paymentWithAccount, idempotencyKey);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(paymentResponse, null, 4),
            },
          ],
        } as Output<TType, YunoPayment>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: paymentResponse,
          },
        ],
      } as Output<TType, YunoPayment>;
    },
} as const satisfies Tool;

export const paymentCaptureAuthorizationTool = {
  method: "paymentCaptureAuthorization",
  description: "Capture an authorized payment in Yuno.",
  schema: paymentCaptureAuthorizationSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      paymentId,
      transactionId,
      body,
      idempotency_key,
    }: {
      paymentId: string;
      transactionId: string;
      body: PaymentCaptureAuthorizationSchema;
      idempotency_key: string;
    }): Promise<Output<TType, YunoPayment>> => {
      const idempotencyKey = idempotency_key || randomUUID();
      const response = await yunoClient.payments.captureAuthorization(paymentId, transactionId, body, idempotencyKey);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response, null, 4),
            },
          ],
        } as Output<TType, YunoPayment>;
      }

      return response as Output<TType, YunoPayment>;
    },
} as const satisfies Tool;

export const paymentTools = [
  paymentCreateTool,
  paymentRetrieveTool,
  paymentRetrieveByMerchantOrderIdTool,
  paymentRefundTool,
  paymentCancelOrRefundTool,
  paymentCancelOrRefundWithTransactionTool,
  paymentCancelTool,
  paymentAuthorizeTool,
  paymentCaptureAuthorizationTool,
] as const satisfies Tool[];
