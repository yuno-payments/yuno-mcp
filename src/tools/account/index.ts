import z from "zod";
import type { HandlerContext, Output, Tool } from "../../types";

/**
 * An account id is written into model-visible prose (instructions, notes, the
 * confirm preview) as is only when it has this shape. It can come from a client
 * header, so anything else is written as a JSON string literal or left out.
 */
export const SAFE_ACCOUNT_ID = /^[A-Za-z0-9-]{1,64}$/;

/** An account id as prose: id-shaped values as is, anything else as JSON, which escapes newlines and quotes. */
export const accountForProse = (account: unknown): string =>
  typeof account === "string" && SAFE_ACCOUNT_ID.test(account) ? account : JSON.stringify(account);

/** Sees through the wrappers that keep a value's shape: optional, nullable, default, readonly, catch, pipe input. */
function unwrap(schema: unknown): unknown {
  let current = schema;
  for (let depth = 0; depth < 16 && current instanceof z.ZodType; depth++) {
    const def = current._zod.def as { type: string; innerType?: unknown; in?: unknown };
    const next = def.innerType ?? (def.type === "pipe" ? def.in : undefined);
    if (next === undefined) return current;
    current = next;
  }
  return current;
}

const accountIdPaths = new WeakMap<object, string[] | null>();

/**
 * Where a tool takes `account_id`, through nested objects and value-preserving
 * wrappers: ["account_id"] for checkoutSessionCreate, ["payment", "account_id"] for
 * paymentCreate. The shallowest match wins. Undefined for tools that are not
 * account-scoped. Computed once per schema.
 */
export function accountIdPath(schema: { shape: Record<string, unknown> }): string[] | undefined {
  const cached = accountIdPaths.get(schema);
  if (cached !== undefined) return cached ?? undefined;
  let found: string[] | null = null;
  // Breadth-first, so the shallowest account_id wins.
  const queue: [Record<string, unknown>, string[]][] = [[schema.shape, []]];
  for (const [shape, path] of queue) {
    if ("account_id" in shape) {
      found = [...path, "account_id"];
      break;
    }
    for (const [key, value] of Object.entries(shape)) {
      const inner = unwrap(value);
      if (inner instanceof z.ZodObject && path.length < 8) queue.push([inner.shape as Record<string, unknown>, [...path, key]]);
    }
  }
  accountIdPaths.set(schema, found);
  return found ?? undefined;
}

/**
 * Names the account a request was sent with and where it came from. Mirrors the
 * handlers' `account_id || yunoClient.accountCode`, so a falsy value counts as not
 * passed. `defaultAccountId` is undefined for tools that do not apply the default.
 */
export function sentAccountPhrase(passed: unknown, defaultAccountId: string | undefined): string {
  if (passed) return `account_id ${accountForProse(passed)} (passed in the call)`;
  if (defaultAccountId) return `account_id ${accountForProse(defaultAccountId)} (the default account; none was passed in the call)`;
  return "no account_id (none was passed in the call, and this tool does not apply the default account)";
}

/**
 * The default account is otherwise silent: no API response names it. Composed in
 * src/index.ts from the tools registered for the connection's mode, so read-only
 * mode never lists a tool it does not serve.
 */
export function createAccountContextTool(apiTools: readonly Tool[]) {
  // Where each tool takes account_id: a top-level account_id on paymentCreate is an
  // unknown parameter, so the name alone is not enough to use it.
  const toolsAcceptingAccountId: Record<string, string> = {};
  for (const tool of apiTools) {
    const path = accountIdPath(tool.schema);
    if (path) toolsAcceptingAccountId[tool.method] = path.join(".");
  }

  return {
    method: "accountContext",
    description:
      "Return the default Yuno account_id this connection uses, its environment, and the tools that accept account_id (with where the parameter goes) to run under another account of the organization. No API call.",
    annotations: { openWorldHint: false, title: "Account Context", readOnlyHint: true, destructiveHint: false },
    schema: z.object({}),
    handler:
      <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
      (): Promise<Output<TType>> => {
        const context = {
          account_id: yunoClient.accountCode,
          environment: yunoClient.environment ?? "unrecognized",
          tools_accepting_account_id: toolsAcceptingAccountId,
        };

        if (type === "text") {
          return Promise.resolve({ content: [{ type: "text" as const, text: JSON.stringify(context, null, 4) }] } as Output<TType>);
        }

        return Promise.resolve({ content: [{ type: "object" as const, object: context }] } as Output<TType>);
      },
  } as const satisfies Tool;
}
