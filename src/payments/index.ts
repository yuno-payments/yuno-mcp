import { Tool } from "../shared/types/common";
import { YunoClient } from "../client";
import z from "zod";
import { randomUUID } from "crypto";
import { PaymentCancelSchema, paymentCancelSchema, PaymentCaptureAuthorizationSchema, paymentCaptureAuthorizationSchema, PaymentCreateBody, PaymentCreateSchema, paymentCreateSchema, PaymentRefundSchema, paymentRefundSchema } from "./types";

export const paymentCreateTool: Tool = {
  method: "paymentCreate",
  description: "Create a new payment in Yuno.",
  schema: paymentCreateSchema,
  handler: async (yunoClient: YunoClient, { payment, idempotency_key }: PaymentCreateSchema) => {
    const paymentWithAccount = {
      ...payment,
      account_id: payment.account_id || yunoClient.accountCode,
    } satisfies PaymentCreateBody;
    const idempotencyKey = idempotency_key || randomUUID();
    const paymentResponse = await yunoClient.payments.create(paymentWithAccount, idempotencyKey);
    return {
      content: [
        {
          type: "text" as const,
          text: `payment response: ${JSON.stringify(paymentResponse, null, 4)}`,
        },
      ],
    };
  },
};

export const paymentRetrieveTool: Tool = {
  method: "paymentRetrieve",
  description: "Retrieve a payment by ID in Yuno.",
  schema: z.object({
    payment_id: z.string().describe("The unique identifier of the payment"),
  }),
  handler: async (yunoClient: YunoClient, { payment_id }: { payment_id: string }) => {
    const payment = await yunoClient.payments.retrieve(payment_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `payment response: ${JSON.stringify(payment, null, 4)}`,
        },
      ],
    };
  },
};

export const paymentRetrieveByMerchantOrderIdTool: Tool = {
  method: "paymentRetrieveByMerchantOrderId",
  description: "Retrieve payments by merchant order ID in Yuno.",
  schema: z.object({
    merchant_order_id: z.string().describe("The unique identifier of the order for the payment (merchant_order_id)"),
  }),
  handler: async (yunoClient: YunoClient, { merchant_order_id }: { merchant_order_id: string }) => {
    const payments = await yunoClient.payments.retrieveByMerchantOrderId(merchant_order_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `payments response: ${JSON.stringify(payments, null, 4)}`,
        },
      ],
    };
  },
};

export const paymentRefundTool: Tool = {
  method: "paymentRefund",
  description: "Refund a payment in Yuno.",
  schema: z.object({
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds"),
  }),
  handler: async (yunoClient: YunoClient, { paymentId, transactionId, body, idempotency_key }: { paymentId: string, transactionId: string, body: PaymentRefundSchema, idempotency_key: string }) => {
    const idempotencyKey = idempotency_key || randomUUID();
    const refundResponse = await yunoClient.payments.refund(paymentId, transactionId, body, idempotencyKey);
    return {
      content: [
        {
          type: "text" as const,
          text: `refund response: ${JSON.stringify(refundResponse, null, 4)}`,
        },
      ],
    };
  },
};

export const paymentCancelOrRefundTool: Tool = {
  method: "paymentCancelOrRefund",
  description: "Cancel or refund a payment in Yuno.",
  schema: z.object({
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds"),
  }),
  handler: async (yunoClient: YunoClient, { paymentId, body, idempotency_key }: { paymentId: string, body: PaymentRefundSchema, idempotency_key: string }) => {
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

export const paymentCancelOrRefundWithTransactionTool: Tool = {
  method: "paymentCancelOrRefundWithTransaction",
  description: "Cancel or refund a payment with transaction in Yuno.",
  schema: z.object({
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds"),
  }),
  handler: async (yunoClient: YunoClient, { paymentId, transactionId, body, idempotency_key }: { paymentId: string, transactionId: string, body: PaymentRefundSchema, idempotency_key: string }) => {
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

export const paymentCancelTool: Tool = {
  method: "paymentCancel",
  description: "Cancel a payment in Yuno.",
  schema: paymentCancelSchema,
  handler: async (yunoClient: YunoClient, { paymentId, transactionId, body, idempotency_key }: { paymentId: string, transactionId: string, body: PaymentCancelSchema, idempotency_key: string }) => {
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

export const paymentAuthorizeTool: Tool = {
  method: "paymentAuthorize",
  description: "Authorize a payment in Yuno.",
  schema: paymentCreateSchema,
  handler: async (yunoClient: YunoClient, { payment, idempotency_key }: { payment: PaymentCreateSchema["payment"], idempotency_key: string }) => {
    const paymentWithAccount = {
      ...payment,
      account_id: payment.account_id || yunoClient.accountCode,
    };
    const idempotencyKey = idempotency_key || randomUUID();
    const paymentResponse = await yunoClient.payments.authorize(paymentWithAccount, idempotencyKey);
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

export const paymentCaptureAuthorizationTool: Tool = {
  method: "paymentCaptureAuthorization",
  description: "Capture an authorized payment in Yuno.",
  schema: paymentCaptureAuthorizationSchema,
  handler: async (yunoClient: YunoClient, { paymentId, transactionId, body, idempotency_key }: { paymentId: string, transactionId: string, body: PaymentCaptureAuthorizationSchema, idempotency_key: string }) => {
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

export const paymentTools: Tool[] = [
  paymentCreateTool,
  paymentRetrieveTool,
  paymentRetrieveByMerchantOrderIdTool,
  paymentRefundTool,
  paymentCancelOrRefundTool,
  paymentCancelOrRefundWithTransactionTool,
  paymentCancelTool,
  paymentAuthorizeTool,
  paymentCaptureAuthorizationTool,
];
