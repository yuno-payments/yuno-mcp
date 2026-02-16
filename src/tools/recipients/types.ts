import z from "zod";
import { recipientCreateSchema, recipientUpdateSchema } from "../../schemas";
import type { YunoAddress, YunoDocument, YunoPhone } from "../../types";

export interface YunoRecipient {
  id?: string;
  account_id?: string;
  merchant_recipient_id?: string;
  national_entity: "INDIVIDUAL" | "ENTITY";
  entity_type?: "GOVERNMENTAL" | "PUBLIC" | "NON_PROFIT" | "PRIVATE";
  first_name?: string;
  last_name?: string;
  legal_name?: string;
  email?: string;
  date_of_birth?: string;
  country?: string;
  website?: string;
  industry?: string;
  merchant_category_code?: string;
  status?: string;
  document?: YunoDocument;
  phone?: YunoPhone;
  address?: YunoAddress;
  withdrawal_methods?: {
    bank?: {
      code: string;
      branch: string;
      account: string;
      account_type: "CHECKINGS" | "SAVINGS";
      branch_digit?: string;
      account_digit?: string;
      routing?: string;
      country: string;
      currency: string;
      payout_schedule?: "DAY" | "WEEK" | "MONTH" | "HOLD";
    };
  };
  legal_representatives?: Array<{
    merchant_reference?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    date_of_birth?: string;
    country?: string;
    nationality?: string;
    title?: string;
    publicly_exposed_person?: boolean;
    ultimate_beneficial_owner?: boolean;
  }>;
}

export type RecipientCreateSchema = z.infer<typeof recipientCreateSchema>;

export type RecipientUpdateSchema = z.infer<typeof recipientUpdateSchema>;
export type RecipientUpdateBody = Omit<RecipientUpdateSchema, "recipientId">;
