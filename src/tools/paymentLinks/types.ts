import z from "zod";
import { paymentLinkCreateSchema, paymentLinkCancelSchema } from "../../schemas";
import type { YunoAmount, YunoMetadata, YunoAdditionalData } from "../../types";

export interface YunoPaymentLink {
  account_id?: string;
  description?: string;
  country: string;
  merchant_order_id?: string;
  additional_data?: YunoAdditionalData;
  url?: string;
  status?: string;
  amount: YunoAmount;
  payment_method_types: string[];
  metadata?: YunoMetadata[];
  cancelled_at?: string;
}

export type PaymentLinkCreateSchema = z.infer<typeof paymentLinkCreateSchema>;

export type PaymentLinkCancelSchema = z.infer<typeof paymentLinkCancelSchema>;
