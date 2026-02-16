import z from "zod";
import { subscriptionCreateSchema, subscriptionUpdateSchema } from "../../schemas";
import { YunoClient } from "../../client";
import type { HandlerContext, Output, Tool } from "../../types";
import type { SubscriptionCreateSchema, SubscriptionUpdateSchema, YunoSubscription } from "./types";

export const subscriptionCreateTool = {
  method: "subscriptionCreate",
  description: "Create a subscription in Yuno.",
  schema: subscriptionCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async (data: SubscriptionCreateSchema): Promise<Output<TType, YunoSubscription>> => {
      const subscriptionWithAccount = {
        ...data,
        account_id: data.account_id || yunoClient.accountCode,
      };
      const { body: subscription, status, headers } = await yunoClient.subscriptions.create(subscriptionWithAccount);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(subscription, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoSubscription>;
      }

      return {
        content: [
          { type: "object" as const, object: subscription },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoSubscription>;
    },
} as const satisfies Tool;

export const subscriptionRetrieveTool = {
  method: "subscriptionRetrieve",
  description: "Retrieve a subscription in Yuno by its ID.",
  schema: z.object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to retrieve"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ subscriptionId }: { subscriptionId: string }): Promise<Output<TType, YunoSubscription>> => {
      const { body: subscription, status, headers } = await yunoClient.subscriptions.retrieve(subscriptionId);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(subscription, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoSubscription>;
      }

      return {
        content: [
          { type: "object" as const, object: subscription },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoSubscription>;
    },
} as const satisfies Tool;

export const subscriptionPauseTool = {
  method: "subscriptionPause",
  description: "Pause a subscription in Yuno by its ID.",
  schema: z.object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to pause"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ subscriptionId }: { subscriptionId: string }): Promise<Output<TType, YunoSubscription>> => {
      const { body, status, headers } = await yunoClient.subscriptions.pause(subscriptionId);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(body, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoSubscription>;
      }

      return {
        content: [
          { type: "object" as const, object: body },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoSubscription>;
    },
} as const satisfies Tool;

export const subscriptionResumeTool = {
  method: "subscriptionResume",
  description: "Resume a subscription in Yuno by its ID.",
  schema: z.object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to resume"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ subscriptionId }: { subscriptionId: string }): Promise<Output<TType, YunoSubscription>> => {
      const { body, status, headers } = await yunoClient.subscriptions.resume(subscriptionId);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(body, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoSubscription>;
      }

      return {
        content: [
          { type: "object" as const, object: body },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoSubscription>;
    },
} as const satisfies Tool;

export const subscriptionUpdateTool = {
  method: "subscriptionUpdate",
  description: "Update a subscription in Yuno by its ID.",
  schema: subscriptionUpdateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ subscriptionId, ...updateFields }: SubscriptionUpdateSchema): Promise<Output<TType, YunoSubscription>> => {
      const { body: subscription, status, headers } = await yunoClient.subscriptions.update(subscriptionId, updateFields);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(subscription, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoSubscription>;
      }

      return {
        content: [
          { type: "object" as const, object: subscription },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoSubscription>;
    },
} as const satisfies Tool;

export const subscriptionCancelTool = {
  method: "subscriptionCancel",
  description: "Cancel a subscription in Yuno by its ID.",
  schema: z.object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to cancel"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ subscriptionId }: { subscriptionId: string }): Promise<Output<TType, YunoSubscription>> => {
      const { body, status, headers } = await yunoClient.subscriptions.cancel(subscriptionId);

      if (type === "text") {
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(body, null, 4) },
            { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
          ],
        } as Output<TType, YunoSubscription>;
      }

      return {
        content: [
          { type: "object" as const, object: body },
          { type: "text" as const, text: `Response Headers (HTTP ${status}):\n${JSON.stringify(headers, null, 4)}` },
        ],
      } as Output<TType, YunoSubscription>;
    },
} as const satisfies Tool;

export const subscriptionTools = [
  subscriptionCreateTool,
  subscriptionRetrieveTool,
  subscriptionPauseTool,
  subscriptionResumeTool,
  subscriptionUpdateTool,
  subscriptionCancelTool,
] as const satisfies Tool[];
