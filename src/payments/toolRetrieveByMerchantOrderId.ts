import { z } from "zod";
import { Tool } from "../shared/types/common";

export const paymentRetrieveByMerchantOrderIdSchema = z.object({
  merchant_order_id: z.string().describe("The unique identifier of the order for the payment (merchant_order_id)"),
});

export const paymentRetrieveByMerchantOrderIdTool: Tool = {
  method: "payments.retrieveByMerchantOrderId",
  description: "Retrieve payments by merchant order ID in Yuno.",
  schema: paymentRetrieveByMerchantOrderIdSchema,
  handler: async (yunoClient: any, { merchant_order_id }: any, _extra?: any) => {
    const payments = await yunoClient.payments.retrieveByMerchantOrderId(merchant_order_id);
    return {
      content: [
        {
          type: "text" as const,
          text: `payments response: ${JSON.stringify(payments, null, 4)}`,
        },
      ],
    };
  },
}; 