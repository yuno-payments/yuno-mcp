/**
 * Shrinks the JSON Schema the MCP SDK emits for `tools/list`, without changing
 * what any schema accepts.
 *
 * Every client pays `tools/list` on connect before it can do any work. Three
 * habits of the zod → JSON Schema conversion carry no information:
 *
 * 1. Each of the 75 schema documents carries a `$schema` declaration. MCP already
 *    defines the dialect for `inputSchema`/`outputSchema`, so no client needs it.
 * 2. A collapsed `z.unknown().nullish()` (src/schemas/compact.ts) serializes as
 *    `{"anyOf":[{},{"type":"null"}]}`. The empty member already accepts null.
 * 3. A nullish nested in a nullish repeats the `{"type":"null"}` member.
 *
 * Every rewrite is semantics-preserving, which is the whole point: a client that
 * validates against the lean schema accepts and rejects exactly what it did
 * before (tests/lean-tools-list.test.ts checks this against every tool). Anything
 * that changes what is accepted belongs in compactSchema, not here.
 *
 * A nullable field keeps its long `anyOf: [X, {type: "null"}]` form on purpose.
 * The shorthand `type: [X, "null"]` is valid JSON Schema, but released versions of
 * @yuno-payments/agent-toolkit read `type` only as a string (jsonSchemaToZod in
 * shared/schema-utils.ts), so every such field would become `z.unknown()` there.
 * remote-yuno-mcp picks up this package without a toolkit release, so the output
 * must stay readable by the toolkits already in use.
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

/**
 * Drops a `{type: "null"}` member that says nothing: next to an empty member, which
 * accepts anything, or next to a member that is itself `anyOf: [Y, null]`. Any
 * other nullable union is returned unchanged.
 */
function simplifyNullableUnion(node: JsonSchemaNode): JsonSchemaNode {
  const other = nullableMember(node);
  if (!other) return node;

  // `rest` wins over `other`: a description or title sitting on the union itself
  // is the more specific one, and dropping it would lose documentation.
  const rest: JsonSchemaNode = { ...node };
  delete rest.anyOf;

  // An empty member accepts anything, null included, so the union says nothing.
  // These come from a collapsed `z.unknown()` (src/schemas/compact.ts).
  if (Object.keys(other).length === 0) return rest;

  // Already nullable one level down — the tool schemas nest nullish inside nullish
  // in a few places, and compactSchema preserves both wrappers. Only the bare
  // `anyOf` is hoisted: keywords beside it would merge into the outer node.
  const inner = nullableMember(other);
  if (inner && Object.keys(other).every((key) => key === "anyOf" || key === "description")) {
    return { ...other, ...rest };
  }

  return node;
}

/**
 * Leans only the schema fields of a `tools/list` result: each tool's `inputSchema`
 * and `outputSchema`. Everything else in the envelope — names, titles,
 * descriptions, annotations, `_meta`, pagination — passes through untouched.
 *
 * leanJsonSchema is only correct on JSON Schema documents. Applied to the whole
 * envelope it would also strip any `$schema` key and fold any null-union it found
 * in fields that are not schemas, which is harmless today and a silent rewrite the
 * day one of them happens to take that shape.
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

/** Recursively applies every rewrite. Returns a new structure; the input is untouched. */
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
