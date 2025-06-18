import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CheckoutSessionInput, CustomerInput, PaymentInput, YunoClient } from "@latiscript/yuno-node";
import { env } from "process";
import { z } from "zod";
import { randomUUID } from "node:crypto";
let yunoClient: ReturnType<typeof YunoClient.initialize>;

const server = new McpServer({
  name: "yuno-mcp",
  version: "1.2.3",
});

async function initializeYunoClient() {
  try {
  yunoClient = await YunoClient.initialize({
    accountCode: (env.YUNO_ACCOUNT_CODE as string),
    publicApiKey: (env.YUNO_PUBLIC_API_KEY as string),
    privateSecretKey: (env.YUNO_PRIVATE_SECRET_KEY as string),
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
    customer: z.custom<CustomerInput>(),
  },
  async ({ customer }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }

      const customerResponse = await yunoClient.customers.create(customer);
    return { content: [{ type: "text", text: `customer response: ${JSON.stringify(customerResponse, null, 4)}` }] };
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
  { checkoutSession: z.custom<CheckoutSessionInput>() },
  async ({ checkoutSession }) => {
    try {
      if (!yunoClient) {
        await initializeYunoClient();
      }

      const checkoutSessionResponse = await yunoClient.checkoutSessions.create(checkoutSession);
    return {
      content: [{ type: "text", text: `checkout session response: ${JSON.stringify(checkoutSessionResponse, null, 4)}` }],
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
    payment: z.custom<PaymentInput>(),
    idempotency_key: z.string().optional(),
  }, async ({ payment, idempotency_key }) => {
  try {
    if (!yunoClient) {
      await initializeYunoClient();
    }

    if (payment.workflow === "SDK_CHECKOUT") {
      if (!payment.checkout.session || !payment.payment_method.token) {
        return {
          content: [{ type: "text", text: "If workflow is SDK_CHECKOUT, checkout_session_id and ott are required" }],
        };
      }
    }

    if (payment.workflow === "SDK_CHECKOUT") {
    const paymentResponse = await yunoClient.payments.create({
      description: payment.description ?? "Test payment",
      merchant_order_id: payment.merchant_order_id ?? randomUUID(),
      country: payment.country,
      amount: payment.amount,
      workflow: payment.workflow,
      checkout: {
        session: payment.checkout.session,
      },
      payment_method: {
        token: payment.payment_method.token,
        type: payment.payment_method.type,
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
    country: payment.country,
    amount: payment.amount,
    payment_method: {
      type: payment.payment_method.type,
      token: payment.payment_method.token,
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

server.tool("documentation.read", { documentation_type: z.enum(["createCustomer", "retrieveCustomer", "createCheckoutSession", "retrieveCheckoutSession", "createPayment", "retrievePayment", "guides", "web", "web_v_1_1", "android", "android_release_notes", "ios", "ios_release_notes", "unofficial.node", "unofficial.react"]) }, async ({ documentation_type }) => {
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
