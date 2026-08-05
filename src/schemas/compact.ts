import z from "zod";

/**
 * Depth-limited compaction of zod schemas for MCP tool registration.
 *
 * The full schemas serialize to ~500KB of tools/list payload, which burns client
 * context before the first tool call. Registration therefore advertises a compacted
 * schema — top-level structure kept, deep subtrees collapsed to permissive records —
 * while the handler keeps validating against the original strict schema, and the
 * `describeTool` tool serves the full schema on demand.
 *
 * Every collapsed level must stay permissive in BOTH directions:
 * - inputs: the SDK validates arguments against the registered schema before the
 *   handler runs, so a collapsed subtree must accept anything the strict schema does;
 * - outputs: the SDK validates `structuredContent` (the raw upstream response,
 *   passed through unmodified) against the registered output schema, so a schema
 *   stricter than a real response turns a successful call into an McpError.
 */

type CompactOptions = {
  /** Object/array nesting depth beyond which subtrees collapse. Root is depth 0. */
  maxDepth: number;
  /** Property names whose subtrees collapse regardless of depth. */
  heavyKeys?: readonly string[];
  /**
   * Apply `.partial()` to the root object. Output schemas need this: raw upstream
   * responses vary by provider and omit fields freely, and the destructive-op
   * confirmation preview (src/confirm.ts) returns a structuredContent shape of its
   * own that must also pass output validation. Do not remove one without the other.
   */
  partialTopLevel?: boolean;
};

const DESCRIBE_HINT = "Call describeTool with this tool's name for the full field list.";

function collapsedDescription(schema: z.ZodType): string {
  const own = schema.description;
  return own ? `${own}. ${DESCRIBE_HINT}` : DESCRIBE_HINT;
}

function withDescription<T extends z.ZodType>(rebuilt: T, original: z.ZodType): T {
  return original.description ? rebuilt.describe(original.description) : rebuilt;
}

function walk(schema: z.ZodType, options: CompactOptions, depth: number): z.ZodType {
  // Wrappers are preserved so a collapsed `airline.nullish()` still accepts null
  // from raw responses — output validation depends on it.
  if (schema instanceof z.ZodOptional) {
    return walk(schema.unwrap() as z.ZodType, options, depth).optional();
  }
  if (schema instanceof z.ZodNullable) {
    return walk(schema.unwrap() as z.ZodType, options, depth).nullable();
  }
  if (schema instanceof z.ZodArray) {
    if (depth >= options.maxDepth) {
      return z.array(z.unknown()).describe(collapsedDescription(schema));
    }
    return withDescription(z.array(walk(schema.element as z.ZodType, options, depth + 1)), schema);
  }
  if (schema instanceof z.ZodUnion) {
    if (depth >= options.maxDepth) {
      return z.unknown().describe(collapsedDescription(schema));
    }
    const members = (schema.options as z.ZodType[]).map((option) => walk(option, options, depth + 1));
    return withDescription(z.union(members as [z.ZodType, z.ZodType, ...z.ZodType[]]), schema);
  }
  if (schema instanceof z.ZodObject) {
    if (depth >= options.maxDepth) {
      return z.record(z.string(), z.unknown()).describe(collapsedDescription(schema));
    }
    const shape: Record<string, z.ZodType> = {};
    for (const [key, value] of Object.entries(schema.shape as Record<string, z.ZodType>)) {
      const childDepth = options.heavyKeys?.includes(key) ? options.maxDepth : depth + 1;
      shape[key] = walk(value, options, childDepth);
    }
    // Rebuilding drops .refine() checks — intended: cross-field rules are enforced
    // by the strict schema in the handler, not at registration.
    return withDescription(z.object(shape).catchall(z.unknown()), schema);
  }
  return schema;
}

export const HEAVY_KEYS = ["additional_data"] as const;

export function compactSchema(schema: z.ZodObject<z.ZodRawShape>, options: CompactOptions): z.ZodObject<z.ZodRawShape> {
  const compacted = walk(schema, options, 0) as z.ZodObject<z.ZodRawShape>;
  return options.partialTopLevel ? compacted.partial().catchall(z.unknown()) : compacted;
}
