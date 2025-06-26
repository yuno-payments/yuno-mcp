import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { YunoClient } from "./client";
import { env } from "process";
import { z } from "zod";
import { randomUUID } from 'crypto';
let yunoClient: Awaited<ReturnType<typeof YunoClient.initialize>>;

const server = new McpServer({
  name: "yuno-mcp",
  version: "1.2.3",
});
const accountCode = process.env.YUNO_ACCOUNT_CODE as string;

async function initializeYunoClient() {
  try {
  yunoClient = await YunoClient.initialize({
    accountCode: accountCode,
    publicApiKey: (env.YUNO_PUBLIC_API_KEY as string),
    privateSecretKey: (env.YUNO_PRIVATE_SECRET_KEY as string),
    baseUrl: (env.YUNO_BASE_URL as string),
  });
  } catch (error) {
    if (error instanceof Error) {
      return { content: [{ type: "text", text: error.message }] };
    }
    return { content: [{ type: "text", text: "An unknown error occurred" }] };
  }
}

server.tool(
  "customer.create",
  {
    merchant_customer_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    gender: z.enum(["M", "F", "NB"]).optional(),
    date_of_birth: z.string().optional(),
    email: z.string(),
    nationality: z.string().optional(),
    country: z.string(),
    document: z.object({
      document_type: z.string(),
      document_number: z.string()
    }).optional(),
    phone: z.object({
      number: z.string(),
      country_code: z.string()
    }).optional(),
    billing_address: z.object({
      address_line_1: z.string(),
      address_line_2: z.string().optional(),
      country: z.string(),
      state: z.string(),
      city: z.string(),
      zip_code: z.string(),
      neighborhood: z.string().optional()
    }).optional(),
    shipping_address: z.object({
      address_line_1: z.string(),
      address_line_2: z.string().optional(),
      country: z.string(),
      state: z.string(),
      city: z.string(),
      zip_code: z.string(),
      neighborhood: z.string().optional()
    }).optional(),
    metadata: z.array(z.object({
      key: z.string(),
      value: z.string()
    })).optional(),
    merchant_customer_created_at: z.string().optional()
  },
  async (customerData) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }

      const customer = await yunoClient.customers.create(customerData);
      return { content: [{ type: "text", text: `customer response: ${JSON.stringify(customer, null, 4)}` }] };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "customer.retrieve",
  {
    customerId: z.string().min(36).max(64).describe("The unique identifier of the customer to retrieve (MIN 36, MAX 64 characters)"),
  },
  async ({ customerId }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const customer = await yunoClient.customers.retrieve(customerId);
      return { content: [{ type: "text", text: `customer response: ${JSON.stringify(customer, null, 4)}` }] };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "customer.retrieveByExternalId",
  {
    merchant_customer_id: z.string().describe("The external merchant_customer_id to retrieve the customer")
  },
  async ({ merchant_customer_id }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const customer = await yunoClient.customers.retrieveByExternalId(merchant_customer_id);
      return { content: [{ type: "text", text: `customer response: ${JSON.stringify(customer, null, 4)}` }] };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "customer.update",
  {
    customerId: z.string().min(36).max(64).describe("The unique identifier of the customer to update (MIN 36, MAX 64 characters)"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    gender: z.enum(["M", "F", "NB"]).optional(),
    date_of_birth: z.string().optional(),
    email: z.string().optional(),
    nationality: z.string().optional(),
    country: z.string().optional(),
    document: z.object({
      document_type: z.string(),
      document_number: z.string()
    }).optional(),
    phone: z.object({
      number: z.string(),
      country_code: z.string()
    }).optional(),
    billing_address: z.object({
      address_line_1: z.string(),
      address_line_2: z.string().optional(),
      country: z.string(),
      state: z.string(),
      city: z.string(),
      zip_code: z.string(),
      neighborhood: z.string().optional()
    }).optional(),
    shipping_address: z.object({
      address_line_1: z.string(),
      address_line_2: z.string().optional(),
      country: z.string(),
      state: z.string(),
      city: z.string(),
      zip_code: z.string(),
      neighborhood: z.string().optional()
    }).optional(),
    metadata: z.array(z.object({
      key: z.string(),
      value: z.string()
    })).optional(),
    merchant_customer_created_at: z.string().optional()
  },
  async ({ customerId, ...updateFields }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const customer = await yunoClient.customers.update(customerId, updateFields);
      return { content: [{ type: "text", text: `customer response: ${JSON.stringify(customer, null, 4)}` }] };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "checkoutSession.create",
  {
    customer_id: z.string().min(36).max(64).describe("The unique identifier of the customer"),
    merchant_order_id: z.string().min(3).max(255).describe("The unique identifier of the customer's order"),
    payment_description: z.string().min(1).max(255).describe("The description of the payment"),
    callback_url: z.string().min(3).max(526).optional().describe("The URL where we will redirect your customer after making the purchase"),
    country: z.enum(["AR", "BO", "BR", "CL", "CO", "CR", "EC", "SV", "GT", "HN", "MX", "NI", "PA", "PY", "PE", "US", "UY"]).describe("The customer's country (ISO 3166-1)"),
    amount: z.object({
      currency: z.enum(["ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"]).describe("The currency used to make the payment (ISO 4217)"),
      value: z.number().multipleOf(0.0001).describe("The payment amount")
    }).describe("Specifies the payment amount object"),
    metadata: z.array(
      z.object({
        key: z.string(),
        value: z.string()
      })
    ).max(120).optional().describe("Specifies a list of metadata objects. Max 120 items"),
    installments: z.object({
      plan_id: z.string().optional().describe("Plan Id of the installment plan created in Yuno"),
      plan: z.array(
        z.object({
          installment: z.number().int().describe("The number of monthly installments"),
          rate: z.number().describe("The rate applied to the final amount (percentage)")
        })
      ).optional().describe("Installments to show the customer")
    }).optional().describe("The installment plan configuration")
  },
  async ({ customer_id, country, amount, payment_description, merchant_order_id, callback_url, metadata, installments }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }

      const checkoutSession = await yunoClient.checkoutSessions.create({
        account_id: env.YUNO_ACCOUNT_CODE as string,
        amount,
        customer_id,
        merchant_order_id,
        payment_description,
        country,
        callback_url,
        metadata,
        installments
      });
      return {
        content: [{ type: "text", text: `checkout session response: ${JSON.stringify(checkoutSession, null, 4)}` }],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "checkoutSession.retrievePaymentMethods",
  {
    sessionId: z.string().describe("The unique identifier of the checkout session"),
  },
  async ({ sessionId }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const paymentMethodsResponse = await yunoClient.checkoutSessions.retrievePaymentMethods(sessionId);
      return {
        content: [
          {
            type: "text",
            text: `payment methods response: ${JSON.stringify(paymentMethodsResponse, null, 4)}`,
          },
        ],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);


const createPaymentSchema = z.object({
  account_id: z.string().optional().describe("Account ID for the payment"),
  description: z.string().describe("Payment description"),
  additional_data: z.any().optional(),
  country: z.string().describe("Customer's country (ISO 3166-1)"),
  merchant_order_id: z.string().describe("Unique identifier for the order"),
  merchant_reference: z.string().optional(),
  amount: z.object({
    currency: z.enum(["ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"]).describe("The currency used to make the payment (ISO 4217)"),
    value: z.number().describe("Payment amount")
  }).describe("Payment amount details"),
  customer_payer: z.object({
    id: z.string().describe("Customer unique identifier"),
    first_name: z.string().describe("First name of the customer"),
    last_name: z.string().describe("Last name of the customer"),
    email: z.string().describe("Email of the customer")
  }).describe("Customer payer info"),
  workflow: z.enum(["SDK_CHECKOUT", "DIRECT", "REDIRECT"]).describe("Payment workflow type"),
  payment_method: z.object({
    token: z.string().optional(),
    vaulted_token: z.string().optional(),
    type: z.string().describe("Payment method type"),
    detail: z.object({
      card: z.object({
        capture: z.boolean().optional(),
        installments: z.number().optional(),
        first_installment_deferral: z.number().optional(),
        soft_descriptor: z.string().optional(),
        card_data: z.object({
          number: z.string(),
          expiration_month: z.number().optional(),
          expiration_year: z.number().optional(),
          security_code: z.string().optional(),
          holder_name: z.string(),
          type: z.string().optional(),
        }),
        verify: z.boolean().optional(),
        stored_credentials: z.object({
          reason: z.string().optional(),
          usage: z.string().optional(),
          subscription_agreement_id: z.string().optional(),
          network_transaction_id: z.string().optional(),
        }).optional(),
      }).optional(),
    }).optional(),
    vault_on_success: z.boolean().optional(),
  }).describe("Payment method details"),
  callback_url: z.string().optional(),
  fraud_screening: z.any().optional(),
  split_marketplace: z.any().optional(),
  metadata: z.any().optional()
});

server.tool("payments.create",
  {
    payment: createPaymentSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate payments")
  }, async ({ payment, idempotency_key }) => {
  try {
    if (!yunoClient) {
      await initializeYunoClient();
    }

    const paymentWithAccount = { ...payment, account_id: payment.account_id || accountCode };
    const idempotencyKey = idempotency_key || randomUUID();
    const paymentResponse = await yunoClient.payments.create(paymentWithAccount, idempotencyKey);
    return {
      content: [
        {
          type: "text",
          text: `payment response: ${JSON.stringify(paymentResponse, null, 4)}`,
        },
      ],
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [{ type: "text", text: error.message }],
      };
    }
    return {
      content: [{ type: "text", text: "An unknown error occurred" }],
    };
  }
});

server.tool("payments.retrieve", { payment_id: z.string() }, async ({ payment_id }) => {
  try {
    if (!yunoClient) {
      await initializeYunoClient();
    }

    const payment = await yunoClient.payments.retrieve(payment_id);
    return {
      content: [{ type: "text", text: `payment response: ${JSON.stringify(payment, null, 4)}` }],
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [{ type: "text", text: error.message }],
      };
    }
    return {
      content: [{ type: "text", text: "An unknown error occurred" }],
    };
  }
});

server.tool(
  "payments.retrieveByMerchantOrderId",
  {
    merchant_order_id: z.string().describe("The unique identifier of the order for the payment (merchant_order_id)"),
  },
  async ({ merchant_order_id }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const payments = await yunoClient.payments.retrieveByMerchantOrderId(merchant_order_id);
      return {
        content: [{ type: "text", text: `payments response: ${JSON.stringify(payments, null, 4)}` }],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

const operationPaymentResponseAdditionalDataSchema = z.object({
  receipt: z.boolean().optional(),
  receipt_language: z.enum(["ES", "EN", "PT"]).optional(),
}).optional()

const refundPaymentSchema = z.object({
  description: z.string().min(3).max(255).optional(),
  reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER"]).optional(),
  merchant_reference: z.string().min(3).max(255),
  amount: z.object({
    currency: z.enum(["ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"]).optional(),
    value: z.string().optional(),
  }).optional(),
  simplified_mode: z.boolean().optional(),
  response_additional_data: operationPaymentResponseAdditionalDataSchema,
  customer_payer: z.object({
    id: z.string().describe("Customer unique identifier").optional(),
    first_name: z.string().describe("First name of the customer").optional(),
    last_name: z.string().describe("Last name of the customer").optional(),
    email: z.string().describe("Email of the customer").optional()
  }).describe("Customer payer info"),
})

server.tool(
  "payments.refund",
  {
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: refundPaymentSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate refunds")
  },
  async ({ paymentId, transactionId, body, idempotency_key }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const idempotencyKey = idempotency_key || randomUUID();
      const refundResponse = await yunoClient.payments.refund(paymentId, transactionId, body, idempotencyKey);
      return {
        content: [{ type: "text", text: `refund response: ${JSON.stringify(refundResponse, null, 4)}` }],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "payments.cancelOrRefund",
  {
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    body: refundPaymentSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate cancel/refund")
  },
  async ({ paymentId, body, idempotency_key }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const idempotencyKey = idempotency_key || randomUUID();
      const response = await yunoClient.payments.cancelOrRefund(paymentId, body, idempotencyKey);
      return {
        content: [{ type: "text", text: `cancelOrRefund response: ${JSON.stringify(response, null, 4)}` }],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "payments.cancelOrRefundWithTransaction",
  {
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: refundPaymentSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate cancel/refund")
  },
  async ({ paymentId, transactionId, body, idempotency_key }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const idempotencyKey = idempotency_key || randomUUID();
      const response = await yunoClient.payments.cancelOrRefundWithTransaction(paymentId, transactionId, body, idempotencyKey);
      return {
        content: [{ type: "text", text: `cancelOrRefundWithTransaction response: ${JSON.stringify(response, null, 4)}` }],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "payments.cancel",
  {
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: z.object({
      description: z.string().min(3).max(255).optional(),
      reason: z.enum(["DUPLICATE", "FRAUDULENT", "REQUESTED_BY_CUSTOMER", ""]).optional(),
      merchant_reference: z.string().min(3).max(255),
      response_additional_data: operationPaymentResponseAdditionalDataSchema,
    }),
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate cancels")
  },
  async ({ paymentId, transactionId, body, idempotency_key }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const idempotencyKey = idempotency_key || randomUUID();
      const cancelResponse = await yunoClient.payments.cancel(paymentId, transactionId, body, idempotencyKey);
      return {
        content: [{ type: "text", text: `cancel response: ${JSON.stringify(cancelResponse, null, 4)}` }],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "payments.authorize",
  {
    payment: createPaymentSchema,
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate payments")
  },
  async ({ payment, idempotency_key }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const paymentWithAccount = { ...payment, account_id: payment.account_id || accountCode };
      const idempotencyKey = idempotency_key || randomUUID();
      const response = await yunoClient.payments.authorize(paymentWithAccount, idempotencyKey);
      return {
        content: [{ type: "text", text: `authorize response: ${JSON.stringify(response, null, 4)}` }],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

server.tool(
  "payments.captureAuthorization",
  {
    paymentId: z.string().min(36).max(64).describe("The unique identifier of the payment (MIN 36, MAX 64 characters)"),
    transactionId: z.string().min(36).max(64).describe("The unique identifier of the transaction (MIN 36, MAX 64 characters)"),
    body: z.object({
      merchant_reference: z.string().min(3).max(255),
      amount: z.object({
        currency: z.enum(["ARS", "BOV", "BOB", "BRL", "CLP", "COP", "CRC", "USD", "SVC", "GTQ", "HNL", "MXN", "NIO", "PAB", "PYG", "PEN", "UYU"]),
        value: z.string(),
      }).optional(),
      reason: z.string().min(3).max(255),
      simplified_mode: z.boolean().optional(),
    }),
    idempotency_key: z.string().uuid().optional().describe("Unique key to prevent duplicate captures")
  },
  async ({ paymentId, transactionId, body, idempotency_key }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }
      const idempotencyKey = idempotency_key || randomUUID();
      const response = await yunoClient.payments.captureAuthorization(paymentId, transactionId, body, idempotencyKey);
      return {
        content: [{ type: "text", text: `captureAuthorization response: ${JSON.stringify(response, null, 4)}` }],
      };
    } catch (error) {
      if (error instanceof Error) {
        return { content: [{ type: "text", text: error.message }] };
      }
      return { content: [{ type: "text", text: "An unknown error occurred" }] };
    }
  }
);

const DOCUMENTATION = {
  API_REFERENCE: {
    CUSTOMER: {
      CREATE: 'https://docs.y.uno/reference/create-customer.md',
      RETRIEVE: 'https://docs.y.uno/reference/retrieve-customer.md',
      RETRIEVE_BY_EXTERNAL_ID: 'https://docs.y.uno/reference/retrieve-customer-by-external-id.md',
      UPDATE: 'https://docs.y.uno/reference/update-customer.md'
    },
    CHECKOUT_SESSION: {
      CREATE: 'https://docs.y.uno/reference/create-checkout-session.md',
      RETRIEVE_PAYMENT_METHODS: 'https://docs.y.uno/reference/retrieve-payment-methods-for-checkout.md',
    },
    PAYMENT: {
      CREATE: 'https://docs.y.uno/reference/create-payment.md',
      RETRIEVE: 'https://docs.y.uno/reference/retrieve-payment-by-id.md',
      RETRIEVE_BY_MERCHANT_ORDER_ID: 'https://docs.y.uno/reference/retrieve-payment-by-merchant-order-id.md',
      REFUND: 'https://docs.y.uno/reference/refund-payment.md',
      CANCEL: 'https://docs.y.uno/reference/cancel-payment.md',
      CANCEL_OR_REFUND: 'https://docs.y.uno/reference/cancel-or-refund-a-payment.md',
      CANCEL_OR_REFUND_WITH_TRANSACTION: 'https://docs.y.uno/reference/cancel-or-refund-payment-with-transaction',
      AUTHORIZE: 'https://docs.y.uno/reference/authorize-payment.md',
      CAPTURE_AUTHORIZATION: 'https://docs.y.uno/reference/capture-authorization',
    },
  },
  GUIDES: {
    SKDS: "https://docs.y.uno/docs/yuno-sdks.md",
    COUNTRY_COVERAGE: "https://docs.y.uno/docs/country-coverage-yuno-sdk.md",
    WEB: {
      INTEGRATIONS: "https://docs.y.uno/docs/web-sdk-integrations.md",
      FULL: "https://docs.y.uno/docs/full-checkout-sdk.md",
      LITE_PAYMENT: "https://docs.y.uno/docs/lite-checkout-sdk.md",
      LITE_ENROLLMENT: "https://docs.y.uno/docs/enrollment-lite-sdk.md",
      SEAMLESS_PAYMENT: "https://docs.y.uno/docs/seamless-sdk-payment-web.md",
      SECURE_FIELDS_PAYMENT: "https://docs.y.uno/docs/secure-fields-payment.md",
      SECURE_FIELDS_ENROLLMENT: "https://docs.y.uno/docs/secure-fields-enrollment.md",
      HEADLESS_PAYMENT: "https://docs.y.uno/docs/headless-sdk-payment.md",
      HEADLESS_ENROLLMENT: "https://docs.y.uno/docs/headless-sdk-enrollment.md",
      CUSTOMIZATIONS: "https://docs.y.uno/docs/sdk-customizations.md",
    },
    WEB_V_1_1: "https://docs.y.uno/docs/yuno-web-sdk-v11",
    ANDROID: {
      INTEGRATIONS: "https://docs.y.uno/docs/android-sdk-integrations.md",
      REQUIREMENTS: "https://docs.y.uno/docs/requirements-android.md",
      FULL: "https://docs.y.uno/docs/full-checkout-android.md",
      LITE_PAYMENT: "https://docs.y.uno/docs/lite-checkout-android.md",
      LITE_ENROLLMENT: "https://docs.y.uno/docs/enrollment-android.md",
      SEAMLESS_PAYMENT: "https://docs.y.uno/docs/seamless-sdk-payment-android.md",
      HEADLESS_PAYMENT: "https://docs.y.uno/docs/headless-sdk-payment-android.md",
      HEADLESS_ENROLLMENT: "https://docs.y.uno/docs/headless-sdk-enrollment-android.md",
      CUSTOMIZATIONS: "https://docs.y.uno/docs/sdk-customizations-android.md",
    },
    ANDROID_RELEASE_NOTES: "https://docs.y.uno/docs/release-notes-android-sdk.md",
    IOS: {
      INTEGRATIONS: "https://docs.y.uno/docs/ios-sdk-integrations.md",
      REQUIREMENTS: "https://docs.y.uno/docs/requirements-ios.md",
      FULL: "https://docs.y.uno/docs/full-checkout-ios.md",
      LITE_PAYMENT: "https://docs.y.uno/docs/lite-checkout-ios.md",
      LITE_ENROLLMENT: "https://docs.y.uno/docs/enrollment-ios.md",
      SEAMLESS_PAYMENT: "https://docs.y.uno/docs/seamless-sdk-payment-ios.md",
      HEADLESS_PAYMENT: "https://docs.y.uno/docs/headless-sdk-payment-ios.md",
      HEADLESS_ENROLLMENT: "https://docs.y.uno/docs/headless-sdk-enrollment-ios.md",
      CUSTOMIZATIONS: "https://docs.y.uno/docs/sdk-customizations-ios.md",
    },
  },
  UNOFFICIAL: {
    YUNO_NODE: {
      DOCS: 'https://raw.githubusercontent.com/latiscript/yuno-js/refs/heads/main/packages/yuno-node/README.md',
      EXAMPLE: 'https://raw.githubusercontent.com/latiscript/yuno-js/refs/heads/main/examples/react-express/express/src/index.ts',
    },
    YUNO_REACT: {
      DOCS: 'https://raw.githubusercontent.com/latiscript/yuno-js/refs/heads/main/packages/yuno-react/README.md',
      EXAMPLE: 'https://raw.githubusercontent.com/latiscript/yuno-js/refs/heads/main/examples/react-express/react/src/components/Full.tsx',
    },
  }
};

server.tool("documentation.read", { documentation_type: z.enum([
    "createCustomer",
    "retrieveCustomer",
    "retrieveCustomerByExternalId",
    "updateCustomer",
    "createCheckoutSession",
    "retrievePaymentMethodsForCheckoutSession",
    "createPayment",
    "retrievePayment",
    "retrievePaymentByMerchantOrderId",
    "refundPayment",
    "cancelOrRefundPayment",
    "cancelOrRefundWithTransactionPayment",
    "cancelPayment",
    "authorizePayment",
    "captureAuthorizationPayment",
    "guides",
    "web",
    "web_v_1_1",
    "android",
    "android_release_notes",
    "ios",
    "ios_release_notes",
    "unofficial.node",
    "unofficial.react"
  ]) }, async ({ documentation_type }) => {
  try {
    if (documentation_type === "createCustomer") {
      const createCustomerDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.CREATE);
      const createCustomerDocsText = await createCustomerDocs.text();

      return {
        content: [{ type: "text", text: createCustomerDocsText }],
      };
    }

    if (documentation_type === "retrieveCustomer") {
      const retrieveCustomerDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.RETRIEVE);
      const retrieveCustomerDocsText = await retrieveCustomerDocs.text();

      return {
        content: [{ type: "text", text: retrieveCustomerDocsText }],
      };
    }

    if (documentation_type === "retrieveCustomerByExternalId") {
      const retrieveCustomerByExternalIdDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.RETRIEVE_BY_EXTERNAL_ID);
      const retrieveCustomerByExternalIdDocsText = await retrieveCustomerByExternalIdDocs.text();

      return {
        content: [{ type: "text", text: retrieveCustomerByExternalIdDocsText }],
      };
    }

    if (documentation_type === "updateCustomer") {
      const updateCustomerDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.UPDATE);
      const updateCustomerDocsText = await updateCustomerDocs.text();

      return {
        content: [{ type: "text", text: updateCustomerDocsText }],
      };
    }

    if (documentation_type === "createCheckoutSession") {
      const createCheckoutSessionDocs = await fetch(DOCUMENTATION.API_REFERENCE.CHECKOUT_SESSION.CREATE);
      const createCheckoutSessionDocsText = await createCheckoutSessionDocs.text();

      return {
        content: [{ type: "text", text: createCheckoutSessionDocsText }],
      };
    }
    
    if (documentation_type === "retrievePaymentMethodsForCheckoutSession") {
      const retrievePaymentMethodsForCheckoutSessionDocs = await fetch(DOCUMENTATION.API_REFERENCE.CHECKOUT_SESSION.RETRIEVE_PAYMENT_METHODS);
      const retrievePaymentMethodsForCheckoutSessionDocsText = await retrievePaymentMethodsForCheckoutSessionDocs.text();

      return {
        content: [{ type: "text", text: retrievePaymentMethodsForCheckoutSessionDocsText }],
      };
    }

    if (documentation_type === "createPayment") {
      const createPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CREATE);
      const createPaymentDocsText = await createPaymentDocs.text();

      return {
        content: [{ type: "text", text: createPaymentDocsText }],
      };
    }

    if (documentation_type === "retrievePayment") {
      const retrievePaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.RETRIEVE);
      const retrievePaymentDocsText = await retrievePaymentDocs.text();

      return {
        content: [{ type: "text", text: retrievePaymentDocsText }],
      };
    }

    if (documentation_type === "retrievePaymentByMerchantOrderId") {
      const retrievePaymentByMerchantOrderIdDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.RETRIEVE_BY_MERCHANT_ORDER_ID);
      const retrievePaymentByMerchantOrderIdDocsText = await retrievePaymentByMerchantOrderIdDocs.text();

      return {
        content: [{ type: "text", text: retrievePaymentByMerchantOrderIdDocsText }],
      };
    }

    if (documentation_type === "refundPayment") {
      const refundPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.REFUND);
      const refundPaymentDocsText = await refundPaymentDocs.text();

      return {
        content: [{ type: "text", text: refundPaymentDocsText }],
      };
    }

    if (documentation_type === "cancelOrRefundPayment") {
      const cancelOrRefundPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CANCEL_OR_REFUND);
      const cancelOrRefundPaymentDocsText = await cancelOrRefundPaymentDocs.text();

      return {
        content: [{ type: "text", text: cancelOrRefundPaymentDocsText }],
      };
    }

    if (documentation_type === "cancelOrRefundWithTransactionPayment") {
      const cancelOrRefundWithTransactionPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CANCEL_OR_REFUND_WITH_TRANSACTION);
      const cancelOrRefundWithTransactionPaymentDocsText = await cancelOrRefundWithTransactionPaymentDocs.text();

      return {
        content: [{ type: "text", text: cancelOrRefundWithTransactionPaymentDocsText }],
      };
    }

    if (documentation_type === "cancelPayment") {
      const cancelPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CANCEL);
      const cancelPaymentDocsText = await cancelPaymentDocs.text();

      return {
        content: [{ type: "text", text: cancelPaymentDocsText }],
      };
    }

    if (documentation_type === "authorizePayment") {
      const authorizePaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.AUTHORIZE);
      const authorizePaymentDocsText = await authorizePaymentDocs.text();

      return {
        content: [{ type: "text", text: authorizePaymentDocsText }],
      };
    }

    if (documentation_type === "captureAuthorizationPayment") {
      const captureAuthorizationPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CAPTURE_AUTHORIZATION);
      const captureAuthorizationPaymentDocsText = await captureAuthorizationPaymentDocs.text();

      return {
        content: [{ type: "text", text: captureAuthorizationPaymentDocsText }],
      };
    }

    if (documentation_type === "guides") {
      const skdsDocs = await fetch(DOCUMENTATION.GUIDES.SKDS);
      const skdsDocsText = await skdsDocs.text();
      const countryCoverageDocs = await fetch(DOCUMENTATION.GUIDES.COUNTRY_COVERAGE);
      const countryCoverageDocsText = await countryCoverageDocs.text();

      return {
        content: [{ type: "text", text: skdsDocsText }, { type: "text", text: countryCoverageDocsText }],
      };
    }

    if (documentation_type === "web") {
      const webPromises = Object.values(DOCUMENTATION.GUIDES.WEB).map((doc) => fetch(doc));
      const webDocs = await Promise.all(webPromises);
      const webDocsText = await Promise.all(webDocs.map((doc) => doc.text()));

      return {
        content: [{ type: "text", text: webDocsText.join("\n\n") }],
      };
    }

    if (documentation_type === "web_v_1_1") {
      const webV11Docs = await fetch(DOCUMENTATION.GUIDES.WEB_V_1_1);
      const webV11DocsText = await webV11Docs.text();

      return {
        content: [{ type: "text", text: webV11DocsText }],
      };
    }

    if (documentation_type === "android") {
      const androidPromises = Object.values(DOCUMENTATION.GUIDES.ANDROID).map((doc) => fetch(doc));

      const androidDocs = await Promise.all(androidPromises);
      const androidDocsText = await Promise.all(androidDocs.map((doc) => doc.text()));

      return {
        content: [{ type: "text", text: androidDocsText.join("\n\n") }],
      };
    }

    if (documentation_type === "android_release_notes") {
      const androidReleaseNotesDocs = await fetch(DOCUMENTATION.GUIDES.ANDROID_RELEASE_NOTES);
      const androidReleaseNotesDocsText = await androidReleaseNotesDocs.text();

      return {
        content: [{ type: "text", text: androidReleaseNotesDocsText }],
      };
    }

    if (documentation_type === "ios") {
      const iosPromises = Object.values(DOCUMENTATION.GUIDES.IOS).map((doc) => fetch(doc));
      const iosDocs = await Promise.all(iosPromises);
      const iosDocsText = await Promise.all(iosDocs.map((doc) => doc.text()));

      return {
        content: [{ type: "text", text: iosDocsText.join("\n\n") }],
      };
    }

    if (documentation_type === "unofficial.node") {
      const unofficialNodeDocs = await fetch(DOCUMENTATION.UNOFFICIAL.YUNO_NODE.DOCS);
      const unofficialNodeDocsText = await unofficialNodeDocs.text();

      const unofficialNodeExample = await fetch(DOCUMENTATION.UNOFFICIAL.YUNO_NODE.EXAMPLE);
      const unofficialNodeExampleText = await unofficialNodeExample.text();

      return {
        content: [{ type: "text", text: `latiscript/yuno-node: ${unofficialNodeDocsText}` }, { type: "text", text: `latiscript/yuno-node example: ${unofficialNodeExampleText}` }],
      };
    }

    if (documentation_type === "unofficial.react") {
      const unofficialReactDocs = await fetch(DOCUMENTATION.UNOFFICIAL.YUNO_REACT.DOCS);
      const unofficialReactDocsText = await unofficialReactDocs.text();

      const unofficialReactExample = await fetch(DOCUMENTATION.UNOFFICIAL.YUNO_REACT.EXAMPLE);
      const unofficialReactExampleText = await unofficialReactExample.text();

      return {
        content: [{ type: "text", text: `latiscript/yuno-react: ${unofficialReactDocsText}` }, { type: "text", text: `latiscript/yuno-react example: ${unofficialReactExampleText}` }],
      };
    }

    return {
      content: [{ type: "text", text: "Documentation not found" }],
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: [{ type: "text", text: error.message }],
      };
    }
    return {
      content: [{ type: "text", text: "An unknown error occurred" }],
    };
  }
});

export async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n🚨  Error initializing Yuno MCP server:\n');
    console.error(`   ${error.message}\n`);
  });
}
