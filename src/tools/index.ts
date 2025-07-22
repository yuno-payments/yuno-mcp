import type { Tool } from "../types";
import { checkoutTools } from "./checkouts";
import { customerTools } from "./customers";
import { documentationTools } from "./documentation";
import { installmentPlanTools } from "./installmentPlans";
import { paymentLinkTools } from "./paymentLinks";
import { paymentMethodTools } from "./paymentMethods";
import { paymentTools } from "./payments";
import { recipientTools } from "./recipients";
import { routingTools } from "./routing";
import { subscriptionTools } from "./subscriptions";

export const tools = [
  ...customerTools,
  ...paymentMethodTools,
  ...checkoutTools,
  ...subscriptionTools,
  ...paymentTools,
  ...paymentLinkTools,
  ...recipientTools,
  ...installmentPlanTools,
  ...documentationTools,
  ...routingTools,
] as const satisfies Tool[];
