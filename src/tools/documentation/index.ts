import { documentationIndexSchema, documentationReadSchema } from "../../schemas/documentation";
import type { HandlerContext, Output, Tool } from "../../types";
import type { DocumentationReadSchema } from "./types";

const LLMS_TXT_URL = "https://docs.y.uno/llms.txt";

const documentationIndexTool = {
  method: "documentationIndex",
  description:
    "Retrieve the Yuno documentation index (llms.txt) listing all available API references, SDK guides, and integration tutorials with their URLs.",
  annotations: { title: "Yuno Documentation Index", readOnlyHint: true },
  schema: documentationIndexSchema,
  handler:
    <TType extends "object" | "text">({ type }: HandlerContext<TType>) =>
    async (): Promise<Output<TType>> => {
      if (type === "object") {
        throw new Error("Documentation index tool only supports text output");
      }

      try {
        const response = await fetch(LLMS_TXT_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch documentation index: HTTP ${response.status}`);
        }
        const text = await response.text();
        return { content: [{ type: "text" as const, text }] } as Output<TType>;
      } catch (error) {
        if (error instanceof Error) {
          return { content: [{ type: "text" as const, text: error.message }] } as Output<TType>;
        }
        return { content: [{ type: "text" as const, text: "Failed to fetch documentation index" }] } as Output<TType>;
      }
    },
} as const satisfies Tool;

const documentationReadTool = {
  method: "documentationRead",
  description:
    "Read a specific Yuno documentation page by URL. Use the documentation index tool first to discover available pages and their URLs.",
  annotations: { title: "Read Yuno Documentation", readOnlyHint: true },
  schema: documentationReadSchema,
  handler:
    <TType extends "object" | "text">({ type }: HandlerContext<TType>) =>
    async ({ url }: DocumentationReadSchema): Promise<Output<TType>> => {
      if (type === "object") {
        throw new Error("Documentation read tool only supports text output");
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch documentation: HTTP ${response.status}`);
        }
        const text = await response.text();
        return { content: [{ type: "text" as const, text }] } as Output<TType>;
      } catch (error) {
        if (error instanceof Error) {
          return { content: [{ type: "text" as const, text: error.message }] } as Output<TType>;
        }
        return { content: [{ type: "text" as const, text: "Failed to fetch documentation" }] } as Output<TType>;
      }
    },
} as const satisfies Tool;

export const documentationTools = [documentationIndexTool, documentationReadTool] as const satisfies Tool[];
export type * from "./types";
