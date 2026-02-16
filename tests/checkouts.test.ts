import { expect, it, describe, rstest } from "@rstest/core";
import z from "zod";
import { checkoutSessionCreateSchema, ottCreateSchema } from "../src/schemas";
import { checkoutSessionCreateTool, checkoutSessionRetrievePaymentMethodsTool, checkoutSessionCreateOttTool } from "../src/tools/checkouts";

describe("checkoutSessionCreateTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      checkoutSessions: {
        create: rstest.fn().mockResolvedValue({ body: { id: "chk_123", merchant_order_id: "order_1" }, status: 200, headers: {} }),
      },
    };
    const input = {
      account_id: "acc_123456789012345678901234567890123456",
      customer_id: "cus_123456789012345678901234567890123456",
      merchant_order_id: "order_1",
      payment_description: "desc",
      country: "US",
      amount: { currency: "USD", value: 100 },
    };
    const result = await checkoutSessionCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.checkoutSessions.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("chk_123");
    expect(result.content[0].text).toContain("order_1");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = {
      merchant_order_id: "ord_1",
      payment_description: "desc",
      country: "US",
    };
    expect(() => checkoutSessionCreateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const invalidCustomerId = {
      customer_id: "short",
      merchant_order_id: "ord_1",
      payment_description: "desc",
      country: "US",
    };
    const missingCountry = {
      merchant_order_id: "ord_1",
      payment_description: "desc",
    };
    expect(() => checkoutSessionCreateSchema.parse(invalidCustomerId)).toThrow();
    expect(() => checkoutSessionCreateSchema.parse(missingCountry)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      checkoutSessions: {
        create: rstest.fn().mockResolvedValue({ body: { id: "chk_456", merchant_order_id: "order_2", metadata: [] }, status: 200, headers: {} }),
      },
    };
    const input = {
      account_id: "acc_123456789012345678901234567890123456",
      customer_id: "cus_123456789012345678901234567890123456",
      merchant_order_id: "order_2",
      payment_description: "desc",
      country: "US",
      callback_url: "https://callback",
      amount: { currency: "USD", value: 100 },
      metadata: [],
      installments: {
        plan_id: "plan_1",
        plan: [{ installment: 3, rate: 1.5 }],
      },
    };
    const result = await checkoutSessionCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.checkoutSessions.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("chk_456");
    expect(result.content[0].text).toContain("order_2");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      accountCode: "acc_123456789012345678901234567890123456",
      checkoutSessions: {
        create: rstest.fn().mockResolvedValue({ body: { id: "chk_789", merchant_order_id: "order_3" }, status: 200, headers: {} }),
      },
    };
    const input = {
      customer_id: "cus_123456789012345678901234567890123456",
      merchant_order_id: "order_3",
      payment_description: "desc",
      country: "US",
      amount: { currency: "USD", value: 100 },
    };
    const result = await checkoutSessionCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.checkoutSessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...input,
        account_id: "acc_123456789012345678901234567890123456",
      }),
    );
    expect(result.content[0].text).toContain("chk_789");
    expect(result.content[0].text).toContain("order_3");
  });
});

describe("checkoutSessionRetrievePaymentMethodsTool", () => {
  const retrieveSchema = z.object({ sessionId: z.string() });

  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      checkoutSessions: {
        retrievePaymentMethods: rstest.fn().mockResolvedValue({ body: { payment_methods: [{ type: "card", name: "Visa" }] }, status: 200, headers: {} }),
      },
    };
    const input = { sessionId: "sess_123" };
    const result = await checkoutSessionRetrievePaymentMethodsTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.checkoutSessions.retrievePaymentMethods).toHaveBeenCalledWith("sess_123");
    expect(result.content[0].text).toContain("card");
    expect(result.content[0].text).toContain("Visa");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { sessionId: null };
    expect(() => retrieveSchema.parse(missingId)).toThrow();
    expect(() => retrieveSchema.parse(invalidId)).toThrow();
  });
});

describe("checkoutSessionCreateOttTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      checkoutSessions: {
        createOtt: rstest.fn().mockResolvedValue({ body: {
          token: "f3beb554-21c7-46a7-9e22-769c6c012df1",
          vaulted_token: null,
          vault_on_success: false,
          type: "CARD",
          card_data: {
            holder_name: "SDFSD",
            iin: "49162600",
            lfd: "0590",
            number_length: 16,
            security_code_length: 3,
            brand: "VISA",
            type: "CREDIT",
            category: "VISA",
            issuer_name: "RAPPIPAY",
            issuer_code: null,
          },
          country: "CO",
        }, status: 200, headers: {} }),
      },
    };
    const input = {
      sessionId: "2d2ae7c0-6bc8-4aaa-86d1-d6e6be0bfd2a",
      payment_method: {
        type: "CARD",
        vault_on_success: false,
        card: {
          expiration_month: 1,
          expiration_year: 26,
          number: "4916260028660590",
          security_code: "123",
          holder_name: "SDFSD",
          type: null,
          brand: "VISA",
        },
        customer: {
          browser_info: {
            browser_time_difference: "300",
            color_depth: "24",
            java_enabled: false,
            screen_width: "1920",
            screen_height: "1080",
            user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            language: "en-US",
            javascript_enabled: true,
            accept_browser: "*/*",
            accept_content: "*/*",
            accept_header: "*/*",
          },
        },
      },
      three_d_secure: {
        three_d_secure_setup_id: null,
      },
      installment: null,
      third_party_data: null,
      device_fingerprints: null,
    };
    const result = await checkoutSessionCreateOttTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.checkoutSessions.createOtt).toHaveBeenCalledWith("2d2ae7c0-6bc8-4aaa-86d1-d6e6be0bfd2a", {
      payment_method: input.payment_method,
      three_d_secure: input.three_d_secure,
      installment: input.installment,
      third_party_data: input.third_party_data,
      device_fingerprints: input.device_fingerprints,
    });
    expect(result.content[0].text).toContain("f3beb554-21c7-46a7-9e22-769c6c012df1");
    expect(result.content[0].text).toContain("VISA");
  });

  it("should validate a correct OTT payload", () => {
    const validOttData = {
      sessionId: "2d2ae7c0-6bc8-4aaa-86d1-d6e6be0bfd2a",
      payment_method: {
        type: "CARD",
        vault_on_success: false,
        card: {
          expiration_month: 1,
          expiration_year: 26,
          number: "4916260028660590",
          security_code: "123",
          holder_name: "SDFSD",
          type: null,
          brand: "VISA",
        },
        customer: {
          browser_info: {
            browser_time_difference: "300",
            color_depth: "24",
            java_enabled: false,
            screen_width: "1920",
            screen_height: "1080",
            user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            language: "en-US",
            javascript_enabled: true,
            accept_browser: "*/*",
            accept_content: "*/*",
            accept_header: "*/*",
          },
        },
      },
      three_d_secure: {
        three_d_secure_setup_id: null,
      },
      installment: null,
      third_party_data: null,
      device_fingerprints: null,
    };
    expect(() => ottCreateSchema.parse(validOttData)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingSessionId = {
      payment_method: {
        type: "CARD",
        vault_on_success: false,
        card: {
          expiration_month: 1,
          expiration_year: 26,
          number: "4916260028660590",
          security_code: "123",
          holder_name: "SDFSD",
        },
        customer: {
          browser_info: {
            browser_time_difference: "300",
            color_depth: "24",
            java_enabled: false,
            screen_width: "1920",
            screen_height: "1080",
            user_agent: "Mozilla/5.0",
            language: "en-US",
            javascript_enabled: true,
            accept_browser: "*/*",
            accept_content: "*/*",
            accept_header: "*/*",
          },
        },
      },
      three_d_secure: {
        three_d_secure_setup_id: null,
      },
    };
    expect(() => ottCreateSchema.parse(missingSessionId)).toThrow();
  });

  it("should validate OTT payload for APM (Nequi) without card field", () => {
    const validNequiOttData = {
      sessionId: "2d2ae7c0-6bc8-4aaa-86d1-d6e6be0bfd2a",
      payment_method: {
        type: "NEQUI",
        vault_on_success: false,
        customer: {
          browser_info: {
            browser_time_difference: "-300",
            color_depth: "24",
            java_enabled: false,
            screen_width: "1920",
            screen_height: "1080",
            user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            language: "es-CO",
            javascript_enabled: true,
            accept_browser: "*/*",
            accept_content: "*/*",
            accept_header: "*/*",
          },
          // Additional customer fields for APM
          first_name: "Romel",
          last_name: "Rodriguez",
          email: "romel@y.uno",
          gender: "M",
          date_of_birth: "1990-02-28",
          document: {
            document_number: "1234567890",
            document_type: "CC",
          },
          phone: {
            country_code: "57",
            number: "3001234567",
          },
          billing_address: {
            address_line_1: "Calle 34 # 56 - 78",
            address_line_2: "Apartamento 502, Torre I",
            country: "CO",
            state: "Cundinamarca",
            city: "Bogotá",
            zip_code: "68890000",
          },
        },
        vaulted_token: null,
      },
      three_d_secure: {
        three_d_secure_setup_id: null,
      },
      installment: null,
      third_party_data: null,
      device_fingerprints: null,
    };
    expect(() => ottCreateSchema.parse(validNequiOttData)).not.toThrow();
  });
});
