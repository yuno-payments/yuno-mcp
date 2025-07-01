import z from "zod";
import { YunoClient } from "../client";
import { Tool } from "../shared/types/common";
import { recipientCreateSchema, recipientUpdateSchema } from "./types";

export const recipientCreateTool: Tool = {
  method: "recipients.create",
  description: "Create a recipient in Yuno.",
  schema: recipientCreateSchema,
  handler: async (yunoClient: YunoClient, data: any, _extra?: any) => {
    const recipientWithAccount = { ...data, account_id: data.account_id || yunoClient.accountCode };
    const recipient = await yunoClient.recipients.create(recipientWithAccount);
    return {
      content: [
        {
          type: "text",
          text: `recipient response: ${JSON.stringify(recipient, null, 4)}`,
        },
      ],
    };
  },
}; 

export const recipientRetrieveTool: Tool = {
  method: "recipients.retrieve",
  description: "Retrieve a recipient in Yuno by its ID.",
  schema: z.object({
    recipientId: z.string().describe("The unique identifier of the recipient to retrieve"),
  }),
  handler: async (yunoClient: YunoClient, { recipientId }, _extra?: any) => {
    const recipient = await yunoClient.recipients.retrieve(recipientId);
    return {
      content: [
        {
          type: "text",
          text: `recipient response: ${JSON.stringify(recipient, null, 4)}`,
        },
      ],
    };
  },
}; 

export const recipientUpdateTool: Tool = {
  method: "recipients.update",
  description: "Update a recipient in Yuno by its ID.",
  schema: recipientUpdateSchema,
  handler: async (yunoClient: YunoClient, { recipientId, ...updateFields }: any , _extra?: any) => {
    const recipient = await yunoClient.recipients.update(recipientId, updateFields);
    return {
      content: [
        {
          type: "text",
          text: `recipient response: ${JSON.stringify(recipient, null, 4)}`,
        },
      ],
    };
  },
}; 

export const recipientDeleteTool: Tool = {
  method: "recipients.delete",
  description: "Delete a recipient in Yuno by its ID.",
  schema: z.object({
    recipientId: z.string().describe("The unique identifier of the recipient to delete"),
  }),
  handler: async (yunoClient: YunoClient, { recipientId }, _extra?: any) => {
    const response = await yunoClient.recipients.delete(recipientId);
    return {
      content: [
        {
          type: "text",
          text: `delete recipient response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
}; 

export const recipientTools: Tool[] = [
  recipientCreateTool,
  recipientRetrieveTool,
  recipientUpdateTool,
  recipientDeleteTool,
]; 