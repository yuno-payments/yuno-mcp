import {
  ALLOWED_DOCUMENTATION_HOST,
  documentationIndexOutputSchema,
  documentationIndexSchema,
  documentationReadOutputSchema,
  documentationReadSchema,
} from "../../schemas/documentation";
import type { HandlerContext, Output, Tool } from "../../types";
import type { DocumentationReadSchema } from "./types";

type DocumentationContent = { content: string };

const LLMS_TXT_URL = `https://${ALLOWED_DOCUMENTATION_HOST}/llms.txt`;

function isAllowedDocumentationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === ALLOWED_DOCUMENTATION_HOST;
  } catch {
    return false;
  }
}

const documentationIndexTool = {
  method: "documentationIndex",
  description:
    "Retrieve the Yuno documentation index (llms.txt) listing all available API references, SDK guides, and integration tutorials with their URLs.",
  annotations: { title: "Yuno Documentation Index", readOnlyHint: true },
  schema: documentationIndexSchema,
  outputSchema: documentationIndexOutputSchema,
  handler:
    <TType extends "object" | "text">({ type }: HandlerContext<TType>) =>
    async (): Promise<Output<TType, DocumentationContent>> => {
      try {
        const response = await fetch(LLMS_TXT_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch documentation index: HTTP ${response.status}`);
        }
        const text = await response.text();

        if (type === "text") {
          return { content: [{ type: "text" as const, text }] } as Output<TType, DocumentationContent>;
        }

        return {
          content: [{ type: "object" as const, object: { content: text } }],
        } as Output<TType, DocumentationContent>;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch documentation index";

        if (type === "text") {
          return { content: [{ type: "text" as const, text: message }] } as Output<TType, DocumentationContent>;
        }

        return {
          content: [{ type: "object" as const, object: { content: message } }],
        } as Output<TType, DocumentationContent>;
      }
    },
} as const satisfies Tool;

const documentationReadTool = {
  method: "documentationRead",
  description:
    "Read a specific Yuno documentation page by URL. Use the documentation index tool first to discover available pages and their URLs.",
  annotations: { title: "Read Yuno Documentation", readOnlyHint: true },
  schema: documentationReadSchema,
  outputSchema: documentationReadOutputSchema,
  handler:
    <TType extends "object" | "text">({ type }: HandlerContext<TType>) =>
    async ({ url }: DocumentationReadSchema): Promise<Output<TType, DocumentationContent>> => {
      if (!isAllowedDocumentationUrl(url)) {
        const refusal = `Refused: URL must be an https:// URL on ${ALLOWED_DOCUMENTATION_HOST}`;

        if (type === "text") {
          return { content: [{ type: "text" as const, text: refusal }] } as Output<TType, DocumentationContent>;
        }

        return {
          content: [{ type: "object" as const, object: { content: refusal } }],
        } as Output<TType, DocumentationContent>;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch documentation: HTTP ${response.status}`);
        }
        const text = await response.text();

        if (type === "text") {
          return { content: [{ type: "text" as const, text }] } as Output<TType, DocumentationContent>;
        }

        return {
          content: [{ type: "object" as const, object: { content: text } }],
        } as Output<TType, DocumentationContent>;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch documentation";

        if (type === "text") {
          return { content: [{ type: "text" as const, text: message }] } as Output<TType, DocumentationContent>;
        }

        return {
          content: [{ type: "object" as const, object: { content: message } }],
        } as Output<TType, DocumentationContent>;
      }
    },
} as const satisfies Tool;

export const documentationTools = [documentationIndexTool, documentationReadTool] as const satisfies Tool[];
export type * from "./types";
