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

const sameHex = (a: string, b: string): boolean => a.length === b.length && timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));

/** expiry.mac, plus .tag when the token is bound to an account; undefined when malformed. */
function parseToken(token: string): { expiresAt: number; mac: string; tag?: string } | undefined {
  const match = /^(\d{1,16})\.([0-9a-f]{64})(?:\.([0-9a-f]{16}))?$/.exec(token);
  return match ? { expiresAt: Number(match[1]), mac: match[2], tag: match[3] } : undefined;
}

export function verifyConfirmToken(secret: string, subject: TokenSubject, token: string): boolean {
  const parsed = parseToken(token);
  if (!parsed || Date.now() > parsed.expiresAt) {
    return false;
  }
  const { binding } = subject;
  // A bound token never verifies without its binding, nor an unbound one with one.
  if (binding ? parsed.tag === undefined || !sameHex(parsed.tag, accountTag(secret, binding)) : parsed.tag !== undefined) {
    return false;
  }
  return sameHex(parsed.mac, signature(secret, subject, parsed.expiresAt));
}

/**
 * True only for a well-formed account-bound token whose account differs from
 * `binding`. It picks the refusal message after verifyConfirmToken has refused.
 */
export function confirmTokenAccountChanged(secret: string, token: string, binding: AccountBinding): boolean {
  const tag = parseToken(token)?.tag;
  return tag !== undefined && !sameHex(tag, accountTag(secret, binding));
}
