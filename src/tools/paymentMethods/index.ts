import z from "zod";
import {
  paymentMethodEnrollSchema,
  yunoPaymentMethodOutputSchema,
  yunoPaymentMethodListOutputSchema,
} from "../../schemas";
import { randomUUID } from "node:crypto";
import type { HandlerContext, Output, Tool } from "../../types";
import type { PaymentMethodEnrollSchema, YunoPaymentMethod } from "./types";

export const paymentMethodEnrollTool = {
  method: "paymentMethodEnroll",
  description: `Enroll or create payment method.`,
  annotations: { openWorldHint: true, readOnlyHint: false, title: "Enroll Payment Method", destructiveHint: false, idempotentHint: false },
  schema: z.object({
    body: paymentMethodEnrollSchema,
    customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer (MIN 36, MAX 64)."),
    idempotency_key: z.uuid().optional().describe("Unique key to prevent duplicate payment methods. Must be a UUID (e.g. 550e8400-e29b-41d4-a716-446655440000); omit it and one is generated."),
  }),
  outputSchema: yunoPaymentMethodOutputSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      customer_id: customerId,
      body,
      idempotency_key: idempotencyKey,
    }: {
      customer_id: string;
      body: PaymentMethodEnrollSchema;
      idempotency_key: string;
    }): Promise<Output<TType, YunoPaymentMethod>> => {
      const enrollmentWithAccount = {
        ...body,
        account_id: body.account_id || yunoClient.accountCode,
      };
      const finalIdempotencyKey = idempotencyKey || randomUUID();
      const { body: responseBody, status, headers } = await yunoClient.paymentMethods.enroll(customerId, enrollmentWithAccount, finalIdempotencyKey);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(responseBody, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${String(status)}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoPaymentMethod>;
      }

      return {
        content: [
          { type: "object" as const, object: responseBody },
          { type: "text" as const, text: `Response Headers (HTTP ${String(status)}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoPaymentMethod>;
    },
} as const satisfies Tool;

export const paymentMethodRetrieveTool = {
  method: "paymentMethodRetrieve",
  description: `Retrieve an enrolled payment method by customer and payment method ID.`,
  annotations: { openWorldHint: true, title: "Retrieve Payment Method", readOnlyHint: true, destructiveHint: false },
  schema: z.object({
    customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer (MIN 36, MAX 64)."),
    payment_method_id: z
      .string()
      .min(36)
      .max(64)
      .describe("The payment method's vaulted_token, as returned by paymentMethodEnroll and paymentMethodRetrieveEnrolled (MIN 36, MAX 64)."),
  }),
  outputSchema: yunoPaymentMethodOutputSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ customer_id, payment_method_id }: { customer_id: string; payment_method_id: string }): Promise<Output<TType, YunoPaymentMethod>> => {
      const { body, status, headers } = await yunoClient.paymentMethods.retrieve(customer_id, payment_method_id);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(body, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${String(status)}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoPaymentMethod>;
      }

      return {
        content: [
          { type: "object" as const, object: body },
          { type: "text" as const, text: `Response Headers (HTTP ${String(status)}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoPaymentMethod>;
    },
} as const satisfies Tool;

export const paymentMethodRetrieveEnrolledTool = {
  method: "paymentMethodRetrieveEnrolled",
  description: `Retrieve all enrolled payment methods for a customer.`,
  annotations: { openWorldHint: true, title: "Retrieve Enrolled Payment Methods", readOnlyHint: true, destructiveHint: false },
  schema: z.object({
    customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer (MIN 36, MAX 64)."),
  }),
  outputSchema: yunoPaymentMethodListOutputSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ customer_id }: { customer_id: string }): Promise<Output<TType, { payment_methods?: YunoPaymentMethod[] | null }>> => {
      const { body, status, headers } = await yunoClient.paymentMethods.retrieveEnrolled(customer_id);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(body, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${String(status)}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, { payment_methods?: YunoPaymentMethod[] | null }>;
      }

      return {
        content: [
          { type: "object" as const, object: body },
          { type: "text" as const, text: `Response Headers (HTTP ${String(status)}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, { payment_methods?: YunoPaymentMethod[] | null }>;
    },
} as const satisfies Tool;

export const paymentMethodUnenrollTool = {
  method: "paymentMethodUnenroll",
  description: `Unenroll a saved payment method for the user.`,
  annotations: { openWorldHint: true, readOnlyHint: false, title: "Unenroll Payment Method", destructiveHint: true, idempotentHint: true },
  schema: z.object({
    customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer (MIN 36, MAX 64)."),
    payment_method_id: z
      .string()
      .min(36)
      .max(64)
      .describe("The payment method's vaulted_token, as returned by paymentMethodEnroll and paymentMethodRetrieveEnrolled (MIN 36, MAX 64)."),
  }),
  outputSchema: yunoPaymentMethodOutputSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ customer_id, payment_method_id }: { customer_id: string; payment_method_id: string }): Promise<Output<TType, YunoPaymentMethod>> => {
      const { body, status, headers } = await yunoClient.paymentMethods.unenroll(customer_id, payment_method_id);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(body, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${String(status)}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoPaymentMethod>;
      }

      return {
        content: [
          { type: "object" as const, object: body },
          { type: "text" as const, text: `Response Headers (HTTP ${String(status)}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoPaymentMethod>;
    },
} as const satisfies Tool;

export const paymentMethodTools = [
  paymentMethodEnrollTool,
  paymentMethodRetrieveTool,
  paymentMethodRetrieveEnrolledTool,
  paymentMethodUnenrollTool,
] as const satisfies Tool[];
