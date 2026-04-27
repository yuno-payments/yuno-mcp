import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YunoClient } from "./client";
import { tools, routingTools } from "./tools";
import { Output, Tool } from "./types";

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

  const enabledTools: readonly Tool[] = options.includeRoutingTools
    ? [...tools, ...routingTools]
    : tools;

  for (const tool of enabledTools) {
    const permissiveSchema = tool.schema.passthrough();

    server.tool(tool.method, tool.description, permissiveSchema.shape, tool.annotations, async (params: any) => {
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

        return await tool.handler({ yunoClient, type: "text" })(validation.data as any);
      } catch (error) {
        if (error instanceof Error) {
          return { content: [{ type: "text" as const, text: error.message }] };
        }
        return {
          content: [{ type: "text" as const, text: "An unknown error occurred" }],
        };
      }
    });
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
