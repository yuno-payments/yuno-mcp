import { z } from "zod";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { YunoClient } from "../client";

type CheckoutToolMethod = "checkoutSessionCreate" | "checkoutSessionRetrievePaymentMethods" | "checkoutSessionCreateOtt";
type CustomerToolMethod = "customerCreate" | "customerRetrieve" | "customerRetrieveByExternalId" | "customerUpdate";
type InstallmentPlanToolMethod =
  | "installmentPlanCreate"
  | "installmentPlanRetrieve"
  | "installmentPlanRetrieveAll"
  | "installmentPlanUpdate"
  | "installmentPlanDelete";
type PaymentLinkToolMethod = "paymentLinkCreate" | "paymentLinkRetrieve" | "paymentLinkCancel";
type PaymentMethodToolMethod = "paymentMethodEnroll" | "paymentMethodRetrieve" | "paymentMethodRetrieveEnrolled" | "paymentMethodUnenroll";
type PaymentToolMethod =
  | "paymentCreate"
  | "paymentRetrieve"
  | "paymentRetrieveByMerchantOrderId"
  | "paymentRefund"
  | "paymentCancel"
  | "paymentCancelOrRefund"
  | "paymentCancelOrRefundWithTransaction"
  | "paymentAuthorize"
  | "paymentCaptureAuthorization";
type RecipientToolMethod = "recipientCreate" | "recipientRetrieve" | "recipientUpdate" | "recipientDelete";
type SubscriptionToolMethod =
  | "subscriptionCreate"
  | "subscriptionRetrieve"
  | "subscriptionPause"
  | "subscriptionResume"
  | "subscriptionUpdate"
  | "subscriptionCancel";
type MetaToolMethod = "describeTool";

type ToolMethod =
  | MetaToolMethod
  | CheckoutToolMethod
  | CustomerToolMethod
  | InstallmentPlanToolMethod
  | PaymentLinkToolMethod
  | PaymentMethodToolMethod
  | PaymentToolMethod
  | RecipientToolMethod
  | SubscriptionToolMethod;

type Content<TType extends "text" | "object" = "object" | "text", TResult extends any = any> = TType extends "text"
  ? { type: "text"; text: string }
  : { type: "object"; object: TResult };

type Output<TType extends "text" | "object" = "object" | "text", TResult extends any = any> = {
  content: Content<TType, TResult>[];
  /**
   * Set by a handler that failed without an upstream call to point at — describeTool
   * on an unknown name, say. Upstream failures are flagged by the registration
   * wrapper from the HTTP status instead, so handlers that call the API need not set it.
   */
  isError?: boolean;
};

type HandlerContext<TType extends "object" | "text" = "object" | "text"> = {
  yunoClient: YunoClient;
  type: TType;
};

type Tool = {
  method: ToolMethod;
  description: string;
  annotations: ToolAnnotations;
  schema: z.ZodObject<any>;
  outputSchema?: z.ZodObject<any>;
  handler: <TType extends "object" | "text">(context: HandlerContext<TType>) => (input: any) => Promise<Output<TType>>;
};

export type { Tool, Output, Content, HandlerContext };
