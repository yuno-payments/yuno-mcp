import z from "zod";
import { customerCreateSchema, customerUpdateSchema } from "../../schemas";
import type { HandlerContext, Output, Tool } from "../../types";
import type { CustomerUpdateSchema, YunoCustomer } from "./types";

export const customerCreateTool = {
  method: "customerCreate",
  description: "Create a new customer in Yuno.",
  schema: customerCreateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async (data: YunoCustomer): Promise<Output<TType, YunoCustomer>> => {
      const customer = await yunoClient.customers.create(data);

      console.log("customer", JSON.stringify(customer, null, 4));

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(customer, null, 4),
            },
          ],
        } as Output<TType, YunoCustomer>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: customer,
          },
        ],
      } as Output<TType, YunoCustomer>;
    },
} as const satisfies Tool;

export const customerRetrieveTool = {
  method: "customerRetrieve",
  description: "Retrieve a customer by ID.",
  schema: z.object({
    customerId: z.string().min(36).max(64).describe("The unique identifier of the customer to retrieve (MIN 36, MAX 64 characters)"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ customerId }: { customerId: string }): Promise<Output<TType, YunoCustomer>> => {
      const customer = await yunoClient.customers.retrieve(customerId);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(customer, null, 4),
            },
          ],
        } as Output<TType, YunoCustomer>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: customer,
          },
        ],
      } as Output<TType, YunoCustomer>;
    },
} as const satisfies Tool;

export const customerRetrieveByExternalIdTool = {
  method: "customerRetrieveByExternalId",
  description: "Retrieve a customer by external merchant_customer_id.",
  schema: z.object({
    merchant_customer_id: z.string().describe("The external merchant_customer_id to retrieve the customer"),
  }),
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ merchant_customer_id }: { merchant_customer_id: string }): Promise<Output<TType, YunoCustomer>> => {
      const customer = await yunoClient.customers.retrieveByExternalId(merchant_customer_id);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(customer, null, 4),
            },
          ],
        } as Output<TType, YunoCustomer>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: customer,
          },
        ],
      } as Output<TType, YunoCustomer>;
    },
} as const satisfies Tool;

export const customerUpdateTool = {
  method: "customerUpdate",
  description: "Update a customer by ID.",
  schema: customerUpdateSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ customerId, ...updateFields }: CustomerUpdateSchema): Promise<Output<TType, YunoCustomer>> => {
      const customer = await yunoClient.customers.update(customerId, updateFields);

      if (type === "text") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(customer, null, 4),
            },
          ],
        } as Output<TType, YunoCustomer>;
      }

      return {
        content: [
          {
            type: "object" as const,
            object: customer,
          },
        ],
      } as Output<TType, YunoCustomer>;
    },
} as const satisfies Tool;

export const customerTools = [customerCreateTool, customerRetrieveTool, customerRetrieveByExternalIdTool, customerUpdateTool];
