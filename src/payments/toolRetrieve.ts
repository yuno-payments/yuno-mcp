import { z } from "zod";
import { Tool } from "../shared/types/common";
import { YunoClient } from "../client";

export const paymentRetrieveSchema = z.object({
  payment_id: z.string().describe("The unique identifier of the payment"),
});

export const paymentRetrieveTool: Tool = {
  method: "payments.retrieve",
  description: "Retrieve a payment by ID in Yuno.",
  schema: paymentRetrieveSchema,
  handler: async (yunoClient: YunoClient, { payment_id }: any, _extra?: any) => {
    const payment = await yunoClient.payments.retrieve(payment_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `payment response: ${JSON.stringify(payment, null, 4)}`,
        },
      ],
    };
  },
}; 