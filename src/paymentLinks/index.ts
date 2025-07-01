import z from "zod";
import { Tool } from "../shared/types/common";
import { paymentLinkCancelSchema, paymentLinkCreateSchema } from "./types";

export const paymentLinkCreateTool: Tool = {
  method: "paymentLinks.create",
  description: "Create a payment link in Yuno.",
  schema: paymentLinkCreateSchema,
  handler: async (yunoClient, data) => {
    const paymentLinkWithAccount = { ...data, account_id: data.account_id || yunoClient.accountCode };
    const paymentLink = await yunoClient.paymentLinks.create(paymentLinkWithAccount);
    return { 
      content: [
        { 
          type: "text", 
          text: `payment link response: ${JSON.stringify(paymentLink, null, 4)}`,
        },
      ],
    };
  },
}; 

export const paymentLinkRetrieveTool: Tool = {
  method: "paymentLinks.retrieve",
  description: "Retrieve a payment link in Yuno by its ID.",
  schema: z.object({
    paymentLinkId: z.string().describe("The unique identifier of the payment link to retrieve"),
  }),
  handler: async (yunoClient, { paymentLinkId }) => {
    const paymentLink = await yunoClient.paymentLinks.retrieve(paymentLinkId);
    return { 
      content: [
        { 
          type: "text", 
          text: `payment link response: ${JSON.stringify(paymentLink, null, 4)}`,
        },
      ],
    };
  },
}; 

export const paymentLinkCancelTool: Tool = {
  method: "paymentLinks.cancel",
  description: "Cancel a payment link in Yuno by its ID.",
  schema: z.object({
    paymentLinkId: z.string().describe("The unique identifier of the payment link to cancel"),
    body: paymentLinkCancelSchema
  }),
  handler: async (yunoClient, { paymentLinkId, body }) => {
    const cancelResponse = await yunoClient.paymentLinks.cancel(paymentLinkId, body);
    return { 
      content: [
        { 
          type: "text", 
          text: `cancel payment link response: ${JSON.stringify(cancelResponse, null, 4)}`,
        },
      ],
    };
  },
}; 

export const paymentLinkTools: Tool[] = [
  paymentLinkCreateTool,
  paymentLinkRetrieveTool,
  paymentLinkCancelTool,
]; 