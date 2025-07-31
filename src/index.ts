import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YunoClient } from "./client";
import { tools } from "./tools";

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
    const yunoMCP = new McpServer(
      {
        name: "yuno-mcp",
        version: "1.4.0",
      },
      {
        capabilities: {},
      },
    );

    const yunoClient = await YunoClient.initialize({
      accountCode,
      publicApiKey,
      privateSecretKey,
    });

    console.log("yunoClient ===== YUNO MCP", yunoClient);

    if (!yunoClient) {
      console.log("error ===== YUNO MCP", yunoClient);
      throw new Error("Failed to initialize Yuno client");
    }

    for (const tool of tools) {
      yunoMCP.tool(tool.method, tool.schema.shape, async (params: any) => {
        try {
          const apiKeys = {
            accountCode,
          };
          return await tool.handler({ yunoClient, apiKeys, type: "text" })(params);
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

    return {
      yunoMCP,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.error("\n🚨  Error initializing Yuno MCP server:\n", error.message);
    } else {
      console.error("\n🚨  Error initializing Yuno MCP server:\n", error);
    }
  }
}

export { initializeYunoMCP };
