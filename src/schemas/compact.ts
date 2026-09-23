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
  /** Called once per subtree that is collapsed, i.e. whenever the result abbreviates the schema. */
  onCollapse?: () => void;
};

function withDescription<T extends z.ZodType>(rebuilt: T, original: z.ZodType): T {
  return original.description ? rebuilt.describe(original.description) : rebuilt;
}

/**
 * A collapsed subtree keeps its own description and nothing more.
 *
 * This used to append "Call describeTool with this tool's name for the full field
 * list." to every collapsed node — 141 copies across the tool list, 9,024 bytes of
 * a 152 KB `tools/list`, repeating one fact a client only needs once. The pointer
 * to describeTool now lives once per tool, in COMPACTED_SCHEMA_HINT (src/index.ts),
 * and only on tools where `onCollapse` fired.
 */
function collapsed<T extends z.ZodType>(rebuilt: T, original: z.ZodType, options: CompactOptions): T {
  options.onCollapse?.();
  return withDescription(rebuilt, original);
}

function walk(schema: z.ZodType, options: CompactOptions, depth: number): z.ZodType {
  // Wrappers are preserved so a collapsed `airline.nullish()` still accepts null
  // from raw responses — output validation depends on it. So is their description:
  // `.nullish().describe(...)` puts it on the wrapper, not on the inner type.
  if (schema instanceof z.ZodOptional) {
    return withDescription(walk(schema.unwrap() as z.ZodType, options, depth).optional(), schema);
  }
  if (schema instanceof z.ZodNullable) {
    return withDescription(walk(schema.unwrap() as z.ZodType, options, depth).nullable(), schema);
  }
  if (schema instanceof z.ZodArray) {
    if (depth >= options.maxDepth) {
      return collapsed(z.array(z.unknown()), schema, options);
    }
    return withDescription(z.array(walk(schema.element as z.ZodType, options, depth + 1)), schema);
  }
  if (schema instanceof z.ZodUnion) {
    if (depth >= options.maxDepth) {
      return collapsed(z.unknown(), schema, options);
    }
    const members = (schema.options as z.ZodType[]).map((option) => walk(option, options, depth + 1));
    return withDescription(z.union(members as [z.ZodType, z.ZodType, ...z.ZodType[]]), schema);
  }
  if (schema instanceof z.ZodObject) {
    if (depth >= options.maxDepth) {
      return collapsed(z.record(z.string(), z.unknown()), schema, options);
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
