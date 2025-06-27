import { z } from "zod";
import { Tool, YunoCheckoutSession } from "../shared/types";
import { YunoClient } from "../client";

export const checkoutSessionCreateSchema = z.object({
  customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer"),
  merchant_order_id: z.string().min(3).max(255).describe("The unique identifier of the customer's order"),
  payment_description: z.string().min(1).max(255).describe("The description of the payment"),
  callback_url: z.string().min(3).max(526).optional().describe("The URL where we will redirect your customer after making the purchase"),
  country: z.enum([
    "AR", "BO", "BR", "CL", "CO", "CR", "EC", "SV", "GT", "HN", "MX", "NI", "PA", "PY", "PE", "US", "UY"
  ]).describe("The customer's country (ISO 3166-1)"),
  amount: z.object({
    currency: z.enum([
      "ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"
    ]).describe("The currency used to make the payment (ISO 4217)"),
    value: z.number().multipleOf(0.0001).describe("The payment amount")
  }).describe("Specifies the payment amount object"),
  metadata: z.array(
    z.object({
      key: z.string(),
      value: z.string()
    })
  ).max(120).optional().describe("Specifies a list of metadata objects. Max 120 items"),
  installments: z.object({
    plan_id: z.string().optional().describe("Plan Id of the installment plan created in Yuno"),
    plan: z.array(
      z.object({
        installment: z.number().int().describe("The number of monthly installments"),
        rate: z.number().describe("The rate applied to the final amount (percentage)")
      })
    ).optional().describe("Installments to show the customer")
  }).optional().describe("The installment plan configuration")
});

export const checkoutSessionCreateTool: Tool = {
  method: "checkoutSession.create",
  description: "Create a new checkout session in Yuno.",
  schema: checkoutSessionCreateSchema,
  handler: async (yunoClient: YunoClient, data: YunoCheckoutSession, _extra?: any) => {
    const checkoutSession = await yunoClient.checkoutSessions.create(data);
    return { 
      content: [
        { 
          type: "text" as const,
          text: `checkout session response: ${JSON.stringify(checkoutSession, null, 4)}`,
        },
      ],
    };
  },
}; 