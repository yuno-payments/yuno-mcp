import { documentationReadSchema } from "../../schemas";
import type { HandlerContext, Output, Tool } from "../../types";
import type { DocumentationReadSchema } from "./types";

const DOCUMENTATION = {
  API_REFERENCE: {
    CUSTOMER: {
      CREATE: "https://docs.y.uno/reference/create-customer.md",
      RETRIEVE: "https://docs.y.uno/reference/retrieve-customer.md",
      RETRIEVE_BY_EXTERNAL_ID: "https://docs.y.uno/reference/retrieve-customer-by-external-id.md",
      UPDATE: "https://docs.y.uno/reference/update-customer.md",
    },
    PAYMENT_METHOD: {
      ENROLL: "https://docs.y.uno/reference/enroll-payment-method-api.md",
      RETRIEVE: "https://docs.y.uno/reference/retrieve-enrolled-payment-method-by-id-api.md",
      RETRIEVE_ENROLLED: "https://docs.y.uno/reference/retrieve-enrolled-payment-methods-api.md",
      UNENROLL: "https://docs.y.uno/reference/unenroll-payment-method-checkout.md",
    },
    CHECKOUT_SESSION: {
      CREATE: "https://docs.y.uno/reference/create-checkout-session.md",
      RETRIEVE_PAYMENT_METHODS: "https://docs.y.uno/reference/retrieve-payment-methods-for-checkout.md",
      CREATE_OTT: "https://docs.y.uno/docs/yuno-testing-gateway.md",
    },
    PAYMENT: {
      CREATE: "https://docs.y.uno/reference/create-payment.md",
      RETRIEVE: "https://docs.y.uno/reference/retrieve-payment-by-id.md",
      RETRIEVE_BY_MERCHANT_ORDER_ID: "https://docs.y.uno/reference/retrieve-payment-by-merchant-order-id.md",
      REFUND: "https://docs.y.uno/reference/refund-payment.md",
      CANCEL: "https://docs.y.uno/reference/cancel-payment.md",
      CANCEL_OR_REFUND: "https://docs.y.uno/reference/cancel-or-refund-a-payment.md",
      CANCEL_OR_REFUND_WITH_TRANSACTION: "https://docs.y.uno/reference/cancel-or-refund-payment-with-transaction.md",
      AUTHORIZE: "https://docs.y.uno/reference/authorize-payment.md",
      CAPTURE_AUTHORIZATION: "https://docs.y.uno/reference/capture-authorization.md",
    },
    PAYMENT_LINK: {
      CREATE: "https://docs.y.uno/reference/create-payment-link.md",
      RETRIEVE: "https://docs.y.uno/reference/retrieve-payment-link.md",
      CANCEL: "https://docs.y.uno/reference/cancel-payment-link.md",
    },
    SUBSCRIPTION: {
      CREATE: "https://docs.y.uno/reference/create-subscription.md",
      RETRIEVE: "https://docs.y.uno/reference/retrieve-subscription.md",
      PAUSE: "https://docs.y.uno/reference/pause-subscription.md",
      RESUME: "https://docs.y.uno/reference/resume-subscription.md",
      UPDATE: "https://docs.y.uno/reference/update-subscription.md",
      CANCEL: "https://docs.y.uno/reference/cancel-subscription.md",
    },
    RECIPIENT: {
      CREATE: "https://docs.y.uno/reference/create-recipient-1.md",
      RETRIEVE: "https://docs.y.uno/reference/get-recipient.md",
      UPDATE: "https://docs.y.uno/reference/update-recipient-1.md",
      DELETE: "https://docs.y.uno/reference/delete-recipient.md",
      CREATE_ONBOARDING: "https://docs.y.uno/reference/create-onboarding.md",
    },
    INSTALLMENTS_PLAN: {
      CREATE: "https://docs.y.uno/reference/create-installments-plan.md",
      RETRIEVE: "https://docs.y.uno/reference/get-installments-plan.md",
      RETRIEVE_ALL: "https://docs.y.uno/reference/get-installments-plan-by-account.md",
      UPDATE: "https://docs.y.uno/reference/update-plan.md",
      DELETE: "https://docs.y.uno/reference/delete-installments-plan-by-id.md",
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
      DOCS: "https://raw.githubusercontent.com/latiscript/yuno-js/refs/heads/main/packages/yuno-node/README.md",
      EXAMPLE: "https://raw.githubusercontent.com/latiscript/yuno-js/refs/heads/main/examples/react-express/express/src/index.ts",
    },
    YUNO_REACT: {
      DOCS: "https://raw.githubusercontent.com/latiscript/yuno-js/refs/heads/main/packages/yuno-react/README.md",
      EXAMPLE: "https://raw.githubusercontent.com/latiscript/yuno-js/refs/heads/main/examples/react-express/react/src/components/Full.tsx",
    },
  },
} as const;

