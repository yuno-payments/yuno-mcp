import z from "zod";
import { tools } from "../index";
import type { HandlerContext, Output, Tool } from "../../types";
import { EXAMPLES } from "./examples";

const describeToolSchema = z.object({
  method: z.string().describe("Name of the tool to describe, e.g. paymentCreate"),
  include_output_schema: z
    .boolean()
    .nullish()
    .describe("Also return the full response schema. Off by default — output schemas are large and rarely needed to build a request."),
});

type DescribeToolSchema = z.infer<typeof describeToolSchema>;

/**
 * Registered tool schemas are compacted (src/schemas/compact.ts); this tool serves
 * the complete input/output JSON Schema plus a worked example on demand, so deep
 * structures like paymentCreate's additional_data stay discoverable without paying
 * their context cost on every tools/list.
 */
export const describeTool = {
  method: "describeTool",
  description:
    "Return the complete input/output JSON Schema and a worked example for any tool on this server. Registered schemas are compacted; call this before building complex payloads (e.g. paymentCreate).",
  annotations: { openWorldHint: false, title: "Describe Tool", readOnlyHint: true, destructiveHint: false },
  schema: describeToolSchema,
  handler:
    <TType extends "object" | "text">({ type }: HandlerContext<TType>) =>
    ({ method, include_output_schema }: DescribeToolSchema): Promise<Output<TType>> => {
      const target: Tool | undefined = tools.find((tool) => tool.method === method);

      if (!target) {
        const available = [...tools.map((tool) => tool.method), "describeTool"].join(", ");
        return Promise.resolve({
          content: [{ type: "text" as const, text: `Unknown tool "${method}". Available tools: ${available}` }],
        } as Output<TType>);
      }

      const details = {
        method: target.method,
        description: target.description,
        inputSchema: z.toJSONSchema(target.schema, { unrepresentable: "any" }),
        outputSchema:
          include_output_schema && target.outputSchema ? z.toJSONSchema(target.outputSchema, { unrepresentable: "any" }) : undefined,
        example: EXAMPLES[target.method],
      };

      // Always a compact-JSON text entry, never an object entry: the server wrapper
      // pretty-prints objects at 4-space indent, which triples an already large
      // schema payload (~100KB → ~300KB for paymentCreate).
      void type;
      return Promise.resolve({
        content: [{ type: "text" as const, text: JSON.stringify(details) }],
      } as Output<TType>);
    },
} as const satisfies Tool;
