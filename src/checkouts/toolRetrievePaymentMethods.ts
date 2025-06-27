import { z } from "zod";
import { Tool } from "../shared/types";
import { YunoClient } from "../client";

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