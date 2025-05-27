import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { YunoClient } from "@latiscript/yuno-node";
import { env } from "process";
import { z } from "zod";
import { randomUUID } from "node:crypto";
let yunoClient: ReturnType<typeof YunoClient.initialize>;

const server = new McpServer({
  name: "yuno-mcp",
  version: "1.0.0",
});

server.tool(
  "yuno.initialize",
  async () => {
    try {
      yunoClient = YunoClient.initialize({
        accountCode: (env.YUNO_ACCOUNT_CODE as string),
        publicApiKey: (env.YUNO_PUBLIC_API_KEY as string),
        privateSecretKey: (env.YUNO_PRIVATE_SECRET_KEY as string),
      countryCode: env.YUNO_COUNTRY_CODE,
      currency: env.YUNO_CURRENCY,
    });
    return {
      content: [{ type: "text", text: "Yuno client initialized successfully" }],
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
  "customer.create",
  {
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    country: z.string().optional(),
  },
  async ({ first_name, last_name, email, country }) => {
    try {
      if (!yunoClient) {
        return { content: [{ type: "text", text: "Yuno client not initialized" }] };
      }

      const customer = await yunoClient.customers.create({
        first_name,
        last_name,
        email,
        country,
    });
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
  { customer_id: z.string(), amount: z.number(), description: z.string().optional(), merchant_order_id: z.string().optional(), currency: z.string().optional(), country: z.string().optional() },
  async ({ customer_id, country, amount, description, merchant_order_id, currency }) => {
    try {
      if (!yunoClient) {
        return { content: [{ type: "text", text: "Yuno client not initialized" }] };
      }

      const checkoutSession = await yunoClient.checkoutSessions.create({
        amount: {
          currency,
        value: amount,
      },
      customer_id,
      merchant_order_id: merchant_order_id ?? randomUUID(),
      payment_description: description ?? "Test payment",
      country,
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

server.tool("payments.create",
  {
    payment: z.object({
      workflow: z.enum(["SDK_CHECKOUT", "DIRECT", "REDIRECT"]),
      amount: z.number(),
      checkout_session_id: z.string().optional(),
      description: z.string().optional(),
      payment_method_type: z.string().optional(),
      ott: z.string().optional(),
      merchant_order_id: z.string().optional(),
      country: z.string().optional(),
      currency: z.string().optional(),
    }).refine((data) => {
      if (data.workflow === "SDK_CHECKOUT" && (!data.checkout_session_id || !data.ott)) {
        return false;
      }
      return true;
    }, "If workflow is SDK_CHECKOUT, checkout_session_id and ott are required"),
    idempotency_key: z.string().optional(),
  }, async ({ payment, idempotency_key }) => {
  try {
    if (!yunoClient) {
      return { content: [{ type: "text", text: "Yuno client not initialized" }] };
    }

    if (payment.workflow === "SDK_CHECKOUT") {
    const paymentResponse = await yunoClient.payments.create({
      description: payment.description ?? "Test payment",
      merchant_order_id: payment.merchant_order_id ?? randomUUID(),
      country: payment.country ?? "CO",
      amount: {
        currency: payment.currency,
        value: payment.amount,
      },
      workflow: payment.workflow,
      checkout: {
        session: payment.checkout_session_id!,
      },
      payment_method: {
        token: payment.ott,
        type: payment.payment_method_type,
      },
    }, idempotency_key);
    return {
      content: [
        {
          type: "text",
          text: `payment response: ${JSON.stringify(paymentResponse, null, 4)}`,
        },
      ],
    };
  }

  const paymentResponse = await yunoClient.payments.create({
    description: payment.description ?? "Test payment",
    merchant_order_id: payment.merchant_order_id ?? randomUUID(),
    country: payment.country ?? "CO",
    amount: {
      currency: payment.currency,
      value: payment.amount,
    },
    payment_method: {
      type: payment.payment_method_type!,
      token: payment.ott,
    },
    workflow: payment.workflow,
  }, idempotency_key);
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

server.tool("payments.read", { payment_id: z.string() }, async ({ payment_id }) => {
  try {
    if (!yunoClient) {
      return { content: [{ type: "text", text: "Yuno client not initialized" }] };
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

const DOCUMENTATION = {
  API_REFERENCE: {
    CUSTOMER: {
      CREATE: 'https://docs.y.uno/reference/create-customer.md',
      READ: 'https://docs.y.uno/reference/retrieve-customer.md'
    },
    CHECKOUT_SESSION: {
      CREATE: 'https://docs.y.uno/reference/create-checkout-session.md',
      READ: 'https://docs.y.uno/reference/retrieve-payment-methods-for-checkout.md',
    },
    PAYMENT: {
      CREATE: 'https://docs.y.uno/reference/create-payment.md',
      READ: 'https://docs.y.uno/reference/retrieve-payment-by-id.md',
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
    ANDROID: {
      INTEGRATIONS: "https://docs.y.uno/docs/android-sdk-integrations.md",
      REQUIREMENTS: "https://docs.y.uno/docs/requirements-android.md",
      RELEASE_NOTES: "https://docs.y.uno/docs/release-notes-android-sdk.md",
      FULL: "https://docs.y.uno/docs/full-checkout-android.md",
      LITE_PAYMENT: "https://docs.y.uno/docs/lite-checkout-android.md",
      LITE_ENROLLMENT: "https://docs.y.uno/docs/enrollment-android.md",
      SEAMLESS_PAYMENT: "https://docs.y.uno/docs/seamless-sdk-payment-android.md",
      HEADLESS_PAYMENT: "https://docs.y.uno/docs/headless-sdk-payment-android.md",
      HEADLESS_ENROLLMENT: "https://docs.y.uno/docs/headless-sdk-enrollment-android.md",
      CUSTOMIZATIONS: "https://docs.y.uno/docs/sdk-customizations-android.md",
    },
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
    }
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

server.tool("documentation.read", { documentation_type: z.enum(["createCustomer", "retrieveCustomer", "createCheckoutSession", "retrieveCheckoutSession", "createPayment", "retrievePayment", "guides", "web", "android", "ios", "unofficial.node", "unofficial.react"]) }, async ({ documentation_type }) => {
  try {
    if (documentation_type === "createCustomer") {
      const createCustomerDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.CREATE);
      const createCustomerDocsText = await createCustomerDocs.text();

      return {
        content: [{ type: "text", text: createCustomerDocsText }],
      };
    }

    if (documentation_type === "retrieveCustomer") {
      const retrieveCustomerDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.READ);
      const retrieveCustomerDocsText = await retrieveCustomerDocs.text();

      return {
        content: [{ type: "text", text: retrieveCustomerDocsText }],
      };
    }

    if (documentation_type === "createCheckoutSession") {
      const createCheckoutSessionDocs = await fetch(DOCUMENTATION.API_REFERENCE.CHECKOUT_SESSION.CREATE);
      const createCheckoutSessionDocsText = await createCheckoutSessionDocs.text();

      return {
        content: [{ type: "text", text: createCheckoutSessionDocsText }],
      };
    }
    
    if (documentation_type === "retrieveCheckoutSession") {
      const retrieveCheckoutSessionDocs = await fetch(DOCUMENTATION.API_REFERENCE.CHECKOUT_SESSION.READ);
      const retrieveCheckoutSessionDocsText = await retrieveCheckoutSessionDocs.text();

      return {
        content: [{ type: "text", text: retrieveCheckoutSessionDocsText }],
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
      const retrievePaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.READ);
      const retrievePaymentDocsText = await retrievePaymentDocs.text();

      return {
        content: [{ type: "text", text: retrievePaymentDocsText }],
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

    if (documentation_type === "android") {
      const androidPromises = Object.values(DOCUMENTATION.GUIDES.ANDROID).map((doc) => fetch(doc));

      const androidDocs = await Promise.all(androidPromises);
      const androidDocsText = await Promise.all(androidDocs.map((doc) => doc.text()));

      return {
        content: [{ type: "text", text: androidDocsText.join("\n\n") }],
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

const transport = new StdioServerTransport();
await server.connect(transport);
