import z from "zod";
import { YunoClient } from "../client";
import { Tool } from "../shared/types";
import { checkoutSessionCreateSchema, YunoCheckoutSession } from "./types";

export const checkoutSessionCreateTool: Tool = {
  method: "checkoutSession.create",
  description: "Create a new checkout session in Yuno.",
  schema: checkoutSessionCreateSchema,
  handler: async (yunoClient: YunoClient, data: YunoCheckoutSession, _extra?: any) => {
    const checkoutSession = await yunoClient.checkoutSessions.create(data);
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
  method: "checkoutSession.retrievePaymentMethods",
  description: "Retrieve payment methods for a checkout session in Yuno.",
  schema: z.object({
    sessionId: z.string().describe("The unique identifier of the checkout session"),
  }),
  handler: async (yunoClient: YunoClient, { sessionId }: any, _extra?: any) => {
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

export const checkoutTools: Tool[] = [
  checkoutSessionCreateTool,
  checkoutSessionRetrievePaymentMethodsTool,
]; 
