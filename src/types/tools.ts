import { z } from "zod";
import type { YunoClient } from "../client";

type CheckoutToolMethod = "checkoutSessionCreate" | "checkoutSessionRetrievePaymentMethods" | "checkoutSessionCreateOtt";
type CustomerToolMethod = "customerCreate" | "customerRetrieve" | "customerRetrieveByExternalId" | "customerUpdate";
type DocumentationToolMethod = "documentationRead";
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
type RoutingToolMethod =
    | "routingLogin"
    | "routingCreate"
    | "routingGetProviders"
    | "routingRetrieve"
    | "routingUpdate"
    | "routingPost"
    | "routingLogOut";

type ToolMethod =
  | CheckoutToolMethod
  | CustomerToolMethod
  | DocumentationToolMethod
  | InstallmentPlanToolMethod
  | PaymentLinkToolMethod
  | PaymentMethodToolMethod
  | PaymentToolMethod
  | RecipientToolMethod
  | SubscriptionToolMethod
    | RoutingToolMethod;

type Content<TType extends "text" | "object" = "object" | "text", TResult extends any = any> = TType extends "text"
  ? { type: "text"; text: string }
  : { type: "object"; object: TResult };

type Output<TType extends "text" | "object" = "object" | "text", TResult extends any = any> = {
  content: Content<TType, TResult>[];
};

type HandlerContext<TType extends "object" | "text" = "object" | "text"> = {
  yunoClient: YunoClient;
  type: TType;
};

type Tool = {
  method: ToolMethod;
  description: string;
  schema: z.ZodObject<any>;
  handler: <TType extends "object" | "text">(context: HandlerContext<TType>) => (input: any) => Promise<Output<TType>>;
};

export type { Tool, Output, Content, HandlerContext };
