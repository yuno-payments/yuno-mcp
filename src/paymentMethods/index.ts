import z from "zod";
import { Tool } from "../shared/types";
import { paymentMethodEnrollSchema } from "./types";
import { YunoClient } from "../client";
import { randomUUID } from "crypto";

export const paymentMethodEnrollTool: Tool = {
  method: "paymentMethodEnroll",
  description: `Enroll or create payment method.`,
  schema: z.object({
    body: paymentMethodEnrollSchema,
    customerId: z.string().min(36).max(64).describe("The unique identifier of the customer (MIN 36, MAX 64)."),
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate payment methods"),
  }),
  handler: async (yunoClient: YunoClient, { customerId, body, idempotency_key }: any) => {
    const enrollmentWithAccount = {
      ...body,
      account_id: body.account_id || yunoClient.accountCode,
    };
    const idempotencyKey = idempotency_key || randomUUID();
    const response = await yunoClient.paymentMethods.enroll(customerId, enrollmentWithAccount, idempotencyKey);
    return {
      content: [
        {
          type: "text" as const,
          text: `enroll payment method response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
};

export const paymentMethodRetrieveTool: Tool = {
  method: "paymentMethodRetrieve",
  description: `Retrieve a enrolled payment method by customer and payment method id.`,
  schema: z.object({
    customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer (MIN 36, MAX 64)."),
    payment_method_id: z.string().min(36).max(64).describe("The unique identifier of the payment method (MIN 36, MAX 64)."),
  }),
  handler: async (yunoClient: YunoClient, { customer_id, payment_method_id }: any) => {
    const response = await yunoClient.paymentMethods.retrieve(customer_id, payment_method_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `retrieve enrolled payment method response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
};

export const paymentMethodRetrieveEnrolledTool: Tool = {
  method: "paymentMethodRetrieveEnrolled",
  description: `Retrieve all enrolled payment methods for a customer.`,
  schema: z.object({
    customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer (MIN 36, MAX 64)."),
  }),
  handler: async (yunoClient: YunoClient, { customer_id }: any) => {
    const response = await yunoClient.paymentMethods.retrieveEnrolled(customer_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `enrolled payment methods: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
};

export const paymentMethodUnenrollTool: Tool = {
  method: "paymentMethodUnenroll",
  description: `Unenroll a saved payment method for the user.`,
  schema: z.object({
    customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer (MIN 36, MAX 64)."),
    payment_method_id: z.string().min(36).max(64).describe("The unique identifier of the payment method (MIN 36, MAX 64)."),
  }),
  handler: async (yunoClient: YunoClient, { customer_id, payment_method_id }: any) => {
    const response = await yunoClient.paymentMethods.unenroll(customer_id, payment_method_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `unenroll payment method response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
};

export const paymentMethodTools: Tool[] = [
  paymentMethodEnrollTool,
  paymentMethodRetrieveTool,
  paymentMethodRetrieveEnrolledTool,
  paymentMethodUnenrollTool,
];
