/**
 * Shrinks the JSON Schema the MCP SDK emits for `tools/list` without changing what
 * any schema accepts: drops `$schema`, and drops a `{type: "null"}` member that
 * adds nothing. tests/lean-tools-list.test.ts checks every tool accepts the same
 * values as before; anything that changes that belongs in compactSchema.
 *
 * Nullable fields keep the long `anyOf: [X, {type: "null"}]` form: released
 * @yuno-payments/agent-toolkit versions read `type` only as a string, so the
 * `type: [X, "null"]` shorthand would turn those fields into `z.unknown()` there.
 */

type JsonSchemaNode = Record<string, unknown>;

const isNullMember = (member: unknown): boolean =>
  typeof member === "object" && member !== null && Object.keys(member).length === 1 && (member as JsonSchemaNode).type === "null";

/** `anyOf: [X, {type: "null"}]`, in either order, with X returned. */
function nullableMember(node: JsonSchemaNode): JsonSchemaNode | undefined {
  const members = node.anyOf;
  if (!Array.isArray(members) || members.length !== 2) return undefined;
  const nullIndex = members.findIndex(isNullMember);
  if (nullIndex === -1) return undefined;
  const other = members[1 - nullIndex] as unknown;
  if (!other || typeof other !== "object" || Array.isArray(other)) return undefined;
  return other as JsonSchemaNode;
}

/** Drops a `{type: "null"}` member next to an empty member or an already nullable one. */
function simplifyNullableUnion(node: JsonSchemaNode): JsonSchemaNode {
  const other = nullableMember(node);
  if (!other) return node;

  // Keywords on the union itself win: dropping them would lose documentation.
  const rest: JsonSchemaNode = { ...node };
  delete rest.anyOf;

  // An empty member (a collapsed `z.unknown()`) already accepts null.
  if (Object.keys(other).length === 0) return rest;

  // Already nullable one level down (nullish inside nullish). Only a bare `anyOf`
  // is hoisted: keywords beside it would merge into the outer node.
  const inner = nullableMember(other);
  if (inner && Object.keys(other).every((key) => key === "anyOf" || key === "description")) {
    return { ...other, ...rest };
  }

  return node;
}

/**
 * Leans each tool's `inputSchema` and `outputSchema` only; the rest of the envelope
 * passes through. leanJsonSchema is correct on JSON Schema documents alone.
 */
export function leanToolsListResult<T>(result: T): T {
  if (!result || typeof result !== "object") return result;
  const envelope = result as Record<string, unknown>;
  if (!Array.isArray(envelope.tools)) return result;
  const tools: unknown[] = envelope.tools;
  return {
    ...envelope,
    tools: tools.map((tool) => {
      if (!tool || typeof tool !== "object") return tool;
      const { inputSchema, outputSchema, ...rest } = tool as Record<string, unknown>;
      return {
        ...rest,
        ...(inputSchema !== undefined && { inputSchema: leanJsonSchema(inputSchema) }),
        ...(outputSchema !== undefined && { outputSchema: leanJsonSchema(outputSchema) }),
      };
    }),
  } as T;
}

/** Applies every rewrite recursively. The input is untouched. */
export function leanJsonSchema<T>(node: T): T {
  if (Array.isArray(node)) {
    const items: unknown[] = node;
    return items.map((item) => leanJsonSchema(item)) as unknown as T;
  }
  if (node === null || typeof node !== "object") return node;

  const out: JsonSchemaNode = {};
  for (const [key, value] of Object.entries(node as JsonSchemaNode)) {
    if (key === "$schema") continue;
    out[key] = leanJsonSchema(value);
  }
  return simplifyNullableUnion(out) as unknown as T;
}
