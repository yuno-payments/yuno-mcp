import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YunoClient } from "./client";
import { tools } from "./tools";
import { describeTool } from "./tools/describe";
import { compactSchema, HEAVY_KEYS } from "./schemas/compact";
import { issueConfirmToken, verifyConfirmToken } from "./confirm";
import { findGuidance, formatGuidance } from "./knowledge/decline-codes";
import { Tool } from "./types";

type ServerMode = "read-only" | "full";

type CreateOptions = {
  /** "read-only" registers only retrieval tools (plus describeTool). Default "full". */
  mode?: ServerMode;
};

const toSnakeCase = (key: string) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

// Names the spelling a model should have used, so the retry is one step away. No
// quotes: the SDK embeds this message in a JSON dump, which would escape them.
function unknownParameterError(issue: z.core.$ZodRawIssue): string | undefined {
  if (issue.code !== "unrecognized_keys") return undefined;
  const hints = issue.keys.map((key) => {
    const snake = toSnakeCase(key);
    return snake === key ? key : `${key} (did you mean ${snake}?)`;
  });
  return `Unknown parameter ${hints.join(", ")}. Parameters are snake_case; nothing was sent to the API.`;
}

function createYunoMCPServer(yunoClient: YunoClient, options: CreateOptions = {}) {
  const server = new McpServer(
    {
      name: "yuno-mcp",
      title: "Yuno",
      // Must match package.json — this is the version MCP clients see during initialize.
      // tests/version.test.ts fails the build if the two drift apart.
      version: "1.0.0",
      description:
        "Yuno MCP server: create and manage payments, subscriptions, customers, payment methods, checkouts, recipients, installment plans, and payment links on the Yuno payments platform.",
      websiteUrl: "https://docs.y.uno/mcp",
    },
    {
      capabilities: {},
    },
  );

  // describeTool is composed here (not in src/tools/index.ts) because it reads the
  // tools array itself — exporting it from there would be an import cycle.
  const enabledTools: readonly Tool[] =
    options.mode === "read-only"
      ? [...tools.filter((tool) => tool.annotations.readOnlyHint === true), describeTool]
      : [...tools, describeTool];

  for (const tool of enabledTools) {
    // Destructive operations against production require a two-phase confirm
    // (src/confirm.ts): first call previews and issues a token, echoing it executes.
    const requiresConfirmation = tool.annotations.destructiveHint === true && yunoClient.environment === "prod";

    // Registration advertises compacted schemas (see src/schemas/compact.ts);
    // the strict tool.schema still validates inside the handler below.
    const registeredInputSchema = compactSchema(tool.schema, { maxDepth: 3, heavyKeys: HEAVY_KEYS });
    const registeredOutputSchema = tool.outputSchema
      ? compactSchema(tool.outputSchema, { maxDepth: 2, heavyKeys: HEAVY_KEYS, partialTopLevel: true })
      : undefined;
    // Every parameter is snake_case, matching the Yuno API. camelCase aliases used
    // to be advertised beside each key, but buying that tolerance meant marking the
    // canonical key optional, which emptied `required[]` on 25 of the 38 tools.
    // A schema a model can trust is worth more than one that forgives a guess.
    const inputSchemaShape = requiresConfirmation
      ? {
          ...registeredInputSchema.shape,
          confirm_token: z
            .string()
            .optional()
            .describe(
              "Production safety gate: call once without this to receive a preview and a confirm_token, then call again with identical arguments plus the token to execute.",
            ),
        }
      : registeredInputSchema.shape;
    // Strict at the top level: a raw shape registers in strip mode, and the SDK would
    // drop an unknown key before the handler ran. A mistyped optional parameter must
    // fail loudly — a dropped `idempotencyKey` means a retry charges or refunds twice.
    const registeredInput = z.strictObject(inputSchemaShape, { error: unknownParameterError });

    server.registerTool(
      tool.method,
      {
        title: tool.annotations.title,
        description: tool.description,
        inputSchema: registeredInput,
        outputSchema: registeredOutputSchema,
        annotations: tool.annotations,
      },
      async (rawParams: any) => {
        try {
          // confirm_token is a transport-level field — strip it before validation so
          // it can never leak into a Yuno API request body.
          const { confirm_token: confirmToken, ...strippedParams } = (rawParams ?? {}) as Record<string, unknown>;
          const params: unknown = requiresConfirmation ? strippedParams : rawParams;

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

          if (requiresConfirmation) {
            if (typeof confirmToken !== "string" || confirmToken.length === 0) {
              const token = issueConfirmToken(yunoClient.confirmSecret, tool.method, validation.data);
              const summary = `${tool.method} is a destructive operation against the PRODUCTION environment. Nothing was executed. Review the arguments below, then call ${tool.method} again with identical arguments plus this confirm_token to execute.`;
              const preview = {
                confirmation_required: true,
                summary,
                confirm_token: token,
                arguments: validation.data,
              };
              return {
                content: [
                  { type: "text" as const, text: summary },
                  { type: "text" as const, text: JSON.stringify(preview, null, 4) },
                ],
                // Output validation runs on non-error results; the compacted output
                // schema's partial top level (src/schemas/compact.ts) is what lets
                // this preview shape pass it.
                ...(tool.outputSchema ? { structuredContent: preview as Record<string, unknown> } : {}),
              };
            }
            if (!verifyConfirmToken(yunoClient.confirmSecret, tool.method, validation.data, confirmToken)) {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: "confirm_token is invalid or expired (tokens expire after 5 minutes, and change when arguments change). Call the tool again without confirm_token to get a fresh preview.",
                  },
                ],
                isError: true,
              };
            }
          }

          const handlerResult = await tool.handler({ yunoClient, type: "object" })(validation.data as any);

          const content: { type: "text"; text: string }[] = handlerResult.content.map((entry) => {
            if (entry.type === "object") {
              // A no-content response (e.g. recipientDelete) has no body to print, and
              // JSON.stringify(undefined) returns undefined despite its declared type.
              const body = JSON.stringify(entry.object, null, 4) as string | undefined;
              return { type: "text" as const, text: body ?? "(empty response body)" };
            }
            return { type: "text" as const, text: (entry as unknown as { type: "text"; text: string }).text };
          });

          // Flag upstream failures before anything else. Tools without an outputSchema
          // used to return here first, so their 4xx/5xx responses reached the caller with
          // no isError and read as successful calls.
          const mixedContent = handlerResult.content as Array<
            { type: "text"; text: string } | { type: "object"; object: unknown }
          >;
          const headersText = mixedContent.find(
            (entry): entry is { type: "text"; text: string } =>
              entry.type === "text" && /^Response Headers \(HTTP \d+\)/.test(entry.text),
          );
          const statusMatch = headersText?.text.match(/^Response Headers \(HTTP (\d+)\)/);
          const upstreamStatus = statusMatch ? parseInt(statusMatch[1], 10) : 200;

          const primary = handlerResult.content.find((entry) => entry.type === "object");
          const primaryBody = primary?.type === "object" ? primary.object : undefined;

          // Known decline/error codes get an appended guidance entry (declines arrive
          // as HTTP 2xx with status DECLINED, so this runs on both branches). The raw
          // response entry is never modified.
          const guidance = findGuidance(primaryBody);
          const enrichedContent = guidance ? [...content, { type: "text" as const, text: formatGuidance(guidance) }] : content;

          // A handler can fail without an upstream response to read a status from
          // (describeTool on an unknown name); this used to drop its isError on the floor.
          if (upstreamStatus >= 400 || handlerResult.isError === true) {
            return { content: enrichedContent, isError: true };
          }

          if (!tool.outputSchema) {
            return { content: enrichedContent };
          }

          // An empty body still owes the SDK a structuredContent; the partial top level
          // of every output schema accepts {}.
          const structuredContent = (primaryBody ?? {}) as Record<string, unknown>;

          return { content: enrichedContent, structuredContent };
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
  mode,
}: {
  accountCode: string;
  publicApiKey: string;
  privateSecretKey: string;
  /** "read-only" registers only retrieval tools (plus describeTool). Default "full". */
  mode?: ServerMode;
}) {
  try {
    const yunoClient = await YunoClient.initialize({
      accountCode,
      publicApiKey,
      privateSecretKey,
    });

    const yunoMCP = createYunoMCPServer(yunoClient, { mode });

    return {
      yunoMCP,
    };
  } catch (error) {
    // The cause has to reach the log. Callers only observe `undefined` (remote-yuno-mcp
    // turns that into a generic 500), so dropping the error here left initialization
    // failures — bad credentials, unreachable API — with no diagnosable trace anywhere.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n🚨  Error initializing Yuno MCP server: ${message}\n`);
    return undefined;
  }
}

export { initializeYunoMCP };
