import z from "zod";
import { installmentPlanCreateSchema, installmentPlanUpdateSchema } from "../../schemas";
import type { HandlerContext, Output, Tool } from "../../types";
import type { InstallmentPlanCreateSchema, InstallmentPlanUpdateSchema, YunoInstallmentPlan } from "./types";

export const installmentPlanCreateTool = {
  method: "installmentPlanCreate",
  description: "Create an installment plan in Yuno.",
  schema: installmentPlanCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async (data: InstallmentPlanCreateSchema): Promise<Output<TType, YunoInstallmentPlan>> => {
      const planWithAccount = {
        ...data,
        account_id: data.account_id || [yunoClient.accountCode],
      };
      const plan = await yunoClient.installmentPlans.create(planWithAccount);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(plan, null, 4),
            },
          ],
        } as Output<TType, YunoInstallmentPlan>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: plan,
          },
        ],
      } as Output<TType, YunoInstallmentPlan>;
    },
} as const satisfies Tool;

export const installmentPlanRetrieveTool = {
  method: "installmentPlanRetrieve",
  description: "Retrieve an installment plan in Yuno by its ID.",
  schema: z.object({
    planId: z.string().describe("The unique identifier of the installment plan to retrieve"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ planId }: { planId: string }): Promise<Output<TType, YunoInstallmentPlan>> => {
      const plan = await yunoClient.installmentPlans.retrieve(planId);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(plan, null, 4),
            },
          ],
        } as Output<TType, YunoInstallmentPlan>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: plan,
          },
        ],
      } as Output<TType, YunoInstallmentPlan>;
    },
} as const satisfies Tool;

export const installmentPlanRetrieveAllTool = {
  method: "installmentPlanRetrieveAll",
  description: "Retrieve all installment plans in Yuno for an account.",
  schema: z.object({
    accountId: z.string().describe("The account_id to retrieve all installment plans for"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ accountId }: { accountId: string }): Promise<Output<TType, YunoInstallmentPlan[]>> => {
      const plans = await yunoClient.installmentPlans.retrieveAll(accountId);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(plans, null, 4),
            },
          ],
        } as Output<TType, YunoInstallmentPlan[]>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: plans,
          },
        ],
      } as Output<TType, YunoInstallmentPlan[]>;
    },
} as const satisfies Tool;

export const installmentPlanUpdateTool = {
  method: "installmentPlanUpdate",
  description: "Update an installment plan in Yuno by its ID.",
  schema: installmentPlanUpdateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ planId, ...updateFields }: InstallmentPlanUpdateSchema): Promise<Output<TType, YunoInstallmentPlan>> => {
      const plan = await yunoClient.installmentPlans.update(planId, updateFields);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(plan, null, 4),
            },
          ],
        } as Output<TType, YunoInstallmentPlan>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: plan,
          },
        ],
      } as Output<TType, YunoInstallmentPlan>;
    },
} as const satisfies Tool;

export const installmentPlanDeleteTool = {
  method: "installmentPlanDelete",
  description: "Delete an installment plan in Yuno by its ID.",
  schema: z.object({
    planId: z.string().describe("The unique identifier of the installment plan to delete"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ planId }: { planId: string }): Promise<Output<TType, YunoInstallmentPlan>> => {
      const response = await yunoClient.installmentPlans.delete(planId);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(response, null, 4),
            },
          ],
        } as Output<TType, YunoInstallmentPlan>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: response,
          },
        ],
      } as Output<TType, YunoInstallmentPlan>;
    },
} as const satisfies Tool;

export const installmentPlanTools = [
  installmentPlanCreateTool,
  installmentPlanRetrieveTool,
  installmentPlanRetrieveAllTool,
  installmentPlanUpdateTool,
  installmentPlanDeleteTool,
] as const satisfies Tool[];
