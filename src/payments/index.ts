import { Tool } from "../shared/types/common";
import { paymentCreateTool } from "./toolCreate";
import { paymentRetrieveTool } from "./toolRetrieve";
import { paymentRetrieveByMerchantOrderIdTool } from "./toolRetrieveByMerchantOrderId";
import { paymentRefundTool } from "./toolRefund";
import { paymentCancelOrRefundTool } from "./toolCancelOrRefund";
import { paymentCancelOrRefundWithTransactionTool } from "./toolCancelOrRefundWithTransaction";
import { paymentCancelTool } from "./toolCancel";
import { paymentAuthorizeTool } from "./toolAuthorize";
import { paymentCaptureAuthorizationTool } from "./toolCaptureAuthorization";

export const paymentTools: Tool[] = [
  paymentCreateTool,
  paymentRetrieveTool,
  paymentRetrieveByMerchantOrderIdTool,
  paymentRefundTool,
  paymentCancelOrRefundTool,
  paymentCancelOrRefundWithTransactionTool,
  paymentCancelTool,
  paymentAuthorizeTool,
  paymentCaptureAuthorizationTool,
]; 