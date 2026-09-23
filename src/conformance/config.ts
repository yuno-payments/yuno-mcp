/**
 * Configuration and safety guardrails for the MCP conformance runner.
 *
 * The runner connects to a *deployed* MCP endpoint as a real client and makes
 * only read-only assertions. Two guardrails live here, before any network call:
 *
 * - it defaults to a non-production endpoint, so a bare invocation never points
 *   at production by accident;
 * - it refuses production credentials unless CONFORMANCE_ALLOW_PROD is set,
 *   because a `prod_` public-api-key routes tool calls at real merchants.
 */

/** A public-api-key beginning with this prefix selects the Yuno prod environment. */
const PROD_KEY_PREFIX = "prod_";

/** Default endpoint: staging, never production. */
export const DEFAULT_ENDPOINT = "https://api-staging.y.uno/mcp";

export type ConformanceConfig = {
  endpoint: string;
  publicApiKey: string;
  privateSecretKey: string;
  accountCode: string;
  allowProd: boolean;
};

export class ConfigError extends Error {}

const truthy = (value: string | undefined): boolean => value === "1" || value?.toLowerCase() === "true";

/**
 * Resolves the runner configuration from an environment map (defaults to
 * process.env). Throws ConfigError with an operator-facing message when a
 * required value is missing or when production credentials are supplied without
 * the explicit opt-in.
 */
export function resolveConfig(env: NodeJS.ProcessEnv = process.env): ConformanceConfig {
  const publicApiKey = env.YUNO_PUBLIC_API_KEY?.trim();
  const privateSecretKey = env.YUNO_PRIVATE_SECRET_KEY?.trim();
  const accountCode = env.YUNO_ACCOUNT_CODE?.trim();
  const endpoint = env.YUNO_MCP_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
  const allowProd = truthy(env.CONFORMANCE_ALLOW_PROD);

  const missing = [
    !publicApiKey && "YUNO_PUBLIC_API_KEY",
    !privateSecretKey && "YUNO_PRIVATE_SECRET_KEY",
    !accountCode && "YUNO_ACCOUNT_CODE",
  ].filter((value): value is string => typeof value === "string");
  if (!publicApiKey || !privateSecretKey || !accountCode) {
    throw new ConfigError(`Missing required environment variable(s): ${missing.join(", ")}.`);
  }

  const isProdKey = publicApiKey.startsWith(PROD_KEY_PREFIX);
  const isProdEndpoint = /^https:\/\/api\.y\.uno(\/|$)/i.test(endpoint);
  if ((isProdKey || isProdEndpoint) && !allowProd) {
    throw new ConfigError(
      "Refusing to run against production. A prod_ public-api-key or the https://api.y.uno endpoint was supplied. " +
        "Conformance is read-only, but it makes tools/call probes against a live server; point it at staging/sandbox, " +
        "or set CONFORMANCE_ALLOW_PROD=true to override deliberately.",
    );
  }

  return {
    endpoint,
    publicApiKey,
    privateSecretKey,
    accountCode,
    allowProd,
  };
}
