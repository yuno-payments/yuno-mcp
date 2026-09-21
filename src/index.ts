import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { YunoClient } from "./client";
import { tools } from "./tools";
import { describeTool } from "./tools/describe";
import { compactSchema, HEAVY_KEYS } from "./schemas/compact";
import { leanToolsListResult } from "./schemas/lean-json-schema";
import { issueConfirmToken, verifyConfirmToken } from "./confirm";
import { findGuidance, formatGuidance } from "./knowledge/decline-codes";
import { Tool } from "./types";

type ServerMode = "read-only" | "full";

/**
 * Said once per tool instead of once per collapsed subtree (see
 * src/schemas/compact.ts). Deep fields are advertised as permissive records, so a
 * client needs to know where the real shape lives — but it only needs telling once.
 */
const COMPACTED_SCHEMA_HINT = "Deep fields are abbreviated here; call describeTool for the full schema.";

type CreateOptions = {
  /** "read-only" registers only retrieval tools (plus describeTool). Default "full". */
  mode?: ServerMode;
};

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

    server.registerTool(
      tool.method,
      {
        title: tool.annotations.title,
        description: `${tool.description} ${COMPACTED_SCHEMA_HINT}`,
        inputSchema: inputSchemaShape,
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
              return { type: "text" as const, text: JSON.stringify(entry.object, null, 4) };
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

          if (upstreamStatus >= 400) {
            return { content: enrichedContent, isError: true };
          }

          if (!tool.outputSchema) {
            return { content: enrichedContent };
          }

          const structuredContent = primary?.type === "object" ? (primary.object as Record<string, unknown>) : {};

          return { content: enrichedContent, structuredContent };
        } catch (error) {
          const text = error instanceof Error ? error.message : "An unknown error occurred";
          return { content: [{ type: "text" as const, text }], isError: true };
        }
      },
    );
  }

  applyLeanToolsList(server);

  return server;
}

/**
 * Rewrites the schema fields of the `tools/list` response through
 * leanToolsListResult (src/schemas/lean-json-schema.ts), which strips `$schema` and folds
 * `anyOf: [X, null]` into `type: [X, "null"]` — 17% of the payload, with no
 * change to what any schema accepts.
 *
 * The SDK converts zod to JSON Schema inside its own `tools/list` handler, so
 * there is no conversion hook to pass this to: the only seam is the handler
 * itself. We take the one McpServer registered, and register a wrapper that
 * defers to it and leans the result. `setRequestHandler` overwrites silently,
 * so nothing is lost — but reading `_requestHandlers` reaches past the SDK's
 * public surface, so tests/lean-tools-list.test.ts asserts the rewrite really
 * reaches a live `tools/list`. If a future SDK moves this, that test fails
 * loudly instead of the payload quietly growing back.
 */
function applyLeanToolsList(server: McpServer): void {
  const protocol = server.server as unknown as {
    _requestHandlers: Map<string, (request: unknown, extra: unknown) => Promise<unknown>>;
  };
  const registered = protocol._requestHandlers.get("tools/list");
  if (!registered) {
    // Better a full-size tool list than a server that cannot list its tools.
    console.error("🚨  Yuno MCP: no tools/list handler to wrap; serving unabbreviated schemas");
    return;
  }
  protocol._requestHandlers.set("tools/list", async (request, extra) => leanToolsListResult(await registered(request, extra)));
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
