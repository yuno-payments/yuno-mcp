import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { YunoClient } from "./client";
import { tools } from "./tools";

let yunoClient: Awaited<ReturnType<typeof YunoClient.initialize>>;

const yunoMCPServer = new McpServer(
  {
    name: "yuno-mcp",
    version: "1.3.1",
  },
  {
    capabilities: {},
  },
);

async function initializeYunoClient() {
  try {
    yunoClient = await YunoClient.initialize({
      accountCode: process.env.YUNO_ACCOUNT_CODE as string,
      publicApiKey: process.env.YUNO_PUBLIC_API_KEY as string,
      privateSecretKey: process.env.YUNO_PRIVATE_SECRET_KEY as string,
    });
  } catch (error) {
    if (error instanceof Error) {
      return { content: [{ type: "text", text: error.message }] };
    }
    return { content: [{ type: "text", text: "An unknown error occurred" }] };
  }
}

for (const tool of tools) {
  yunoMCPServer.tool(tool.method, tool.schema.shape, async (params: any, extra: any) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
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

export { yunoMCPServer };

// export async function main() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
// }

// if (require.main === module) {
//   main().catch((error) => {
//     console.error("\n🚨  Error initializing Yuno MCP server:\n");
//     console.error(`   ${error.message}\n`);
//   });
// }
