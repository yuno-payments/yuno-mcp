import type { Tool } from "../types";
import { createAccountContextTool } from "./account";
import { checkoutTools } from "./checkouts";
import { customerTools } from "./customers";
import { installmentPlanTools } from "./installmentPlans";
import { paymentLinkTools } from "./paymentLinks";
import { paymentMethodTools } from "./paymentMethods";
import { paymentTools } from "./payments";
import { recipientTools } from "./recipients";
import { subscriptionTools } from "./subscriptions";

const apiTools = [
  ...customerTools,
  ...paymentMethodTools,
  ...checkoutTools,
  ...subscriptionTools,
  ...paymentTools,
  ...paymentLinkTools,
  ...recipientTools,
  ...installmentPlanTools,
] as const satisfies Tool[];

export const tools = [...apiTools, createAccountContextTool(apiTools)] as const satisfies Tool[];
