import z from "zod";
import { recipientCreateSchema, recipientUpdateSchema, yunoRecipientOutputSchema } from "../../schemas";
import type { HandlerContext, Tool } from "../../types";
import type { Output } from "../../types";
import type { RecipientCreateSchema, RecipientUpdateSchema, YunoRecipient } from "./types";

export const recipientCreateTool = {
  method: "recipientCreate",
  description: "Create a recipient in Yuno.",
  annotations: { openWorldHint: true, readOnlyHint: false, title: "Create Recipient", destructiveHint: false, idempotentHint: false },
  schema: recipientCreateSchema,
  outputSchema: yunoRecipientOutputSchema,
  appliesDefaultAccountId: true,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async (data: RecipientCreateSchema): Promise<Output<TType, YunoRecipient>> => {
      const recipientWithAccount = {
        ...data,
        account_id: data.account_id || yunoClient.accountCode,
      };
      const { body: recipient, status, headers } = await yunoClient.recipients.create(recipientWithAccount);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(recipient, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoRecipient>;
      }

      return {
        content: [
          { type: "object" as const, object: recipient },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoRecipient>;
    },
} as const satisfies Tool;

export const recipientRetrieveTool = {
  method: "recipientRetrieve",
  description: "Retrieve a recipient in Yuno by its ID.",
  annotations: { openWorldHint: true, title: "Retrieve Recipient", readOnlyHint: true, destructiveHint: false },
  schema: z.object({
    recipient_id: z.string().describe("The unique identifier of the recipient to retrieve"),
    account_id: z.string().min(36).max(64).nullish().describe("Account ID of the recipient; defaults to the connection's account"),
  }),
  outputSchema: yunoRecipientOutputSchema,
  appliesDefaultAccountId: true,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      recipient_id: recipientId,
      account_id: accountId,
    }: {
      recipient_id: string;
      account_id?: string | null;
    }): Promise<Output<TType, YunoRecipient>> => {
      const { body: recipient, status, headers } = await yunoClient.recipients.retrieve(recipientId, accountId);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(recipient, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoRecipient>;
      }

      return {
        content: [
          { type: "object" as const, object: recipient },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoRecipient>;
    },
} as const satisfies Tool;

export const recipientUpdateTool = {
  method: "recipientUpdate",
  description: "Update a recipient in Yuno by its ID.",
  annotations: { openWorldHint: true, readOnlyHint: false, title: "Update Recipient", destructiveHint: false, idempotentHint: true },
  schema: recipientUpdateSchema,
  outputSchema: yunoRecipientOutputSchema,
  appliesDefaultAccountId: true,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ recipient_id: recipientId, account_id: accountId, ...updateFields }: RecipientUpdateSchema): Promise<Output<TType, YunoRecipient>> => {
      // account_id selects the recipient in the query string; it is not a field to update.
      const { body: recipient, status, headers } = await yunoClient.recipients.update(recipientId, updateFields, accountId);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(recipient, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoRecipient>;
      }

      return {
        content: [
          { type: "object" as const, object: recipient },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoRecipient>;
    },
} as const satisfies Tool;

export const recipientDeleteTool = {
  method: "recipientDelete",
  description: "Delete a recipient in Yuno by its ID.",
  annotations: { openWorldHint: true, readOnlyHint: false, title: "Delete Recipient", destructiveHint: true, idempotentHint: true },
  schema: z.object({
    recipient_id: z.string().describe("The unique identifier of the recipient to delete"),
    account_id: z.string().min(36).max(64).nullish().describe("Account ID of the recipient; defaults to the connection's account"),
  }),
  outputSchema: yunoRecipientOutputSchema,
  appliesDefaultAccountId: true,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({
      recipient_id: recipientId,
      account_id: accountId,
    }: {
      recipient_id: string;
      account_id?: string | null;
    }): Promise<Output<TType, YunoRecipient>> => {
      const { body, status, headers } = await yunoClient.recipients.delete(recipientId, accountId);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(body, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoRecipient>;
      }

      return {
        content: [
          { type: "object" as const, object: body },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoRecipient>;
    },
} as const satisfies Tool;

export const recipientTools = [recipientCreateTool, recipientRetrieveTool, recipientUpdateTool, recipientDeleteTool] as const satisfies Tool[];
