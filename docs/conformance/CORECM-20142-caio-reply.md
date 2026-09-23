# CORECM-20142 — Reply to Caio (ready to send)

**Status:** ready-to-send draft. This document is content for the operator to
dispatch to caio@y.uno; it has **not** been sent yet.

**To:** caio@y.uno
**Ticket:** CORECM-20142
**Subject:** Correction — payment-method enrollment response does not return `id`

---

Hi Caio,

Correcting my earlier note: it was wrong. I told you the payment-method
enrollment response returns an `id` — it does not.

The enrollment response returns `vaulted_token`, and `vaulted_token` is the
identifier you pass as `payment_method_id` to `paymentMethodRetrieve` and
`paymentMethodUnenroll`. There is no `id` field on that response to key off.

## Where this is encoded (independently verifiable)

This isn't from memory — the fix is already pinned in the code, so you can
check it directly:

- `src/schemas/paymentMethods.ts` — the `yunoPaymentMethodOutputSchema`
  defines `vaulted_token` and no `id`. The field description reads:

  > "Identifies this payment method. Pass it as payment_method_id to
  > paymentMethodRetrieve and paymentMethodUnenroll."

  The inline comment above the field states it plainly:

  > "The API returns no `id` for a payment method: vaulted_token is its
  > identifier (verified against api-staging 2026-09-21), and it is what
  > retrieve/unenroll expect as payment_method_id."

- `tests/conformance-fixes.test.ts` — the `describe("payment method
  identifier")` block pins this behavior. It asserts that
  `yunoPaymentMethodOutputSchema.shape.vaulted_token.description` contains
  `payment_method_id`, that both `paymentMethodRetrieve` and
  `paymentMethodUnenroll` describe `payment_method_id` as the `vaulted_token`,
  and that both hints survive into the live `tools/list` output.

## Verification

This was verified against api-staging on 2026-09-21: enroll returned
`vaulted_token` and no `id`, and retrieve by `vaulted_token` returned 200. That
date matches the verification note left in the code comment above — it is not a
new claim.

Sorry for the earlier confusion.
