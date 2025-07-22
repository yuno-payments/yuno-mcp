import z from "zod";
import { recipientCreateSchema, recipientUpdateSchema } from "../../schemas";
import type { YunoAddress, YunoDocument, YunoPhone } from "../../types";

export interface YunoRecipient {
  id?: string;
  account_id?: string;
  merchant_recipient_id: string;
  national_entity: "INDIVIDUAL" | "ENTITY";
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  status?: string;
  document?: YunoDocument;
  phone?: YunoPhone;
  address?: YunoAddress;
  bank: {
    code: string;
    branch: string;
    account: string;
    account_type: string;
  };
  providers?: Array<{
    id?: string;
    recipient_id?: string;
  }>;
}

export type RecipientCreateSchema = z.infer<typeof recipientCreateSchema>;

export type RecipientUpdateSchema = z.infer<typeof recipientUpdateSchema>;
export type RecipientUpdateBody = Omit<RecipientUpdateSchema, "recipientId">;
