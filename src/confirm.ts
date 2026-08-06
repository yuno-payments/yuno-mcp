import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless two-phase confirmation for destructive tools on production keys.
 *
 * First call returns a preview plus an HMAC token over (method, params, expiry);
 * echoing the token executes. The token is self-verifying — keyed off the merchant's
 * private secret, so it works across replicas of the stateless remote server with
 * no stored state, and a token issued for one merchant/method/arguments never
 * validates for another.
 */

const DEFAULT_TTL_MS = 5 * 60_000;

/**
 * Deterministic serialization: object keys sorted at every level, undefined-valued
 * keys dropped (matching JSON.stringify). Both the issuing and the confirming call
 * canonicalize the strict-parse output, so key order in the client request is
 * irrelevant.
 */
export function canonicalJson(value: unknown): string {
  if (value === undefined || value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function signature(secret: string, method: string, params: unknown, expiresAt: number): string {
  return createHmac("sha256", secret).update(`${method}\n${String(expiresAt)}\n${canonicalJson(params)}`).digest("hex");
}

export function issueConfirmToken(secret: string, method: string, params: unknown, ttlMs: number = DEFAULT_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs;
  return `${String(expiresAt)}.${signature(secret, method, params, expiresAt)}`;
}

export function verifyConfirmToken(secret: string, method: string, params: unknown, token: string): boolean {
  const separator = token.indexOf(".");
  if (separator < 1) {
    return false;
  }
  const expiresAt = Number(token.slice(0, separator));
  const mac = token.slice(separator + 1);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt || mac.length === 0) {
    return false;
  }
  const expected = Buffer.from(signature(secret, method, params, expiresAt), "hex");
  const given = Buffer.from(mac, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
