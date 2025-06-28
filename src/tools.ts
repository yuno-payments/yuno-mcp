import { customerTools } from "./customers";
import { checkoutTools } from "./checkouts";
import { paymentTools } from "./payments";
import { Tool } from "./shared/types/common";

export const tools: Tool[] = [
  ...customerTools,
  ...checkoutTools,
  ...paymentTools,
];
