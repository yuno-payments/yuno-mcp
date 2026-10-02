import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless two-phase confirmation for destructive tools on production keys.
 *
 * First call returns a preview plus an HMAC token over (method, params, expiry) and,
 * for account-scoped tools, the account the call will be sent with;
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

/**
 * The account an account-scoped call will be sent with. The default account is
 * resolved per connection, so the arguments alone do not fix it: binding it means a
 * preview taken under one account cannot be confirmed under another. `account` is
 * null when no account_id will be sent.
 */
type AccountBinding = { account: unknown };

/** What a token is issued for: the tool, its validated arguments and, for account-scoped tools, the account. */
type TokenSubject = { method: string; params: unknown; binding?: AccountBinding };

function signature(secret: string, { method, params, binding }: TokenSubject, expiresAt: number): string {
  const accountLine = binding ? `\n${canonicalJson(binding.account)}` : "";
  return createHmac("sha256", secret)
    .update(`${method}\n${String(expiresAt)}\n${canonicalJson(params)}${accountLine}`)
    .digest("hex");
}

/** Lets a refusal say the account changed, without putting the account id in the token. */
function accountTag(secret: string, binding: AccountBinding): string {
  return createHmac("sha256", secret)
    .update(`account\n${canonicalJson(binding.account)}`)
    .digest("hex")
    .slice(0, 16);
}

export function issueConfirmToken(secret: string, subject: TokenSubject, ttlMs: number = DEFAULT_TTL_MS): string {
  const expiresAt = Date.now() + ttlMs;
  const token = `${String(expiresAt)}.${signature(secret, subject, expiresAt)}`;
  return subject.binding ? `${token}.${accountTag(secret, subject.binding)}` : token;
}

export function verifyConfirmToken(secret: string, subject: TokenSubject, token: string): boolean {
  // expiry.mac, plus .tag when the token is bound to an account.
  const parts = token.split(".");
  const [expiry, mac] = parts;
  if (parts.length !== (subject.binding ? 3 : 2) || !expiry || !mac) {
    return false;
  }
  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }
  const expected = Buffer.from(signature(secret, subject, expiresAt), "hex");
  const given = Buffer.from(mac, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * True when an account-bound token was issued for a different account than
 * `binding`. Only picks the refusal message; verifyConfirmToken decides.
 */
export function confirmTokenAccountChanged(secret: string, token: string, binding: AccountBinding): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts[2] !== accountTag(secret, binding);
}
