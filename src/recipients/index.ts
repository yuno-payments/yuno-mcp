import z from "zod";
import { YunoClient } from "../client";
import { Tool } from "../shared/types/common";
import { RecipientCreateSchema, recipientCreateSchema, RecipientUpdateSchema, recipientUpdateSchema } from "./types";

export const recipientCreateTool: Tool = {
  method: "recipientCreate",
  description: "Create a recipient in Yuno.",
  schema: recipientCreateSchema,
  handler: async (yunoClient: YunoClient, data: RecipientCreateSchema) => {
    const recipientWithAccount = {
      ...data,
      account_id: data.account_id || yunoClient.accountCode,
    };
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
  method: "recipientRetrieve",
  description: "Retrieve a recipient in Yuno by its ID.",
  schema: z.object({
    recipientId: z.string().describe("The unique identifier of the recipient to retrieve"),
  }),
  handler: async (yunoClient: YunoClient, { recipientId }: { recipientId: string }) => {
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
  method: "recipientUpdate",
  description: "Update a recipient in Yuno by its ID.",
  schema: recipientUpdateSchema,
  handler: async (yunoClient: YunoClient, { recipientId, ...updateFields }: RecipientUpdateSchema) => {
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
  method: "recipientDelete",
  description: "Delete a recipient in Yuno by its ID.",
  schema: z.object({
    recipientId: z.string().describe("The unique identifier of the recipient to delete"),
  }),
  handler: async (yunoClient: YunoClient, { recipientId }: { recipientId: string }) => {
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

export const recipientTools: Tool[] = [recipientCreateTool, recipientRetrieveTool, recipientUpdateTool, recipientDeleteTool];
