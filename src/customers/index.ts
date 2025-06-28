import { Tool } from "../shared/types";
import { customerCreateTool } from "./toolCreate";
import { customerRetrieveTool } from "./toolRetrieve";
import { customerRetrieveByExternalIdTool } from "./toolRetrieveByExternalId";
import { customerUpdateTool } from "./toolUpdate";

export const customerTools: Tool[] = [
  customerCreateTool,
  customerRetrieveTool,
  customerRetrieveByExternalIdTool,
  customerUpdateTool,
]; 