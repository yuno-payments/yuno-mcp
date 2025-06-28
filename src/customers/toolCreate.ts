import { z } from "zod";
import { Tool, YunoCustomer } from "../shared/types";
import { YunoClient } from "../client";

export const customerCreateSchema = z.object({
    merchant_customer_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    gender: z.enum(["M", "F", "NB"]).optional(),
    date_of_birth: z.string().optional(),
    email: z.string(),
    nationality: z.string().optional(),
    country: z.string(),
    document: z.object({
      document_type: z.string(),
      document_number: z.string(),
    }).optional(),
    phone: z.object({
      number: z.string(),
      country_code: z.string(),
    }).optional(),
    billing_address: z.object({
      address_line_1: z.string(),
      address_line_2: z.string().optional(),
      country: z.string(),
      state: z.string(),
      city: z.string(),
      zip_code: z.string(),
      neighborhood: z.string().optional(),
    }).optional(),
    shipping_address: z.object({
      address_line_1: z.string(),
      address_line_2: z.string().optional(),
      country: z.string(),
      state: z.string(),
      city: z.string(),
      zip_code: z.string(),
      neighborhood: z.string().optional(),
    }).optional(),
    metadata: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
    merchant_customer_created_at: z.string().optional(),
  })

export const customerCreateTool: Tool = {
  method: "customer.create",
  description: "Create a new customer in Yuno.",
  schema: customerCreateSchema,
  handler: async (yunoClient: YunoClient, data: YunoCustomer, _extra?: any) => {
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