const documentationReadTool = {
  method: "documentationRead",
  description: "Read a documentation",
  schema: documentationReadSchema,
  handler:
    <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
    async ({ documentation_type }: DocumentationReadSchema): Promise<Output<TType, any>> => {
      if (type === "object") {
        throw new Error("Documentation tool only supports text output");
      }

      try {
        if (documentation_type === "createCustomer") {
          const createCustomerDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.CREATE);
          const createCustomerDocsText = await createCustomerDocs.text();
          return { content: [{ type: "text" as const, text: createCustomerDocsText }] } as Output<TType>;
        }

        if (documentation_type === "retrieveCustomer") {
          const retrieveCustomerDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.RETRIEVE);
          const retrieveCustomerDocsText = await retrieveCustomerDocs.text();
          return { content: [{ type: "text" as const, text: retrieveCustomerDocsText }] } as Output<TType>;
        }

        if (documentation_type === "retrieveCustomerByExternalId") {
          const retrieveCustomerByExternalIdDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.RETRIEVE_BY_EXTERNAL_ID);
          const retrieveCustomerByExternalIdDocsText = await retrieveCustomerByExternalIdDocs.text();
          return {
            content: [{ type: "text" as const, text: retrieveCustomerByExternalIdDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "updateCustomer") {
          const updateCustomerDocs = await fetch(DOCUMENTATION.API_REFERENCE.CUSTOMER.UPDATE);
          const updateCustomerDocsText = await updateCustomerDocs.text();
          return { content: [{ type: "text" as const, text: updateCustomerDocsText }] } as Output<TType>;
        }

        if (documentation_type === "enrollPaymentMethod") {
          const enrollPaymentMethodDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT_METHOD.ENROLL);
          const enrollPaymentMethodDocsText = await enrollPaymentMethodDocs.text();
          return {
            content: [{ type: "text" as const, text: await enrollPaymentMethodDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "retrievePaymentMethod") {
          const retrievePaymentMethodDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT_METHOD.RETRIEVE);
          const retrievePaymentMethodDocsText = await retrievePaymentMethodDocs.text();
          return {
            content: [{ type: "text" as const, text: await retrievePaymentMethodDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "retrieveEnrolledPaymentMethods") {
          const retrieveEnrolledPaymentMethodsDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT_METHOD.RETRIEVE_ENROLLED);
          const retrieveEnrolledPaymentMethodsDocsText = await retrieveEnrolledPaymentMethodsDocs.text();
          return {
            content: [
              {
                type: "text" as const,
                text: await retrieveEnrolledPaymentMethodsDocsText,
              },
            ],
          } as Output<TType>;
        }

        if (documentation_type === "unenrollPaymentMethod") {
          const unenrollPaymentMethodDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT_METHOD.UNENROLL);
          const unenrollPaymentMethodDocsText = await unenrollPaymentMethodDocs.text();
          return {
            content: [{ type: "text" as const, text: await unenrollPaymentMethodDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "createCheckoutSession") {
          const createCheckoutSessionDocs = await fetch(DOCUMENTATION.API_REFERENCE.CHECKOUT_SESSION.CREATE);
          const createCheckoutSessionDocsText = await createCheckoutSessionDocs.text();
          return {
            content: [{ type: "text" as const, text: createCheckoutSessionDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "retrievePaymentMethodsForCheckoutSession") {
          const retrievePaymentMethodsForCheckoutSessionDocs = await fetch(DOCUMENTATION.API_REFERENCE.CHECKOUT_SESSION.RETRIEVE_PAYMENT_METHODS);
          const retrievePaymentMethodsForCheckoutSessionDocsText = await retrievePaymentMethodsForCheckoutSessionDocs.text();
          return {
            content: [
              {
                type: "text" as const,
                text: retrievePaymentMethodsForCheckoutSessionDocsText,
              },
            ],
          } as Output<TType>;
        }

        if (documentation_type === "createOttForCheckoutSession") {
          const createOttForCheckoutSessionDocs = await fetch(DOCUMENTATION.API_REFERENCE.CHECKOUT_SESSION.CREATE_OTT);
          const createOttForCheckoutSessionDocsText = await createOttForCheckoutSessionDocs.text();
          return {
            content: [
              {
                type: "text" as const,
                text: createOttForCheckoutSessionDocsText,
              },
            ],
          } as Output<TType>;
        }

        if (documentation_type === "createPayment") {
          const createPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CREATE);
          const createPaymentDocsText = await createPaymentDocs.text();
          return { content: [{ type: "text" as const, text: createPaymentDocsText }] } as Output<TType>;
        }

        if (documentation_type === "retrievePayment") {
          const retrievePaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.RETRIEVE);
          const retrievePaymentDocsText = await retrievePaymentDocs.text();
          return { content: [{ type: "text" as const, text: retrievePaymentDocsText }] } as Output<TType>;
        }

        if (documentation_type === "retrievePaymentByMerchantOrderId") {
          const retrievePaymentByMerchantOrderIdDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.RETRIEVE_BY_MERCHANT_ORDER_ID);
          const retrievePaymentByMerchantOrderIdDocsText = await retrievePaymentByMerchantOrderIdDocs.text();
          return {
            content: [{ type: "text" as const, text: retrievePaymentByMerchantOrderIdDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "refundPayment") {
          const refundPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.REFUND);
          const refundPaymentDocsText = await refundPaymentDocs.text();
          return { content: [{ type: "text" as const, text: refundPaymentDocsText }] } as Output<TType>;
        }

        if (documentation_type === "cancelOrRefundPayment") {
          const cancelOrRefundPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CANCEL_OR_REFUND);
          const cancelOrRefundPaymentDocsText = await cancelOrRefundPaymentDocs.text();
          return {
            content: [{ type: "text" as const, text: cancelOrRefundPaymentDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "cancelOrRefundWithTransactionPayment") {
          const cancelOrRefundWithTransactionPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CANCEL_OR_REFUND_WITH_TRANSACTION);
          const cancelOrRefundWithTransactionPaymentDocsText = await cancelOrRefundWithTransactionPaymentDocs.text();
          return {
            content: [
              {
                type: "text" as const,
                text: cancelOrRefundWithTransactionPaymentDocsText,
              },
            ],
          } as Output<TType>;
        }

        if (documentation_type === "cancelPayment") {
          const cancelPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CANCEL);
          const cancelPaymentDocsText = await cancelPaymentDocs.text();
          return { content: [{ type: "text" as const, text: cancelPaymentDocsText }] } as Output<TType>;
        }

        if (documentation_type === "authorizePayment") {
          const authorizePaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.AUTHORIZE);
          const authorizePaymentDocsText = await authorizePaymentDocs.text();
          return { content: [{ type: "text" as const, text: authorizePaymentDocsText }] } as Output<TType>;
        }

        if (documentation_type === "captureAuthorizationPayment") {
          const captureAuthorizationPaymentDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT.CAPTURE_AUTHORIZATION);
          const captureAuthorizationPaymentDocsText = await captureAuthorizationPaymentDocs.text();
          return {
            content: [{ type: "text" as const, text: captureAuthorizationPaymentDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "createPaymentLink") {
          const createPaymentLinkDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT_LINK.CREATE);
          const createPaymentLinkDocsText = await createPaymentLinkDocs.text();
          return { content: [{ type: "text" as const, text: createPaymentLinkDocsText }] } as Output<TType>;
        }

        if (documentation_type === "retrievePaymentLink") {
          const retrievePaymentLinkDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT_LINK.RETRIEVE);
          const retrievePaymentLinkDocsText = await retrievePaymentLinkDocs.text();
          return {
            content: [{ type: "text" as const, text: retrievePaymentLinkDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "cancelPaymentLink") {
          const cancelPaymentLinkDocs = await fetch(DOCUMENTATION.API_REFERENCE.PAYMENT_LINK.CANCEL);
          const cancelPaymentLinkDocsText = await cancelPaymentLinkDocs.text();
          return { content: [{ type: "text" as const, text: cancelPaymentLinkDocsText }] } as Output<TType>;
        }

        if (documentation_type === "createSubscription") {
          const createSubscriptionDocs = await fetch(DOCUMENTATION.API_REFERENCE.SUBSCRIPTION.CREATE);
          const createSubscriptionDocsText = await createSubscriptionDocs.text();
          return {
            content: [{ type: "text" as const, text: createSubscriptionDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "retrieveSubscription") {
          const retrieveSubscriptionDocs = await fetch(DOCUMENTATION.API_REFERENCE.SUBSCRIPTION.RETRIEVE);
          const retrieveSubscriptionDocsText = await retrieveSubscriptionDocs.text();
          return {
            content: [{ type: "text" as const, text: retrieveSubscriptionDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "pauseSubscription") {
          const pauseSubscriptionDocs = await fetch(DOCUMENTATION.API_REFERENCE.SUBSCRIPTION.PAUSE);
          const pauseSubscriptionDocsText = await pauseSubscriptionDocs.text();
          return { content: [{ type: "text" as const, text: pauseSubscriptionDocsText }] } as Output<TType>;
        }

        if (documentation_type === "resumeSubscription") {
          const resumeSubscriptionDocs = await fetch(DOCUMENTATION.API_REFERENCE.SUBSCRIPTION.RESUME);
          const resumeSubscriptionDocsText = await resumeSubscriptionDocs.text();
          return {
            content: [{ type: "text" as const, text: resumeSubscriptionDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "updateSubscription") {
          const updateSubscriptionDocs = await fetch(DOCUMENTATION.API_REFERENCE.SUBSCRIPTION.UPDATE);
          const updateSubscriptionDocsText = await updateSubscriptionDocs.text();
          return {
            content: [{ type: "text" as const, text: updateSubscriptionDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "cancelSubscription") {
          const cancelSubscriptionDocs = await fetch(DOCUMENTATION.API_REFERENCE.SUBSCRIPTION.CANCEL);
          const cancelSubscriptionDocsText = await cancelSubscriptionDocs.text();
          return {
            content: [{ type: "text" as const, text: cancelSubscriptionDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "createRecipient") {
          const createRecipientDocs = await fetch(DOCUMENTATION.API_REFERENCE.RECIPIENT.CREATE);
          const createRecipientDocsText = await createRecipientDocs.text();
          return { content: [{ type: "text" as const, text: createRecipientDocsText }] } as Output<TType>;
        }

        if (documentation_type === "retrieveRecipient") {
          const retrieveRecipientDocs = await fetch(DOCUMENTATION.API_REFERENCE.RECIPIENT.RETRIEVE);
          const retrieveRecipientDocsText = await retrieveRecipientDocs.text();
          return { content: [{ type: "text" as const, text: retrieveRecipientDocsText }] } as Output<TType>;
        }

        if (documentation_type === "updateRecipient") {
          const updateRecipientDocs = await fetch(DOCUMENTATION.API_REFERENCE.RECIPIENT.UPDATE);
          const updateRecipientDocsText = await updateRecipientDocs.text();
          return { content: [{ type: "text" as const, text: updateRecipientDocsText }] } as Output<TType>;
        }

        if (documentation_type === "deleteRecipient") {
          const deleteRecipientDocs = await fetch(DOCUMENTATION.API_REFERENCE.RECIPIENT.DELETE);
          const deleteRecipientDocsText = await deleteRecipientDocs.text();
          return { content: [{ type: "text" as const, text: deleteRecipientDocsText }] } as Output<TType>;
        }

        if (documentation_type === "createRecipientOnboarding") {
          const createRecipientOnboardingDocs = await fetch(DOCUMENTATION.API_REFERENCE.RECIPIENT.CREATE_ONBOARDING);
          const createRecipientOnboardingDocsText = await createRecipientOnboardingDocs.text();
          return {
            content: [{ type: "text" as const, text: createRecipientOnboardingDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "createInstallmentPlan") {
          const createInstallmentPlanDocs = await fetch(DOCUMENTATION.API_REFERENCE.INSTALLMENTS_PLAN.CREATE);
          const createInstallmentPlanDocsText = await createInstallmentPlanDocs.text();
          return {
            content: [{ type: "text" as const, text: createInstallmentPlanDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "retrieveInstallmentPlan") {
          const retrieveInstallmentPlanDocs = await fetch(DOCUMENTATION.API_REFERENCE.INSTALLMENTS_PLAN.RETRIEVE);
          const retrieveInstallmentPlanDocsText = await retrieveInstallmentPlanDocs.text();
          return {
            content: [{ type: "text" as const, text: retrieveInstallmentPlanDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "retrieveAllInstallmentPlans") {
          const retrieveAllInstallmentPlansDocs = await fetch(DOCUMENTATION.API_REFERENCE.INSTALLMENTS_PLAN.RETRIEVE_ALL);
          const retrieveAllInstallmentPlansDocsText = await retrieveAllInstallmentPlansDocs.text();
          return {
            content: [{ type: "text" as const, text: retrieveAllInstallmentPlansDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "updateInstallmentPlan") {
          const updateInstallmentPlanDocs = await fetch(DOCUMENTATION.API_REFERENCE.INSTALLMENTS_PLAN.UPDATE);
          const updateInstallmentPlanDocsText = await updateInstallmentPlanDocs.text();
          return {
            content: [{ type: "text" as const, text: updateInstallmentPlanDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "deleteInstallmentPlan") {
          const deleteInstallmentPlanDocs = await fetch(DOCUMENTATION.API_REFERENCE.INSTALLMENTS_PLAN.DELETE);
          const deleteInstallmentPlanDocsText = await deleteInstallmentPlanDocs.text();
          return {
            content: [{ type: "text" as const, text: deleteInstallmentPlanDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "guides") {
          const skdsDocs = await fetch(DOCUMENTATION.GUIDES.SKDS);
          const skdsDocsText = await skdsDocs.text();
          const countryCoverageDocs = await fetch(DOCUMENTATION.GUIDES.COUNTRY_COVERAGE);
          const countryCoverageDocsText = await countryCoverageDocs.text();

          return {
            content: [
              { type: "text" as const, text: skdsDocsText },
              { type: "text" as const, text: countryCoverageDocsText },
            ],
          } as Output<TType>;
        }

        if (documentation_type === "web") {
          const webPromises = Object.values(DOCUMENTATION.GUIDES.WEB).map((doc) => fetch(doc));
          const webDocs = await Promise.all(webPromises);
          const webDocsText = await Promise.all(webDocs.map((doc) => doc.text()));

          return {
            content: [{ type: "text" as const, text: webDocsText.join("\n\n") }],
          } as Output<TType>;
        }

        if (documentation_type === "web_v_1_1") {
          const webV11Docs = await fetch(DOCUMENTATION.GUIDES.WEB_V_1_1);
          const webV11DocsText = await webV11Docs.text();

          return {
            content: [{ type: "text" as const, text: webV11DocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "android") {
          const androidPromises = Object.values(DOCUMENTATION.GUIDES.ANDROID).map((doc) => fetch(doc));

          const androidDocs = await Promise.all(androidPromises);
          const androidDocsText = await Promise.all(androidDocs.map((doc) => doc.text()));

          return {
            content: [{ type: "text" as const, text: androidDocsText.join("\n\n") }],
          } as Output<TType>;
        }

        if (documentation_type === "android_release_notes") {
          const androidReleaseNotesDocs = await fetch(DOCUMENTATION.GUIDES.ANDROID_RELEASE_NOTES);
          const androidReleaseNotesDocsText = await androidReleaseNotesDocs.text();

          return {
            content: [{ type: "text" as const, text: androidReleaseNotesDocsText }],
          } as Output<TType>;
        }

        if (documentation_type === "ios") {
          const iosPromises = Object.values(DOCUMENTATION.GUIDES.IOS).map((doc) => fetch(doc));
          const iosDocs = await Promise.all(iosPromises);
          const iosDocsText = await Promise.all(iosDocs.map((doc) => doc.text()));

          return {
            content: [{ type: "text" as const, text: iosDocsText.join("\n\n") }],
          } as Output<TType>;
        }

        if (documentation_type === "unofficial.node") {
          const unofficialNodeDocs = await fetch(DOCUMENTATION.UNOFFICIAL.YUNO_NODE.DOCS);
          const unofficialNodeDocsText = await unofficialNodeDocs.text();

          const unofficialNodeExample = await fetch(DOCUMENTATION.UNOFFICIAL.YUNO_NODE.EXAMPLE);
          const unofficialNodeExampleText = await unofficialNodeExample.text();

          return {
            content: [
              {
                type: "text" as const,
                text: `latiscript/yuno-node: ${unofficialNodeDocsText}`,
              },
              {
                type: "text" as const,
                text: `latiscript/yuno-node example: ${unofficialNodeExampleText}`,
              },
            ],
          } as Output<TType>;
        }

        if (documentation_type === "unofficial.react") {
          const unofficialReactDocs = await fetch(DOCUMENTATION.UNOFFICIAL.YUNO_REACT.DOCS);
          const unofficialReactDocsText = await unofficialReactDocs.text();

          const unofficialReactExample = await fetch(DOCUMENTATION.UNOFFICIAL.YUNO_REACT.EXAMPLE);
          const unofficialReactExampleText = await unofficialReactExample.text();

          return {
            content: [
              {
                type: "text" as const,
                text: `latiscript/yuno-react: ${unofficialReactDocsText}`,
              },
              {
                type: "text" as const,
                text: `latiscript/yuno-react example: ${unofficialReactExampleText}`,
              },
            ],
          } as Output<TType>;
        }

        return {
          content: [{ type: "text" as const, text: "Documentation not found" }],
        } as Output<TType>;
      } catch (error) {
        if (error instanceof Error) {
          return {
            content: [{ type: "text" as const, text: error.message }],
          } as Output<TType>;
        }
        return {
          content: [{ type: "text" as const, text: "An unknown error occurred" }],
        } as Output<TType>;
      }
    },
} as const satisfies Tool;

export const documentationTools = [documentationReadTool] as const satisfies Tool[];
export type * from "./types";
