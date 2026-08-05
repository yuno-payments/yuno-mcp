/**
 * Client-side knowledge table: decline/error codes → actionable guidance.
 *
 * Appended as a SEPARATE content entry next to the raw response — the raw backend
 * payload is never modified (see CLAUDE.md: schemas adapt to the backend, responses
 * pass through untouched).
 *
 * TODO(team): verify meanings against the canonical decline-code catalog, extend
 * coverage, and add docs_url deep links per entry.
 */

export type ErrorGuidance = {
  meaning: string;
  retriable: boolean;
  next_step: string;
  docs_url?: string;
};

export const ERROR_GUIDANCE: Record<string, ErrorGuidance> = {
  INSUFFICIENT_FUNDS: {
    meaning: "The account has no funds available for this amount",
    retriable: true,
    next_step: "Retry later (e.g. after payday) or ask the customer for another payment method; do not retry immediately",
  },
  EXPIRED_CARD: {
    meaning: "The card's expiration date has passed",
    retriable: false,
    next_step: "Request updated card details from the customer; if vaulted, unenroll and re-enroll the method",
  },
  STOLEN_CARD: {
    meaning: "The issuer reported the card as stolen",
    retriable: false,
    next_step: "Never retry; ask for a different payment method and review the customer for fraud signals",
  },
  LOST_CARD: {
    meaning: "The issuer reported the card as lost",
    retriable: false,
    next_step: "Never retry; ask for a different payment method",
  },
  RESTRICTED_CARD: {
    meaning: "The issuer restricts this card for this type of transaction, merchant, or region",
    retriable: false,
    next_step: "Ask for a different payment method; cross-border or MCC restrictions are common causes",
  },
  INVALID_CARD_NUMBER: {
    meaning: "The card number failed validation at the issuer or network",
    retriable: false,
    next_step: "Have the customer re-enter card details; check for typos before retrying",
  },
  INVALID_SECURITY_CODE: {
    meaning: "The CVV/CVC did not match",
    retriable: false,
    next_step: "Have the customer re-enter the security code; repeated failures suggest a card-testing attempt",
  },
  DO_NOT_HONOR: {
    meaning: "Generic issuer refusal (soft decline) — the issuer gave no specific reason",
    retriable: true,
    next_step: "Retry once after a delay or through a different provider route; persistent failures need a different payment method",
  },
  CALL_ISSUER: {
    meaning: "The issuer requires the cardholder to contact them before approving",
    retriable: true,
    next_step: "Ask the customer to contact their bank, then retry the same method",
  },
  FRAUD_DECLINED: {
    meaning: "Fraud screening (issuer- or provider-side) blocked the transaction",
    retriable: false,
    next_step: "Do not blind-retry; review the fraud verdict on the payment before deciding",
  },
  THREE_D_SECURE_REQUIRED: {
    meaning: "The issuer requires 3DS authentication for this transaction (soft decline)",
    retriable: true,
    next_step: "Retry the payment through a 3DS-enabled flow (SDK_CHECKOUT workflow or provider 3DS configuration)",
  },
  COMMUNICATION_ERROR: {
    meaning: "A network or provider communication failure — the outcome is indeterminate",
    retriable: true,
    next_step: "Retry with the SAME idempotency key to avoid a double charge; check payment status first via paymentRetrieve",
  },
  DUPLICATED_TRANSACTION: {
    meaning: "The provider detected a duplicate of a recent transaction",
    retriable: false,
    next_step: "Retrieve the original payment (paymentRetrieveByMerchantOrderId) instead of retrying",
  },
  INVALID_AMOUNT: {
    meaning: "The amount is invalid for this provider/method (zero, negative, or out of bounds)",
    retriable: false,
    next_step: "Check the provider's min/max limits and the currency's decimal rules, then resubmit",
  },
  MAX_AMOUNT_EXCEEDED: {
    meaning: "The amount exceeds a limit (card, account, or provider-level)",
    retriable: true,
    next_step: "Retry with a lower amount, split the charge, or ask for another payment method",
  },
  DECLINED_BY_BANK: {
    meaning: "The issuing bank declined without a normalized reason",
    retriable: true,
    next_step: "Inspect the raw provider response_message for the underlying reason; one delayed retry is acceptable",
  },
  CANCELED_BY_USER: {
    meaning: "The customer abandoned or canceled the payment flow",
    retriable: true,
    next_step: "No technical issue — re-engage the customer with a new checkout session or payment link",
  },
};

const CODE_PROBES = [
  (body: Record<string, unknown>) => body.sub_status,
  (body: Record<string, unknown>) => body.code,
  (body: Record<string, unknown>) => body.error_code,
  (body: Record<string, unknown>) => (body.transactions as Record<string, unknown> | undefined)?.response_code,
];

export function findGuidance(body: unknown): { code: string; guidance: ErrorGuidance } | undefined {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return undefined;
  }
  const record = body as Record<string, unknown>;
  for (const probe of CODE_PROBES) {
    const code = probe(record);
    if (typeof code === "string" && code in ERROR_GUIDANCE) {
      return { code, guidance: ERROR_GUIDANCE[code] };
    }
  }
  return undefined;
}

export function formatGuidance({ code, guidance }: { code: string; guidance: ErrorGuidance }): string {
  const retry = guidance.retriable ? "may be retried (see next step)" : "should NOT be retried";
  const docs = guidance.docs_url ? ` Docs: ${guidance.docs_url}` : "";
  return `Guidance for ${code}: ${guidance.meaning}. This ${retry}. Next step: ${guidance.next_step}.${docs}`;
}
