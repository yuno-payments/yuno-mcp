import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YunoClient } from "./client";
import { tools } from "./tools";
import { Output } from "./types";

function createYunoMCPServer(yunoClient: YunoClient) {
  const server = new McpServer(
    {
      name: "yuno-mcp",
      version: "1.4.0",
    },
    {
      capabilities: {},
    },
  );

  for (const tool of tools) {
    const permissiveSchema = tool.schema.passthrough();

    server.tool(tool.method, permissiveSchema.shape, async (params: any) => {
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
}: {
  accountCode: string;
  publicApiKey: string;
  privateSecretKey: string;
}) {
  try {
    const yunoClient = await YunoClient.initialize({
      accountCode,
      publicApiKey,
      privateSecretKey,
    });

    const yunoMCP = createYunoMCPServer(yunoClient);

    return {
      yunoMCP,
    };
  } catch (error) {
    console.error("\n🚨  Error initializing Yuno MCP server:\n");
  }
}

export { initializeYunoMCP };
