import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { YunoClient } from "./client";
import { env } from "process";
import { z } from "zod";
import { randomUUID } from 'crypto';
import { tools } from "./tools";
let yunoClient: Awaited<ReturnType<typeof YunoClient.initialize>>;

const server = new McpServer({
  name: "yuno-mcp",
  version: "1.2.3",
});

async function initializeYunoClient() {
  try {
  yunoClient = await YunoClient.initialize({
    accountCode: process.env.YUNO_ACCOUNT_CODE as string,
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

for (const tool of tools) {
  server.tool(
    tool.method,
    tool.schema.shape,
    async (params: any, extra: any) => {
      try {
        if (!yunoClient) {
          await initializeYunoClient();
        }
        return await tool.handler(yunoClient, params, extra);
      } catch (error) {
        if (error instanceof Error) {
          return { content: [{ type: "text" as const, text: error.message }] };
        }
        return { content: [{ type: "text" as const, text: "An unknown error occurred" }] };
      }
    }
  );
}

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
      CAPTURE_AUTHORIZATION: 'https://docs.y.uno/reference/capture-authorization.md',
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
