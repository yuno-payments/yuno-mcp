import z from "zod";
import { paymentMethodEnrollSchema } from "../../schemas";

export interface YunoPaymentMethod {
  name: string;
  description: string;
  type: string;
  country: string;
  status: string;
  sub_status?: string;
  vaulted_token: string;
}

export type PaymentMethodEnrollSchema = z.infer<typeof paymentMethodEnrollSchema>;
