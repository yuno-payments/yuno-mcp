import z from "zod";
import { subscriptionCreateSchema, subscriptionUpdateSchema } from "../../schemas";
import type { YunoAdditionalData, YunoAmount, YunoMetadata } from "../../types";

export interface YunoSubscription {
  account_id?: string;
  name?: string;
  description?: string;
  merchant_reference?: string;
  amount?: {
    currency: string;
    value: number;
  };
  status?: string;
  additional_data?: YunoAdditionalData;
  frequency?: {
    type: "DAY" | "WEEK" | "MONTH";
    value?: number;
  };
  billing_cycles?: {
    total: number;
  };
  payment_method?: {
    type?: "CARD";
    vaulted_token?: string;
    card?: {
      installments?: number;
      network_transaction_id?: string;
      verify?: boolean;
      card_data?: {
        number: string;
        expiration_month: number;
        expiration_year: number;
        security_code: string | number;
        holder_name: string;
      };
    };
    [key: string]: any;
  };
  trial_period?: {
    billing_cycles?: number;
    amount?: YunoAmount;
  };
  availability?: {
    start_at?: string;
    finish_at?: string;
  };
  metadata?: YunoMetadata[];
}

export type SubscriptionCreateSchema = z.infer<typeof subscriptionCreateSchema>;

export type SubscriptionUpdateSchema = z.infer<typeof subscriptionUpdateSchema>;
export type SubscriptionUpdateBody = Omit<SubscriptionUpdateSchema, "subscriptionId">;
