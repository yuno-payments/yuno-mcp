import { z } from "zod";
import { Tool } from "../shared/types";
import { YunoClient } from "../client";

export const customerUpdateSchema = z.object({
    customerId: z.string().min(36).max(64).describe("The unique identifier of the customer to update (MIN 36, MAX 64 characters)"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    gender: z.enum(["M", "F", "NB"]).optional(),
    date_of_birth: z.string().optional(),
    email: z.string().optional(),
    nationality: z.string().optional(),
    country: z.string().optional(),
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

export const customerUpdateTool: Tool = {
  method: "customer.update",
  description: "Update a customer by ID.",
  schema: customerUpdateSchema,
  handler: async (yunoClient: YunoClient, { customerId, ...updateFields }: any, _extra?: any) => {
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