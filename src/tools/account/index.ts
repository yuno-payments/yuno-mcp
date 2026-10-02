import z from "zod";
import type { HandlerContext, Output, Tool } from "../../types";

const unwrapOptional = (schema: unknown): unknown =>
  schema instanceof z.ZodOptional || schema instanceof z.ZodNullable ? unwrapOptional(schema.unwrap()) : schema;

/**
 * Where a tool takes `account_id`: at the top level (checkoutSessionCreate) or one
 * object down (paymentCreate's payment.account_id). Undefined for tools that are
 * not account-scoped.
 */
export function accountIdPath(schema: { shape: Record<string, unknown> }): string[] | undefined {
  if ("account_id" in schema.shape) return ["account_id"];
  for (const [key, value] of Object.entries(schema.shape)) {
    const inner = unwrapOptional(value);
    if (inner instanceof z.ZodObject && "account_id" in inner.shape) return [key, "account_id"];
  }
  return undefined;
}

/**
 * Names the account a request was sent with and where it came from. Mirrors the
 * handlers' `account_id || yunoClient.accountCode`, so a falsy value counts as not
 * passed. `defaultAccountId` is undefined for tools that do not apply the default.
 */
export function sentAccountPhrase(passed: unknown, defaultAccountId: string | undefined): string {
  if (passed) return `account_id ${typeof passed === "string" ? passed : JSON.stringify(passed)} (passed in the call)`;
  if (defaultAccountId) return `account_id ${defaultAccountId} (the default account; none was passed in the call)`;
  return "no account_id (none was passed in the call, and this tool does not apply the default account)";
}

/**
 * The default account is otherwise silent: no API response names it. Composed from
 * the API tools in src/tools/index.ts, since importing that list here would be a cycle.
 */
export function createAccountContextTool(apiTools: readonly Tool[]) {
  const toolsAcceptingAccountId = apiTools.filter((tool) => accountIdPath(tool.schema)).map((tool) => tool.method);

  return {
    method: "accountContext",
    description:
      "Return the default Yuno account_id this connection uses, its environment, and the tools that accept account_id to run under another account of the organization. No API call.",
    annotations: { openWorldHint: false, title: "Account Context", readOnlyHint: true, destructiveHint: false },
    schema: z.object({}),
    handler:
      <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
      (): Promise<Output<TType>> => {
        const context = {
          account_id: yunoClient.accountCode,
          environment: yunoClient.environment,
          tools_accepting_account_id: toolsAcceptingAccountId,
        };

        if (type === "text") {
          return Promise.resolve({ content: [{ type: "text" as const, text: JSON.stringify(context, null, 4) }] } as Output<TType>);
        }

        return Promise.resolve({ content: [{ type: "object" as const, object: context }] } as Output<TType>);
      },
  } as const satisfies Tool;
}
