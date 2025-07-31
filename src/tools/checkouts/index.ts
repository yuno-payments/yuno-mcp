import z from "zod";
import { checkoutSessionCreateSchema, ottCreateSchema } from "../../schemas";
import type { HandlerContext, Output, Tool } from "../../types";
import type { YunoCheckoutPaymentMethodsResponse, YunoCheckoutSession, YunoOttCreateSchema, YunoOttRequest, YunoOttResponse } from "./types";

export const checkoutSessionCreateTool = {
  method: "checkoutSessionCreate",
  description: "Create a new checkout session in Yuno.",
  schema: checkoutSessionCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, apiKeys, type }: HandlerContext<TType>) =>
    async (data: YunoCheckoutSession): Promise<Output<TType, YunoCheckoutSession>> => {
      const checkoutSessionWithAccount = {
        ...data,
        account_id: data.account_id || apiKeys.accountCode,
      };
      const checkoutSession = await yunoClient.checkoutSessions.create(checkoutSessionWithAccount);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(checkoutSession, null, 4),
            },
          ],
        } as Output<TType, YunoCheckoutSession>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: checkoutSession,
          },
        ],
      } as Output<TType, YunoCheckoutSession>;
    },
} as const satisfies Tool;

export const checkoutSessionRetrievePaymentMethodsTool = {
  method: "checkoutSessionRetrievePaymentMethods",
  description: "Retrieve payment methods for a checkout session in Yuno.",
  schema: z.object({
    sessionId: z.string().describe("The unique identifier of the checkout session"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ sessionId }: { sessionId: string }): Promise<Output<TType, YunoCheckoutPaymentMethodsResponse>> => {
      const paymentMethodsResponse = await yunoClient.checkoutSessions.retrievePaymentMethods(sessionId);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(paymentMethodsResponse, null, 4),
            },
          ],
        } as Output<TType>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: paymentMethodsResponse,
          },
        ],
      } as Output<TType, YunoCheckoutPaymentMethodsResponse>;
    },
} as const satisfies Tool;

export const checkoutSessionCreateOttTool = {
  method: "checkoutSessionCreateOtt",
  description: "Generate a One Time Token (OTT) for a checkout session in Yuno.",
  schema: ottCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async (data: YunoOttCreateSchema): Promise<Output<TType, YunoOttResponse>> => {
      const { sessionId, ...ottRequest } = data;
      const ottResponse = await yunoClient.checkoutSessions.createOtt(sessionId, ottRequest as YunoOttRequest);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(ottResponse, null, 4),
            },
          ],
        } as Output<TType, YunoOttResponse>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: ottResponse,
          },
        ],
      } as Output<TType, YunoOttResponse>;
    },
} as const satisfies Tool;

export const checkoutTools = [
  checkoutSessionCreateTool,
  checkoutSessionRetrievePaymentMethodsTool,
  checkoutSessionCreateOttTool,
] as const satisfies Tool[];
