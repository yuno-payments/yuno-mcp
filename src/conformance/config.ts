/**
 * Configuration and safety guardrails for the MCP conformance runner, applied
 * before any network call. The endpoint defaults to staging, and production is
 * refused by allowlist rather than denylist: the endpoint host must be explicitly
 * marked non-production and the public-api-key must carry a non-production
 * prefix, unless CONFORMANCE_ALLOW_PROD=true is set deliberately.
 */

export const DEFAULT_ENDPOINT = "https://api-staging.y.uno/mcp";

export const NON_PROD_KEY_PREFIXES = ["dev_", "staging_", "sandbox_"] as const;

const NON_PROD_HOST_LABEL = /(^|[.-])(dev|staging|stg|sandbox|sb)([.-]|$)/i;

export type ConformanceConfig = {
  endpoint: string;
  publicApiKey: string;
  privateSecretKey: string;
  accountCode: string;
  allowProd: boolean;
};

export class ConfigError extends Error {}

const truthy = (value: string | undefined): boolean => value === "1" || value?.toLowerCase() === "true";

export function isNonProdHost(endpoint: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(endpoint).hostname;
  } catch {
    return false;
  }
  return NON_PROD_HOST_LABEL.test(hostname);
}

export const isNonProdKey = (publicApiKey: string): boolean => NON_PROD_KEY_PREFIXES.some((prefix) => publicApiKey.startsWith(prefix));

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

  if (!/^https:\/\//i.test(endpoint)) {
    throw new ConfigError(`Refusing insecure endpoint ${endpoint}: MCP conformance must run over HTTPS (PCI-DSS req 4.1).`);
  }

  if (!allowProd && (!isNonProdKey(publicApiKey) || !isNonProdHost(endpoint))) {
    throw new ConfigError(
      `Refusing to run: only non-production targets are allowed by default. The public-api-key must start with ${NON_PROD_KEY_PREFIXES.join(", ")} ` +
        "and the endpoint host must be marked dev, staging, stg, sandbox or sb. Set CONFORMANCE_ALLOW_PROD=true to override deliberately.",
    );
  }

  return { endpoint, publicApiKey, privateSecretKey, accountCode, allowProd };
}
