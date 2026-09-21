import { expect, it, describe } from "@rstest/core";
import z from "zod";
import { compactSchema, HEAVY_KEYS } from "../src/schemas/compact";
import { paymentCreateSchema, yunoPaymentOutputSchema } from "../src/schemas/payments";
import { tools } from "../src/tools";

const INPUT_OPTIONS = { maxDepth: 3, heavyKeys: HEAVY_KEYS } as const;
const OUTPUT_OPTIONS = { maxDepth: 2, heavyKeys: HEAVY_KEYS, partialTopLevel: true } as const;

describe("compactSchema", () => {
  it("preserves optional/nullable wrappers on collapsed subtrees", () => {
    const schema = z.object({
      airline: z.object({ code: z.string() }).nullish().describe("Airline data"),
    });
    const compact = compactSchema(schema, { maxDepth: 1 });

    expect(compact.safeParse({ airline: null }).success).toBe(true);
    expect(compact.safeParse({}).success).toBe(true);
    expect(compact.safeParse({ airline: { anything: [1, 2] } }).success).toBe(true);
  });

  it("collapses heavy keys at any depth and keeps their description", () => {
    const schema = z.object({
      additional_data: z
        .object({ order: z.object({ items: z.array(z.object({ sku: z.string() })) }) })
        .describe("Order details"),
    });
    const compact = compactSchema(schema, { maxDepth: 10, heavyKeys: HEAVY_KEYS });
    const jsonSchema = z.toJSONSchema(compact, { unrepresentable: "any" }) as {
      properties: Record<string, { description?: string; properties?: unknown }>;
    };

    expect(jsonSchema.properties.additional_data.description).toBe("Order details");
    // The pointer to describeTool is no longer repeated on every collapsed node —
    // it is stated once per tool at registration (COMPACTED_SCHEMA_HINT in src/index.ts),
    // which is asserted in tests/lean-tools-list.test.ts.
    expect(jsonSchema.properties.additional_data.description).not.toContain("describeTool");
    expect(jsonSchema.properties.additional_data.properties).toBeUndefined();
  });

  it("keeps every top-level key of paymentCreateSchema", () => {
    const compact = compactSchema(paymentCreateSchema, INPUT_OPTIONS);
    expect(Object.keys(compact.shape).sort()).toEqual(Object.keys(paymentCreateSchema.shape).sort());
  });

  it("accepts a strict-schema-valid paymentCreate input", () => {
    const input = {
      payment: {
        description: "order 42",
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
        additional_data: { order: { shipping_amount: 0 }, airline: null },
        metadata: [{ key: "source", value: "test" }],
      },
      idempotency_key: "550e8400-e29b-41d4-a716-446655440000",
    };

    expect(paymentCreateSchema.safeParse(input).success).toBe(true);
    expect(compactSchema(paymentCreateSchema, INPUT_OPTIONS).safeParse(input).success).toBe(true);
  });

  it("accepts a raw payment response under the compact output schema", () => {
    const response = {
      id: "pay_123",
      account_id: "acc_1",
      description: "order 42",
      country: "BR",
      status: "SUCCEEDED",
      sub_status: "APPROVED",
      amount: { currency: "BRL", value: 100.5 },
      payment_method: { type: "CARD", detail: { card: { brand: "VISA", last_four: "1111" } } },
      transactions: { type: "PURCHASE", status: "SUCCEEDED", response_code: "00" },
      provider_specific_field_nobody_modeled: { deeply: { nested: true } },
      created_at: "2026-08-05T10:00:00Z",
    };

    const compactOutput = compactSchema(yunoPaymentOutputSchema, OUTPUT_OPTIONS);
    const result = compactOutput.safeParse(response);
    expect(result.success).toBe(true);
  });

  it("keeps the registered tools/list payload under budget", () => {
    let total = 0;
    for (const tool of tools) {
      const input = JSON.stringify(z.toJSONSchema(compactSchema(tool.schema, INPUT_OPTIONS), { unrepresentable: "any" }));
      const output = tool.outputSchema
        ? JSON.stringify(z.toJSONSchema(compactSchema(tool.outputSchema, OUTPUT_OPTIONS), { unrepresentable: "any" }))
        : "";
      const size = input.length + output.length;
      expect(size, `${tool.method} schema payload too large (${String(size)} chars)`).toBeLessThan(9_000);
      total += size;
    }
    // The full schemas serialize to ~500KB. Compaction exists to keep the whole
    // surface well under a small fraction of that; raise deliberately if it grows.
    expect(total).toBeLessThan(150_000);
  });
});
