import { Tool } from "../shared/types";
import { checkoutSessionCreateTool } from "./toolCreate";
import { checkoutSessionRetrievePaymentMethodsTool } from "./toolRetrievePaymentMethods";

export const checkoutTools: Tool[] = [
  checkoutSessionCreateTool,
  checkoutSessionRetrievePaymentMethodsTool,
]; 