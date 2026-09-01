const toSnake = (key: string): string => key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
const toCamel = (key: string): string => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/**
 * Fills a declared top-level key from its snake_case / camelCase twin when the
 * caller used the other spelling. The tools were written against the API's
 * snake_case in some places and camelCase in others, and a model that guesses
 * wrong burns a call to find out. Declared keys always win; nothing is renamed
 * below the top level, and unknown keys pass through untouched.
 */
export function normalizeParamKeys(schema: { shape: Record<string, unknown> }, params: unknown): unknown {
  if (params === null || typeof params !== "object" || Array.isArray(params)) return params;
  const input = params as Record<string, unknown>;
  let out: Record<string, unknown> = { ...input };
  for (const key of Object.keys(schema.shape)) {
    if (key in out) continue;
    const twin = [toSnake(key), toCamel(key)].find((t) => t !== key && t in out);
    if (twin === undefined) continue;
    out = { ...Object.fromEntries(Object.entries(out).filter(([k]) => k !== twin)), [key]: out[twin] };
  }
  return out;
}
