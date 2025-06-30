import z from "zod";
import { YunoClient } from "../client";
import { Tool } from "../shared/types/common";
import { installmentPlanCreateSchema, installmentPlanUpdateSchema } from "./types";

export const installmentPlanCreateTool: Tool = {
  method: "installmentPlans.create",
  description: "Create an installment plan in Yuno.",
  schema: installmentPlanCreateSchema,
  handler: async (yunoClient: YunoClient, data: any, _extra?: any) => {
    const planWithAccount = { ...data, account_id: data.account_id || yunoClient.accountCode };
    const plan = await yunoClient.installmentPlans.create(planWithAccount);
    return {
      content: [
        {
          type: "text",
          text: `installment plan response: ${JSON.stringify(plan, null, 4)}`,
        },
      ],
    };
  },
}; 

export const installmentPlanRetrieveTool: Tool = {
  method: "installmentPlans.retrieve",
  description: "Retrieve an installment plan in Yuno by its ID.",
  schema: z.object({
    planId: z.string().describe("The unique identifier of the installment plan to retrieve"),
  }),
  handler: async (yunoClient: YunoClient, { planId }, _extra?: any) => {
    const plan = await yunoClient.installmentPlans.retrieve(planId);
    return {
      content: [
        {
          type: "text",
          text: `installment plan response: ${JSON.stringify(plan, null, 4)}`,
        },
      ],
    };
  },
}; 

export const installmentPlanRetrieveAllTool: Tool = {
  method: "installmentPlans.retrieveAll",
  description: "Retrieve all installment plans in Yuno for an account.",
  schema: z.object({
    accountId: z.string().describe("The account_id to retrieve all installment plans for"),
  }),
  handler: async (yunoClient: YunoClient, { accountId }, _extra?: any) => {
    const plans = await yunoClient.installmentPlans.retrieveAll(accountId);
    return {
      content: [
        {
          type: "text",
          text: `installment plans response: ${JSON.stringify(plans, null, 4)}`,
        },
      ],
    };
  },
}; 

export const installmentPlanUpdateTool: Tool = {
  method: "installmentPlans.update",
  description: "Update an installment plan in Yuno by its ID.",
  schema: installmentPlanUpdateSchema,
  handler: async (yunoClient: YunoClient, { planId, ...updateFields }: any, _extra?: any) => {
    const plan = await yunoClient.installmentPlans.update(planId, updateFields);
    return {
      content: [
        {
          type: "text",
          text: `installment plan response: ${JSON.stringify(plan, null, 4)}`,
        },
      ],
    };
  },
}; 

export const installmentPlanDeleteTool: Tool = {
  method: "installmentPlans.delete",
  description: "Delete an installment plan in Yuno by its ID.",
  schema: z.object({
    planId: z.string().describe("The unique identifier of the installment plan to delete"),
  }),
  handler: async (yunoClient: YunoClient, { planId }, _extra?: any) => {
    const response = await yunoClient.installmentPlans.delete(planId);
    return {
      content: [
        {
          type: "text",
          text: `delete installment plan response: ${JSON.stringify(response, null, 4)}`,
        },
      ],
    };
  },
}; 

export const installmentPlanTools: Tool[] = [
  installmentPlanCreateTool,
  installmentPlanRetrieveTool,
  installmentPlanRetrieveAllTool,
  installmentPlanUpdateTool,
  installmentPlanDeleteTool,
]; 