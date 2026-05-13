import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YunoClient } from "./client";
import { tools, routingTools } from "./tools";
import { Tool } from "./types";

type CreateOptions = {
  includeRoutingTools?: boolean;
};

function createYunoMCPServer(yunoClient: YunoClient, options: CreateOptions = {}) {
  const server = new McpServer(
    {
      name: "yuno-mcp",
      title: "Yuno",
      version: "0.4.2",
      description:
        "Yuno MCP server: create and manage payments, subscriptions, customers, payment methods, checkouts, recipients, installment plans, payment links, and routing on the Yuno payments platform.",
      websiteUrl: "https://docs.y.uno/mcp",
    },
    {
      capabilities: {},
    },
  );

  const enabledTools = options.includeRoutingTools
    ? [...tools, ...routingTools]
    : tools;

  for (const tool of enabledTools) {
    const permissiveSchema = tool.schema.passthrough();
    const permissiveOutputSchema = tool.outputSchema?.passthrough();

    server.registerTool(
      tool.method,
      {
        title: tool.annotations.title,
        description: tool.description,
        inputSchema: permissiveSchema.shape,
        outputSchema: permissiveOutputSchema,
        annotations: tool.annotations,
      },
      async (params: any) => {
        try {
          const validation = tool.schema.safeParse(params);
          if (!validation.success) {
            const errors = validation.error.issues.map((issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Validation error: ${errors}`,
                },
              ],
              isError: true,
            };
          }

          const handlerResult = await tool.handler({ yunoClient, type: "object" })(validation.data as any);

          const content: { type: "text"; text: string }[] = handlerResult.content.map((entry) => {
            if (entry.type === "object") {
              return { type: "text" as const, text: JSON.stringify(entry.object, null, 4) };
            }
            return { type: "text" as const, text: (entry as unknown as { type: "text"; text: string }).text };
          });

          if (!tool.outputSchema) {
            return { content };
          }

          const mixedContent = handlerResult.content as Array<
            { type: "text"; text: string } | { type: "object"; object: unknown }
          >;
          const headersText = mixedContent.find(
            (entry): entry is { type: "text"; text: string } =>
              entry.type === "text" && /^Response Headers \(HTTP \d+\)/.test(entry.text),
          );
          const statusMatch = headersText?.text.match(/^Response Headers \(HTTP (\d+)\)/);
          const upstreamStatus = statusMatch ? parseInt(statusMatch[1], 10) : 200;

          if (upstreamStatus >= 400) {
            return { content, isError: true };
          }

          const primary = handlerResult.content.find((entry) => entry.type === "object");
          const structuredContent = primary?.type === "object" ? (primary.object as Record<string, unknown>) : {};

          return { content, structuredContent };
        } catch (error) {
          const text = error instanceof Error ? error.message : "An unknown error occurred";
          return { content: [{ type: "text" as const, text }], isError: true };
        }
      },
    );
  }

  return server;
}

async function initializeYunoMCP({
  accountCode,
  publicApiKey,
  privateSecretKey,
  includeRoutingTools,
}: {
  accountCode: string;
  publicApiKey: string;
  privateSecretKey: string;
  includeRoutingTools?: boolean;
}) {
  try {
    const yunoClient = await YunoClient.initialize({
      accountCode,
      publicApiKey,
      privateSecretKey,
    });

    const yunoMCP = createYunoMCPServer(yunoClient, { includeRoutingTools });

    return {
      yunoMCP,
    };
  } catch (error) {
    console.error("\n🚨  Error initializing Yuno MCP server:\n");
  }
}

export { initializeYunoMCP };
