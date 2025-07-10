import z from "zod";
import { YunoClient } from "../client";
import { Tool } from "../shared/types";
import { checkoutSessionCreateSchema, YunoCheckoutSession, ottCreateSchema, YunoOttRequest } from "./types";

export const checkoutSessionCreateTool: Tool = {
  method: "checkoutSessionCreate",
  description: "Create a new checkout session in Yuno.",
  schema: checkoutSessionCreateSchema,
  handler: async (yunoClient: YunoClient, data: YunoCheckoutSession) => {
    const checkoutSessionWithAccount = {
      ...data,
      account_id: data.account_id || yunoClient.accountCode,
    };
    const checkoutSession = await yunoClient.checkoutSessions.create(checkoutSessionWithAccount);
    return {
      content: [
        {
          type: "text" as const,
          text: `checkout session response: ${JSON.stringify(checkoutSession, null, 4)}`,
        },
      ],
    };
  },
};

export const checkoutSessionRetrievePaymentMethodsTool: Tool = {
  method: "checkoutSessionRetrievePaymentMethods",
  description: "Retrieve payment methods for a checkout session in Yuno.",
  schema: z.object({
    sessionId: z.string().describe("The unique identifier of the checkout session"),
  }),
  handler: async (yunoClient: YunoClient, { sessionId }: any) => {
    const paymentMethodsResponse = await yunoClient.checkoutSessions.retrievePaymentMethods(sessionId);
    return {
      content: [
        {
          type: "text" as const,
          text: `payment methods response: ${JSON.stringify(paymentMethodsResponse, null, 4)}`,
        },
      ],
    };
  },
};

export const checkoutSessionCreateOttTool: Tool = {
  method: "checkoutSession.createOtt",
  description: "Generate a One Time Token (OTT) for a checkout session in Yuno.",
  schema: ottCreateSchema,
  handler: async (yunoClient: YunoClient, data: any) => {
    const { sessionId, ...ottRequest } = data;
    const ottResponse = await yunoClient.checkoutSessions.createOtt(sessionId, ottRequest as YunoOttRequest);
    return {
      content: [
        {
          type: "text" as const,
          text: `OTT response: ${JSON.stringify(ottResponse, null, 4)}`,
        },
      ],
    };
  },
};

export const checkoutTools: Tool[] = [checkoutSessionCreateTool, checkoutSessionRetrievePaymentMethodsTool, checkoutSessionCreateOttTool];
