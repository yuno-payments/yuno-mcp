/**
 * Hand-written worked examples served by describeTool alongside the full schema.
 * Coverage focuses on the tools whose registered schemas are most aggressively
 * compacted; tools without an entry fall back to schema-only output.
 */
export const EXAMPLES: Partial<Record<string, unknown>> = {
  paymentCreate: {
    payment: {
      description: "Order 42",
      country: "BR",
      merchant_order_id: "order-42",
      amount: { currency: "BRL", value: 100.5 },
      workflow: "DIRECT",
      payment_method: {
        type: "CARD",
        detail: {
          card: {
            capture: true,
            card_data: {
              number: "4111111111111111",
              expiration_month: 12,
              expiration_year: 2030,
              security_code: "123",
              holder_name: "JANE DOE",
            },
          },
        },
      },
      customer_payer: { id: "customer-uuid", email: "jane@example.com" },
    },
  },
  paymentAuthorize: {
    payment: {
      description: "Order 42 (authorize only, capture later with paymentCaptureAuthorization)",
      country: "BR",
      merchant_order_id: "order-42",
      amount: { currency: "BRL", value: 100.5 },
      workflow: "DIRECT",
      payment_method: {
        type: "CARD",
        detail: { card: { card_data: { number: "4111111111111111", expiration_month: 12, expiration_year: 2030, security_code: "123", holder_name: "JANE DOE" } } },
      },
    },
  },
  paymentLinkCreate: {
    description: "Invoice 1001",
    country: "CO",
    merchant_order_id: "invoice-1001",
    amount: { currency: "COP", value: 50000 },
    payment_method_types: ["CARD", "PSE"],
  },
  subscriptionCreate: {
    name: "Pro plan",
    description: "Monthly Pro subscription",
    country: "BR",
    amount: { currency: "BRL", value: 49.9 },
    frequency: { type: "MONTH", value: 1 },
    customer_payer: { customer_id: "customer-uuid", payment_method_code: "vaulted-method-code" },
  },
  customerCreate: {
    merchant_customer_id: "user-123",
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
    country: "BR",
  },
  checkoutSessionCreateOtt: {
    sessionId: "checkout-session-uuid",
    body: {
      payment_method: {
        type: "CARD",
        detail: { card: { card_data: { number: "4111111111111111", expiration_month: 12, expiration_year: 2030, security_code: "123", holder_name: "JANE DOE" } } },
      },
    },
  },
};
