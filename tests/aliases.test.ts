import { expect, it, describe } from "@rstest/core";
import z from "zod";
import { normalizeParamKeys } from "../src/tools/aliases";
import { paymentRetrieveTool } from "../src/tools/payments";
import { customerRetrieveTool } from "../src/tools/customers";

describe("normalizeParamKeys", () => {
  it("fills a snake_case key from its camelCase twin, and the reverse", () => {
    expect(normalizeParamKeys(paymentRetrieveTool.schema, { paymentId: "x" })).toEqual({ payment_id: "x" });
    expect(normalizeParamKeys(customerRetrieveTool.schema, { customer_id: "x" })).toEqual({ customerId: "x" });
  });

  it("never overrides a key the caller spelled as declared", () => {
    const schema = z.object({ payment_id: z.string() });
    expect(normalizeParamKeys(schema, { payment_id: "declared", paymentId: "twin" })).toEqual({ payment_id: "declared", paymentId: "twin" });
  });

  it("leaves unknown keys and nested objects alone", () => {
    const schema = z.object({ body: z.object({ merchant_reference: z.string() }) });
    const params = { body: { merchantReference: "r" }, extra: 1 };
    expect(normalizeParamKeys(schema, params)).toEqual(params);
  });

  it("passes non-objects through", () => {
    expect(normalizeParamKeys(paymentRetrieveTool.schema, null)).toBeNull();
    expect(normalizeParamKeys(paymentRetrieveTool.schema, undefined)).toBeUndefined();
  });
});
