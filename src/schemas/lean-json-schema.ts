/**
 * Shrinks the JSON Schema the MCP SDK emits for `tools/list`, without changing
 * what any schema accepts.
 *
 * Every client pays `tools/list` on connect before it can do any work, and two
 * purely cosmetic habits of the zod → JSON Schema conversion account for 17% of
 * a 152 KB payload:
 *
 * 1. `.nullish()` serializes as `{"anyOf":[{"type":"string"},{"type":"null"}]}`.
 *    JSON Schema's own shorthand for that is `{"type":["string","null"]}` — the
 *    same constraint, 26 fewer bytes. The tool schemas mark almost every optional
 *    field nullish, so this pattern appears 1,177 times (~30 KB).
 * 2. Each of the 75 schema documents carries a `$schema` declaration. MCP already
 *    defines the dialect for `inputSchema`/`outputSchema`, so no client needs it.
 *
 * Both rewrites are semantics-preserving, which is the whole point: a client that
 * validates against the lean schema accepts and rejects exactly what it did
 * before. Anything that changes what is accepted belongs in compactSchema
 * (src/schemas/compact.ts), not here.
 */

type JsonSchemaNode = Record<string, unknown>;

const isNullMember = (member: unknown): boolean =>
  typeof member === "object" && member !== null && Object.keys(member).length === 1 && (member as JsonSchemaNode).type === "null";

/**
 * `anyOf: [X, {type: "null"}]` → `{...X, type: [X.type, "null"]}`.
 *
 * Only folds when the non-null member is a plain typed schema. A member carrying
 * its own `anyOf`, `enum` or `$ref` keeps the long form, because hoisting its
 * keywords next to a `type` array would change what the schema means.
 */
function foldNullableUnion(node: JsonSchemaNode): JsonSchemaNode {
  const members = node.anyOf;
  if (!Array.isArray(members) || members.length !== 2) return node;

  const nullIndex = members.findIndex(isNullMember);
  if (nullIndex === -1) return node;

  const other = members[1 - nullIndex] as JsonSchemaNode | undefined;
  if (!other || typeof other !== "object" || Array.isArray(other)) return node;
  if ("anyOf" in other || "oneOf" in other || "allOf" in other || "$ref" in other) return node;

  // `rest` wins over `other`: a description or title sitting on the union itself
  // is the more specific one, and dropping it would lose documentation.
  const rest: JsonSchemaNode = { ...node };
  delete rest.anyOf;

  // An empty member accepts anything, null included, so the union says nothing.
  // These come from a collapsed `z.unknown()` (src/schemas/compact.ts).
  if (Object.keys(other).length === 0) return rest;

  // Already nullable one level down — the tool schemas nest nullish inside nullish
  // in a few places, and compactSchema preserves both wrappers. The outer null
  // member is then redundant.
  if (Array.isArray(other.type) && other.type.includes("null")) return { ...other, ...rest };

  if (typeof other.type !== "string") return node;
  return { ...other, ...rest, type: [other.type, "null"] };
}

/** Recursively applies both rewrites. Returns a new structure; the input is untouched. */
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
  return foldNullableUnion(out) as unknown as T;
}
