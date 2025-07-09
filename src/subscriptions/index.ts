import z from "zod";
import { YunoClient } from "../client";
import { Tool } from "../shared/types/common";
import { subscriptionCreateSchema, subscriptionUpdateSchema } from "./types";

export const subscriptionCreateTool: Tool = {
  method: "subscriptionCreate",
  description: "Create a subscription in Yuno.",
  schema: subscriptionCreateSchema,
  handler: async (yunoClient: YunoClient, data: any) => {
    const subscriptionWithAccount = {
      ...data,
      account_id: data.account_id || yunoClient.accountCode,
    };
    const subscription = await yunoClient.subscriptions.create(subscriptionWithAccount);
    return {
      content: [
        {
          type: "text",
          text: `subscription response: ${JSON.stringify(subscription, null, 4)}`,
        },
      ],
    };
  },
};

export const subscriptionRetrieveTool: Tool = {
  method: "subscriptionRetrieve",
  description: "Retrieve a subscription in Yuno by its ID.",
  schema: z.object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to retrieve"),
  }),
  handler: async (yunoClient, { subscriptionId }) => {
    const subscription = await yunoClient.subscriptions.retrieve(subscriptionId);
    return {
      content: [
        {
          type: "text",
          text: `subscription response: ${JSON.stringify(subscription, null, 4)}`,
        },
      ],
    };
  },
};

export const subscriptionPauseTool: Tool = {
  method: "subscriptionPause",
  description: "Pause a subscription in Yuno by its ID.",
  schema: z.object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to pause"),
  }),
  handler: async (yunoClient: YunoClient, { subscriptionId }) => {
    const response = await yunoClient.subscriptions.pause(subscriptionId);
    return {
      content: [
        {
          type: "text",
          text: `pause subscription response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
};

export const subscriptionResumeTool: Tool = {
  method: "subscriptionResume",
  description: "Resume a subscription in Yuno by its ID.",
  schema: z.object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to resume"),
  }),
  handler: async (yunoClient: YunoClient, { subscriptionId }) => {
    const response = await yunoClient.subscriptions.resume(subscriptionId);
    return {
      content: [
        {
          type: "text",
          text: `resume subscription response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
};

export const subscriptionUpdateTool: Tool = {
  method: "subscriptionUpdate",
  description: "Update a subscription in Yuno by its ID.",
  schema: subscriptionUpdateSchema,
  handler: async (yunoClient, { subscriptionId, ...updateFields }) => {
    const subscription = await yunoClient.subscriptions.update(subscriptionId, updateFields);
    return {
      content: [
        {
          type: "text",
          text: `subscription response: ${JSON.stringify(subscription, null, 4)}`,
        },
      ],
    };
  },
};

export const subscriptionCancelTool: Tool = {
  method: "subscriptionCancel",
  description: "Cancel a subscription in Yuno by its ID.",
  schema: z.object({
    subscriptionId: z.string().describe("The unique identifier of the subscription to cancel"),
  }),
  handler: async (yunoClient: YunoClient, { subscriptionId }) => {
    const response = await yunoClient.subscriptions.cancel(subscriptionId);
    return {
      content: [
        {
          type: "text",
          text: `cancel subscription response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
};

export const subscriptionTools: Tool[] = [
  subscriptionCreateTool,
  subscriptionRetrieveTool,
  subscriptionPauseTool,
  subscriptionResumeTool,
  subscriptionUpdateTool,
  subscriptionCancelTool,
];
