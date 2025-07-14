import z from "zod";
import { Tool } from "../shared/types/common";
import { PaymentLinkCancelSchema, paymentLinkCancelSchema, PaymentLinkCreateSchema, paymentLinkCreateSchema } from "./types";
import { YunoClient } from "../client";

export const paymentLinkCreateTool: Tool = {
  method: "paymentLinkCreate",
  description: "Create a payment link in Yuno.",
  schema: paymentLinkCreateSchema,
  handler: async (yunoClient: YunoClient, data: PaymentLinkCreateSchema) => {
    const paymentLinkWithAccount = {
      ...data,
      account_id: data.account_id || yunoClient.accountCode,
    };
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
  method: "paymentLinkRetrieve",
  description: "Retrieve a payment link in Yuno by its ID.",
  schema: z.object({
    paymentLinkId: z.string().describe("The unique identifier of the payment link to retrieve"),
  }),
  handler: async (yunoClient: YunoClient, { paymentLinkId }: { paymentLinkId: string }) => {
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
  method: "paymentLinkCancel",
  description: "Cancel a payment link in Yuno by its ID.",
  schema: z.object({
    paymentLinkId: z.string().describe("The unique identifier of the payment link to cancel"),
    body: paymentLinkCancelSchema,
  }),
  handler: async (yunoClient: YunoClient, { paymentLinkId, body }: { paymentLinkId: string; body: PaymentLinkCancelSchema }) => {
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

export const paymentLinkTools: Tool[] = [paymentLinkCreateTool, paymentLinkRetrieveTool, paymentLinkCancelTool];
