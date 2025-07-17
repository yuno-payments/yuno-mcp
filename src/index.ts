import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YunoClient } from "./client";
import { tools } from "./tools";

let yunoClient: Awaited<ReturnType<typeof YunoClient.initialize>>;

const yunoMCP = new McpServer(
  {
    name: "yuno-mcp",
    version: "1.3.1",
  },
  {
    capabilities: {},
  },
);

for (const tool of tools) {
  yunoMCP.tool(tool.method, tool.schema.shape, async (params: any, extra: any) => {
    try {
      if (!yunoClient) {
        throw new Error("Yuno client not initialized");
      }
      return await tool.handler(yunoClient, params, extra);
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
    yunoClient = await YunoClient.initialize({
      accountCode,
      publicApiKey,
      privateSecretKey,
    });

    return {
      yunoMCP,
    };
  } catch (error) {
    console.error("\n🚨  Error initializing Yuno MCP server:\n");
  }
}

export { initializeYunoMCP };
