import z from "zod";
import { recipientCreateSchema, recipientUpdateSchema } from "../../schemas";
import type { HandlerContext, Tool } from "../../types";
import type { Output } from "../../types";
import type { RecipientCreateSchema, RecipientUpdateSchema, YunoRecipient } from "./types";

export const recipientCreateTool = {
  method: "recipientCreate",
  description: "Create a recipient in Yuno.",
  schema: recipientCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, apiKeys, type }: HandlerContext<TType>) =>
    async (data: RecipientCreateSchema): Promise<Output<TType, YunoRecipient>> => {
      const recipientWithAccount = {
        ...data,
        account_id: data.account_id || apiKeys.accountCode,
      };
      const recipient = await yunoClient.recipients.create(recipientWithAccount);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(recipient, null, 4),
            },
          ],
        } as Output<TType, YunoRecipient>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: recipient,
          },
        ],
      } as Output<TType, YunoRecipient>;
    },
} as const satisfies Tool;

export const recipientRetrieveTool = {
  method: "recipientRetrieve",
  description: "Retrieve a recipient in Yuno by its ID.",
  schema: z.object({
    recipientId: z.string().describe("The unique identifier of the recipient to retrieve"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ recipientId }: { recipientId: string }): Promise<Output<TType, YunoRecipient>> => {
      const recipient = await yunoClient.recipients.retrieve(recipientId);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(recipient, null, 4),
            },
          ],
        } as Output<TType, YunoRecipient>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: recipient,
          },
        ],
      } as Output<TType, YunoRecipient>;
    },
} as const satisfies Tool;

export const recipientUpdateTool = {
  method: "recipientUpdate",
  description: "Update a recipient in Yuno by its ID.",
  schema: recipientUpdateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ recipientId, ...updateFields }: RecipientUpdateSchema): Promise<Output<TType, YunoRecipient>> => {
      const recipient = await yunoClient.recipients.update(recipientId, updateFields);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(recipient, null, 4),
            },
          ],
        } as Output<TType, YunoRecipient>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: recipient,
          },
        ],
      } as Output<TType, YunoRecipient>;
    },
} as const satisfies Tool;

export const recipientDeleteTool = {
  method: "recipientDelete",
  description: "Delete a recipient in Yuno by its ID.",
  schema: z.object({
    recipientId: z.string().describe("The unique identifier of the recipient to delete"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ recipientId }: { recipientId: string }): Promise<Output<TType, YunoRecipient>> => {
      const response = await yunoClient.recipients.delete(recipientId);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response, null, 4),
            },
          ],
        } as Output<TType, YunoRecipient>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: response,
          },
        ],
      } as Output<TType, YunoRecipient>;
    },
} as const satisfies Tool;

export const recipientTools = [recipientCreateTool, recipientRetrieveTool, recipientUpdateTool, recipientDeleteTool] as const satisfies Tool[];
