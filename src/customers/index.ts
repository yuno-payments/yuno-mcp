import z from "zod";
import { YunoClient } from "../client";
import { customerCreateSchema, CustomerUpdateSchema, customerUpdateSchema, YunoCustomer } from "./types";
import { Tool } from "../shared/types";

export const customerCreateTool: Tool = {
  method: "customerCreate",
  description: "Create a new customer in Yuno.",
  schema: customerCreateSchema,
  handler: async (yunoClient: YunoClient, data: YunoCustomer) => {
    const customer = await yunoClient.customers.create(data);
    return {
      content: [
        {
          type: "text" as const,
          text: `customer response: ${JSON.stringify(customer, null, 4)}`,
        },
      ],
    };
  },
};

export const customerRetrieveTool: Tool = {
  method: "customerRetrieve",
  description: "Retrieve a customer by ID.",
  schema: z.object({
    customerId: z.string().min(36).max(64).describe("The unique identifier of the customer to retrieve (MIN 36, MAX 64 characters)"),
  }),
  handler: async (yunoClient: YunoClient, { customerId }: { customerId: string }) => {
    const customer = await yunoClient.customers.retrieve(customerId);
    return {
      content: [
        {
          type: "text" as const,
          text: `customer response: ${JSON.stringify(customer, null, 4)}`,
        },
      ],
    };
  },
};

export const customerRetrieveByExternalIdTool: Tool = {
  method: "customerRetrieveByExternalId",
  description: "Retrieve a customer by external merchant_customer_id.",
  schema: z.object({
    merchant_customer_id: z.string().describe("The external merchant_customer_id to retrieve the customer"),
  }),
  handler: async (yunoClient: YunoClient, { merchant_customer_id }: { merchant_customer_id: string }) => {
    const customer = await yunoClient.customers.retrieveByExternalId(merchant_customer_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `customer response: ${JSON.stringify(customer, null, 4)}`,
        },
      ],
    };
  },
};

export const customerUpdateTool: Tool = {
  method: "customerUpdate",
  description: "Update a customer by ID.",
  schema: customerUpdateSchema,
  handler: async (yunoClient: YunoClient, { customerId, ...updateFields }: CustomerUpdateSchema) => {
    const customer = await yunoClient.customers.update(customerId, updateFields);
    return {
      content: [
        {
          type: "text" as const,
          text: `customer response: ${JSON.stringify(customer, null, 4)}`,
        },
      ],
    };
  },
};

export const customerTools: Tool[] = [customerCreateTool, customerRetrieveTool, customerRetrieveByExternalIdTool, customerUpdateTool];
