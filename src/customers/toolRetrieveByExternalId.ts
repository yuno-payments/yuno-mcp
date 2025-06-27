import { z } from "zod";
import { Tool } from "../shared/types";
import { YunoClient } from "../client";

export const customerRetrieveByExternalIdTool: Tool = {
  method: "customer.retrieveByExternalId",
  description: "Retrieve a customer by external merchant_customer_id.",
  schema: z.object({
    merchant_customer_id: z.string().describe("The external merchant_customer_id to retrieve the customer"),
  }),
  handler: async (yunoClient: YunoClient, { merchant_customer_id }: any, _extra?: any) => {
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