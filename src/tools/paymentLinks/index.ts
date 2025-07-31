import z from "zod";
import { paymentLinkCreateSchema, paymentLinkCancelSchema } from "../../schemas";
import type { HandlerContext, Output, Tool } from "../../types";
import type { PaymentLinkCancelSchema, PaymentLinkCreateSchema, YunoPaymentLink } from "./types";

export const paymentLinkCreateTool = {
  method: "paymentLinkCreate",
  description: "Create a payment link in Yuno.",
  schema: paymentLinkCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, apiKeys, type }: HandlerContext<TType>) =>
    async (data: PaymentLinkCreateSchema): Promise<Output<TType, YunoPaymentLink>> => {
      const paymentLinkWithAccount = {
        ...data,
        account_id: data.account_id || apiKeys.accountCode,
      };
      const paymentLink = await yunoClient.paymentLinks.create(paymentLinkWithAccount);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(paymentLink, null, 4),
            },
          ],
        } as Output<TType, YunoPaymentLink>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: paymentLink,
          },
        ],
      } as Output<TType, YunoPaymentLink>;
    },
} as const satisfies Tool;

export const paymentLinkRetrieveTool = {
  method: "paymentLinkRetrieve",
  description: "Retrieve a payment link in Yuno by its ID.",
  schema: z.object({
    paymentLinkId: z.string().describe("The unique identifier of the payment link to retrieve"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ paymentLinkId }: { paymentLinkId: string }): Promise<Output<TType, YunoPaymentLink>> => {
      const paymentLink = await yunoClient.paymentLinks.retrieve(paymentLinkId);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(paymentLink, null, 4),
            },
          ],
        } as Output<TType, YunoPaymentLink>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: paymentLink,
          },
        ],
      } as Output<TType, YunoPaymentLink>;
    },
} as const satisfies Tool;

export const paymentLinkCancelTool = {
  method: "paymentLinkCancel",
  description: "Cancel a payment link in Yuno by its ID.",
  schema: z.object({
    paymentLinkId: z.string().describe("The unique identifier of the payment link to cancel"),
    body: paymentLinkCancelSchema,
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ paymentLinkId, body }: { paymentLinkId: string; body: PaymentLinkCancelSchema }): Promise<Output<TType, YunoPaymentLink>> => {
      const cancelResponse = await yunoClient.paymentLinks.cancel(paymentLinkId, body);

      if (type === "text") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cancelResponse, null, 4),
            },
          ],
        } as Output<TType, YunoPaymentLink>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: cancelResponse,
          },
        ],
      } as Output<TType, YunoPaymentLink>;
    },
} as const satisfies Tool;

export const paymentLinkTools = [paymentLinkCreateTool, paymentLinkRetrieveTool, paymentLinkCancelTool] as const satisfies Tool[];
