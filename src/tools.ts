import { customerTools } from "./customers";
import { paymentMethodTools } from "./paymentMethods";
import { checkoutTools } from "./checkouts";
import { paymentTools } from "./payments";
import { paymentLinkTools } from "./paymentLinks";
import { subscriptionTools } from "./subscriptions";
import { recipientTools } from "./recipients";
import { installmentPlanTools } from "./installmentPlans";
import { Tool } from "./shared/types/common";

export const tools: Tool[] = [
  ...customerTools,
  ...paymentMethodTools,
  ...checkoutTools,
  ...paymentTools,
  ...paymentLinkTools,
  ...subscriptionTools,
  ...recipientTools,
  ...installmentPlanTools,
];
