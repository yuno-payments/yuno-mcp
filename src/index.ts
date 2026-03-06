import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YunoClient } from "./client";
import { tools } from "./tools";
import { Output } from "./types";

let yunoClient: Awaited<ReturnType<typeof YunoClient.initialize>>;

const yunoMCP = new McpServer(
  {
    name: "yuno-mcp",
    version: "1.4.0",
  },
  {
    capabilities: {},
  },
);

for (const tool of tools) {
  // Pass the schema shape to the SDK for tool discovery/description,
  // but wrap with a permissive schema so the SDK doesn't throw on validation.
  // We validate manually inside the handler with safeParse to return
  // user-friendly error messages instead of crashing with a 400.
  const permissiveSchema = tool.schema.passthrough();

  yunoMCP.tool(tool.method, permissiveSchema.shape, async (params: any) => {
    try {
      if (!yunoClient) {
        throw new Error("Yuno client not initialized");
      }

      // Validate params with the original strict schema using safeParse
      const validation = tool.schema.safeParse(params);
      if (!validation.success) {
        const errors = validation.error.issues
          .map((issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; ");
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
