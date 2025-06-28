import { z } from "zod";
import { Tool } from "../shared/types";
import { YunoClient } from "../client";

export const customerRetrieveTool: Tool = {
  method: "customer.retrieve",
  description: "Retrieve a customer by ID.",
  schema: z.object({
    customerId: z.string().min(36).max(64).describe("The unique identifier of the customer to retrieve (MIN 36, MAX 64 characters)"),
  }),
  handler: async (yunoClient: YunoClient, { customerId }: any, _extra?: any) => {
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