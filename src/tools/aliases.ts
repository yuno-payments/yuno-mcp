import type { z } from "zod";

const toSnake = (key: string): string => key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (key: string): string => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const twinOf = (key: string): string | undefined => [toSnake(key), toCamel(key)].find((t) => t !== key);

/**
 * The MCP SDK validates the registered shape before the handler runs, so a twin
 * spelling has to be advertised there or the call is rejected before
 * normalizeParamKeys can help. The declared key goes optional only in the
 * advertised shape; the strict tool schema still requires it after normalization.
 */
export function withTwinKeys(shape: z.ZodRawShape): z.ZodRawShape {
  const out: Record<string, z.core.$ZodType> = { ...shape };
  for (const [key, field] of Object.entries(shape)) {
    const twin = twinOf(key);
    if (twin === undefined || twin in shape) continue;
    const declared = field as z.ZodType;
    out[key] = declared.optional();
    out[twin] = declared.optional().describe(`Alias of ${key}`);
  }
  return out;
}

/**
 * Fills a declared top-level key from its snake_case / camelCase twin when the
 * caller used the other spelling. The tools were written against the API's
 * snake_case in some places and camelCase in others, and a model that guesses
 * wrong burns a call to find out. Declared keys always win; nothing is renamed
 * below the top level, and unknown keys pass through untouched. The twin is
 * always dropped: top-level params double as the request body on several tools.
 */
export function normalizeParamKeys(schema: { shape: Record<string, unknown> }, params: unknown): unknown {
  if (params === null || typeof params !== "object" || Array.isArray(params)) return params;
  const input = params as Record<string, unknown>;
  let out: Record<string, unknown> = { ...input };
  for (const key of Object.keys(schema.shape)) {
    const twin = twinOf(key);
    if (twin === undefined || !(twin in out)) continue;
    const { [twin]: twinValue, ...rest } = out;
    out = key in rest ? rest : { ...rest, [key]: twinValue };
  }
  return out;
}
