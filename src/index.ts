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
      version: "1.4.0",
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
        outputSchema: permissiveOutputSchema?.shape,
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

          const primary = handlerResult.content.find((entry) => entry.type === "object");
          const structuredContent = primary?.type === "object" ? (primary.object as Record<string, unknown>) : {};

          return { content, structuredContent };
        } catch (error) {
          if (error instanceof Error) {
            return { content: [{ type: "text" as const, text: error.message }] };
          }
          return {
            content: [{ type: "text" as const, text: "An unknown error occurred" }],
          };
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
