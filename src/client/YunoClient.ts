import { YunoCheckoutPaymentMethodsResponse, YunoCheckoutSession, YunoOttRequest, YunoOttResponse } from "../tools/checkouts/types";
import { YunoCustomer } from "../tools/customers/types";
import { InstallmentPlanCreateSchema, InstallmentPlanUpdateBody, YunoInstallmentPlan } from "../tools/installmentPlans/types";
import { PaymentLinkCancelSchema, YunoPaymentLink } from "../tools/paymentLinks/types";
import { PaymentMethodEnrollSchema, YunoPaymentMethod } from "../tools/paymentMethods/types";
import {
  PaymentCancelSchema,
  PaymentCaptureAuthorizationSchema,
  PaymentCreateBody,
  PaymentCreateSchema,
  PaymentRefundSchema,
  YunoPayment,
} from "../tools/payments/types";
import { RecipientCreateSchema, RecipientUpdateBody, YunoRecipient } from "../tools/recipients/types";
import { SubscriptionUpdateBody, YunoSubscription } from "../tools/subscriptions/types";
import type { ApiKeyPrefix, ApiKeyPrefixToEnvironmentSuffix, EnvironmentSuffix, YunoClientConfig } from "./types";

const apiKeyPrefixToEnvironmentSuffix = {
  dev: "-dev",
  staging: "-staging",
  sandbox: "-sandbox",
  prod: "",
} as const satisfies ApiKeyPrefixToEnvironmentSuffix;

function generateBaseUrlApi(publicApiKey: string) {
  const [apiKeyPrefix] = publicApiKey.split("_");
  const environmentSuffix = apiKeyPrefixToEnvironmentSuffix[apiKeyPrefix as ApiKeyPrefix] as EnvironmentSuffix;
  const baseURL = `https://api${environmentSuffix}.y.uno/v1` as const;

  return baseURL;
}

async function requestHandler<TReturn>(opts: {
  publicApiKey: string;
  privateSecretKey: string;
  endpoint: string;
  options: RequestInit;
}): Promise<TReturn> {
  try {
    const { publicApiKey, privateSecretKey, endpoint, options } = opts;
    const baseUrl = generateBaseUrlApi(publicApiKey);
    const url = `${baseUrl}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      "public-api-key": publicApiKey,
      "private-secret-key": privateSecretKey,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      console.log("error", error.message);
      throw new Error(error.message);
    }
    throw new Error("An error occurred while making the request");
  }
}

function handleCustomerMethods(publicApiKey: string, privateSecretKey: string) {
  return {
    create: async (customer: YunoCustomer) => {
      return requestHandler<YunoCustomer>({
        publicApiKey,
        privateSecretKey,
        endpoint: "/customers",
        options: { method: "POST", body: JSON.stringify(customer) },
      });
    },
    retrieve: async (customerId: string) => {
      return requestHandler<YunoCustomer>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/customers/${customerId}`,
        options: { method: "GET" },
      });
    },
    retrieveByExternalId: async (merchant_customer_id: string) => {
      return requestHandler<YunoCustomer>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/customers?merchant_customer_id=${encodeURIComponent(merchant_customer_id)}`,
        options: { method: "GET" },
      });
    },
    update: async (customerId: string, updateFields: Partial<YunoCustomer>) => {
      return requestHandler<YunoCustomer>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/customers/${customerId}`,
        options: { method: "PATCH", body: JSON.stringify(updateFields) },
      });
    },
  };
}

function handlePaymentMethodsMethods(publicApiKey: string, privateSecretKey: string) {
  return {
    enroll: async (customerId: string, body: PaymentMethodEnrollSchema, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers["x-idempotency-key"] = idempotencyKey;
      return requestHandler<YunoPaymentMethod>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/customers/${customerId}/payment-methods`,
        options: { method: "POST", headers, body: JSON.stringify(body) },
      });
    },
    retrieve: async (customerId: string, paymentMethodId: string) => {
      return requestHandler<YunoPaymentMethod>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/customers/${customerId}/payment-methods/${paymentMethodId}`,
        options: { method: "GET" },
      });
    },
    retrieveEnrolled: async (customerId: string) => {
      return requestHandler<YunoPaymentMethod[]>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/customers/${customerId}/payment-methods`,
        options: { method: "GET" },
      });
    },
    unenroll: async (customerId: string, paymentMethodId: string) => {
      return requestHandler<YunoPaymentMethod>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/customers/${customerId}/payment-methods/${paymentMethodId}/unenroll`,
        options: { method: "POST" },
      });
    },
  };
}

function handleCheckoutSessionsMethods(publicApiKey: string, privateSecretKey: string) {
  return {
    create: async (checkoutSession: YunoCheckoutSession) => {
      return requestHandler<YunoCheckoutSession>({
        publicApiKey,
        privateSecretKey,
        endpoint: "/checkout/sessions",
        options: { method: "POST", body: JSON.stringify(checkoutSession) },
      });
    },
    retrievePaymentMethods: async (sessionId: string) => {
      return requestHandler<YunoCheckoutPaymentMethodsResponse>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/checkout/sessions/${sessionId}/payment-methods`,
        options: { method: "GET" },
      });
    },
    createOtt: async (sessionId: string, ottRequest: YunoOttRequest) => {
      return requestHandler<YunoOttResponse>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/checkout/sessions/${sessionId}/token`,
        options: { method: "POST", body: JSON.stringify(ottRequest) },
      });
    },
  };
}

function handlePaymentsMethods(publicApiKey: string, privateSecretKey: string) {
  return {
    create: async (payment: PaymentCreateBody, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers["x-idempotency-key"] = idempotencyKey;
      return requestHandler<YunoPayment>({
        publicApiKey,
        privateSecretKey,
        endpoint: "/payments",
        options: { method: "POST", headers, body: JSON.stringify(payment) },
      });
    },
    retrieve: async (paymentId: string) => {
      return requestHandler<YunoPayment>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payments/${paymentId}`,
        options: { method: "GET" },
      });
    },
    retrieveByMerchantOrderId: async (merchant_order_id: string) => {
      return requestHandler<YunoPayment[]>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payments?merchant_order_id=${encodeURIComponent(merchant_order_id)}`,
        options: { method: "GET" },
      });
    },
    refund: async (paymentId: string, transactionId: string, body: PaymentRefundSchema, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers["x-idempotency-key"] = idempotencyKey;
      return requestHandler<any>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payments/${paymentId}/transactions/${transactionId}/refund`,
        options: { method: "POST", headers, body: JSON.stringify(body) },
      });
    },
    cancelOrRefund: async (paymentId: string, body: PaymentRefundSchema, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers["x-idempotency-key"] = idempotencyKey;
      return requestHandler<any>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payments/${paymentId}/cancel-or-refund`,
        options: { method: "POST", headers, body: JSON.stringify(body) },
      });
    },
    cancelOrRefundWithTransaction: async (paymentId: string, transactionId: string, body: PaymentRefundSchema, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers["x-idempotency-key"] = idempotencyKey;
      return requestHandler<any>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payments/${paymentId}/transactions/${transactionId}/cancel-or-refund`,
        options: { method: "POST", headers, body: JSON.stringify(body) },
      });
    },
    cancel: async (paymentId: string, transactionId: string, body: PaymentCancelSchema, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers["x-idempotency-key"] = idempotencyKey;
      return requestHandler<any>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payments/${paymentId}/transactions/${transactionId}/cancel`,
        options: { method: "POST", headers, body: JSON.stringify(body) },
      });
    },
    authorize: async (payment: PaymentCreateSchema["payment"], idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers["x-idempotency-key"] = idempotencyKey;
      if (payment && payment.payment_method && payment.payment_method.detail && payment.payment_method.detail.card) {
        payment.payment_method.detail.card.capture = false;
      }
      return requestHandler<YunoPayment>({
        publicApiKey,
        privateSecretKey,
        endpoint: "/payments",
        options: { method: "POST", headers, body: JSON.stringify(payment) },
      });
    },
    captureAuthorization: async (paymentId: string, transactionId: string, body: PaymentCaptureAuthorizationSchema, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers["x-idempotency-key"] = idempotencyKey;
      return requestHandler<any>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payments/${paymentId}/transactions/${transactionId}/capture`,
        options: { method: "POST", headers, body: JSON.stringify(body) },
      });
    },
  };
}

function handlePaymentLinksMethods(accountCode: string, publicApiKey: string, privateSecretKey: string) {
  return {
    create: async (paymentLink: YunoPaymentLink) => {
      const paymentLinkWithAccount = {
        ...paymentLink,
        account_id: paymentLink.account_id || accountCode,
      };
      return requestHandler<YunoPaymentLink>({
        publicApiKey,
        privateSecretKey,
        endpoint: "/payment-links",
        options: { method: "POST", body: JSON.stringify(paymentLinkWithAccount) },
      });
    },
    retrieve: async (paymentLinkId: string) => {
      return requestHandler<YunoPaymentLink>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payment-links/${paymentLinkId}`,
        options: { method: "GET" },
      });
    },
    cancel: async (paymentLinkId: string, body: PaymentLinkCancelSchema) => {
      return requestHandler<YunoPaymentLink>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/payment-links/${paymentLinkId}/cancel`,
        options: { method: "POST", body: JSON.stringify(body) },
      });
    },
  };
}

function handleSubscriptionsMethods(accountCode: string, publicApiKey: string, privateSecretKey: string) {
  return {
    create: async (subscription: YunoSubscription) => {
      const subscriptionWithAccount = {
        ...subscription,
        account_id: subscription.account_id || accountCode,
      };
      return requestHandler<YunoSubscription>({
        publicApiKey,
        privateSecretKey,
        endpoint: "/subscriptions",
        options: { method: "POST", body: JSON.stringify(subscriptionWithAccount) },
      });
    },
    retrieve: async (subscriptionId: string) => {
      return requestHandler<YunoSubscription>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/subscriptions/${subscriptionId}`,
        options: { method: "GET" },
      });
    },
    pause: async (subscriptionId: string) => {
      return requestHandler<YunoSubscription>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/subscriptions/${subscriptionId}/pause`,
        options: { method: "POST" },
      });
    },
    resume: async (subscriptionId: string) => {
      return requestHandler<YunoSubscription>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/subscriptions/${subscriptionId}/resume`,
        options: { method: "POST" },
      });
    },
    update: async (subscriptionId: string, updateFields: SubscriptionUpdateBody) => {
      return requestHandler<YunoSubscription>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/subscriptions/${subscriptionId}`,
        options: { method: "PATCH", body: JSON.stringify(updateFields) },
      });
    },
    cancel: async (subscriptionId: string) => {
      return requestHandler<YunoSubscription>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/subscriptions/${subscriptionId}/cancel`,
        options: { method: "POST" },
      });
    },
  };
}

function handleRecipientsMethods(accountCode: string, publicApiKey: string, privateSecretKey: string) {
  return {
    create: async (recipient: RecipientCreateSchema) => {
      const recipientWithAccount = {
        ...recipient,
        account_id: recipient.account_id || accountCode,
      };
      return requestHandler<YunoRecipient>({
        publicApiKey,
        privateSecretKey,
        endpoint: "/recipients",
        options: { method: "POST", body: JSON.stringify(recipientWithAccount) },
      });
    },
    retrieve: async (recipientId: string) => {
      return requestHandler<YunoRecipient>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/recipients/${recipientId}?account_id=${accountCode}`,
        options: { method: "GET" },
      });
    },
    update: async (recipientId: string, updateFields: RecipientUpdateBody) => {
      return requestHandler<YunoRecipient>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/recipients/${recipientId}`,
        options: { method: "PATCH", body: JSON.stringify(updateFields) },
      });
    },
    delete: async (recipientId: string) => {
      return requestHandler<YunoRecipient>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/recipients/${recipientId}`,
        options: { method: "DELETE" },
      });
    },
  };
}

function handleInstallmentPlansMethods(accountCode: string, publicApiKey: string, privateSecretKey: string) {
  return {
    create: async (installmentPlan: InstallmentPlanCreateSchema) => {
      const installmentPlanWithAccount = {
        ...installmentPlan,
        account_id: installmentPlan.account_id || accountCode,
      };
      return requestHandler<YunoInstallmentPlan>({
        publicApiKey,
        privateSecretKey,
        endpoint: "/installment-plans",
        options: { method: "POST", body: JSON.stringify(installmentPlanWithAccount) },
      });
    },
    retrieve: async (installmentPlanId: string) => {
      return requestHandler<YunoInstallmentPlan>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/installment-plans/${installmentPlanId}`,
        options: { method: "GET" },
      });
    },
    retrieveAll: async (accountId: string) => {
      return requestHandler<YunoInstallmentPlan[]>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/installment-plans?account_id=${accountId}`,
        options: { method: "GET" },
      });
    },
    update: async (installmentPlanId: string, updateFields: InstallmentPlanUpdateBody) => {
      return requestHandler<YunoInstallmentPlan>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/installment-plans/${installmentPlanId}`,
        options: { method: "PATCH", body: JSON.stringify(updateFields) },
      });
    },
    delete: async (installmentPlanId: string) => {
      return requestHandler<YunoInstallmentPlan>({
        publicApiKey,
        privateSecretKey,
        endpoint: `/installment-plans/${installmentPlanId}`,
        options: { method: "DELETE" },
      });
    },
  };
}

function initializeYunoClient(config: YunoClientConfig) {
  const { publicApiKey, privateSecretKey, accountCode } = config;
  console.log("publicApiKey ===== YUNO CLIENT", publicApiKey);
  console.log("privateSecretKey ===== YUNO CLIENT", privateSecretKey);
  console.log("accountCode ===== YUNO CLIENT", accountCode);
  const customers = handleCustomerMethods(publicApiKey, privateSecretKey);
  const paymentMethods = handlePaymentMethodsMethods(publicApiKey, privateSecretKey);
  const checkoutSessions = handleCheckoutSessionsMethods(publicApiKey, privateSecretKey);
  const payments = handlePaymentsMethods(publicApiKey, privateSecretKey);
  const paymentLinks = handlePaymentLinksMethods(accountCode, publicApiKey, privateSecretKey);
  const subscriptions = handleSubscriptionsMethods(accountCode, publicApiKey, privateSecretKey);
  const recipients = handleRecipientsMethods(accountCode, publicApiKey, privateSecretKey);
  const installmentPlans = handleInstallmentPlansMethods(accountCode, publicApiKey, privateSecretKey);

  return {
    customers,
    paymentMethods,
    checkoutSessions,
    payments,
    paymentLinks,
    subscriptions,
    recipients,
    installmentPlans,
  };
}

export const YunoClient = {
  initialize: initializeYunoClient,
};

// export class YunoClient {
//   public accountCode: string;
//   private publicApiKey: string;
//   private privateSecretKey: string;
//   private baseUrl: ReturnType<typeof generateBaseUrlApi>;

//   private constructor(config: YunoClientConfig) {
//     this.accountCode = config.accountCode;
//     this.publicApiKey = config.publicApiKey;
//     this.privateSecretKey = config.privateSecretKey;
//     this.baseUrl = generateBaseUrlApi(this.publicApiKey);
//   }

//   static initialize(config: YunoClientConfig): YunoClient {
//     const client = new YunoClient(config);
//     return client;
//   }

//   private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
//     try {
//       const url = `${this.baseUrl}${endpoint}`;

//       const headers = {
//         "Content-Type": "application/json",
//         "public-api-key": this.publicApiKey,
//         "private-secret-key": this.privateSecretKey,
//       };

//       const response = await fetch(url, {
//         ...options,
//         headers: {
//           ...headers,
//           ...options.headers,
//         },
//       });

//       return response.json();
//     } catch (error) {
//       if (error instanceof Error) {
//         throw new Error(error.message);
//       }
//       throw new Error("An error occurred while making the request");
//     }
//   }

//   customers = {
//     create: async (customer: YunoCustomer) => {
//       return this.request<YunoCustomer>("/customers", {
//         method: "POST",
//         body: JSON.stringify(customer),
//       });
//     },

//     retrieve: async (customerId: string) => {
//       return this.request<YunoCustomer>(`/customers/${customerId}`, {
//         method: "GET",
//       });
//     },

//     retrieveByExternalId: async (merchant_customer_id: string) => {
//       return this.request<YunoCustomer>(`/customers?merchant_customer_id=${encodeURIComponent(merchant_customer_id)}`, {
//         method: "GET",
//       });
//     },

//     update: async (customerId: string, updateFields: Partial<YunoCustomer>) => {
//       return this.request<YunoCustomer>(`/customers/${customerId}`, {
//         method: "PATCH",
//         body: JSON.stringify(updateFields),
//       });
//     },
//   };

//   paymentMethods = {
//     enroll: async (customerId: string, body: PaymentMethodEnrollSchema, idempotencyKey: string) => {
//       const headers: Record<string, string> = {};
//       headers["x-idempotency-key"] = idempotencyKey;
//       return this.request<YunoPaymentMethod>(`/customers/${customerId}/payment-methods`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body),
//       });
//     },
//     retrieve: async (customerId: string, paymentMethodId: string) => {
//       return this.request<YunoPaymentMethod>(`/customers/${customerId}/payment-methods/${paymentMethodId}`, {
//         method: "GET",
//       });
//     },
//     retrieveEnrolled: async (customerId: string) => {
//       return this.request<YunoPaymentMethod[]>(`/customers/${customerId}/payment-methods`, {
//         method: "GET",
//       });
//     },
//     unenroll: async (customerId: string, paymentMethodId: string) => {
//       return this.request<YunoPaymentMethod>(`/customers/${customerId}/payment-methods/${paymentMethodId}/unenroll`, {
//         method: "POST",
//       });
//     },
//   };

//   checkoutSessions = {
//     create: async (checkoutSession: YunoCheckoutSession) => {
//       return this.request<YunoCheckoutSession>("/checkout/sessions", {
//         method: "POST",
//         body: JSON.stringify(checkoutSession),
//       });
//     },

//     retrievePaymentMethods: async (sessionId: string) => {
//       return this.request<YunoCheckoutPaymentMethodsResponse>(`/checkout/sessions/${sessionId}/payment-methods`, {
//         method: "GET",
//       });
//     },

//     createOtt: async (sessionId: string, ottRequest: YunoOttRequest) => {
//       return this.request<YunoOttResponse>(`/checkout/sessions/${sessionId}/token`, {
//         method: "POST",
//         body: JSON.stringify(ottRequest),
//       });
//     },
//   };

//   payments = {
//     create: async (payment: PaymentCreateBody, idempotencyKey: string) => {
//       const headers: Record<string, string> = {};
//       headers["x-idempotency-key"] = idempotencyKey;
//       return this.request<YunoPayment>("/payments", {
//         method: "POST",
//         headers,
//         body: JSON.stringify(payment),
//       });
//     },

//     retrieve: async (paymentId: string) => {
//       return this.request<YunoPayment>(`/payments/${paymentId}`, {
//         method: "GET",
//       });
//     },

//     retrieveByMerchantOrderId: async (merchant_order_id: string) => {
//       return this.request<YunoPayment[]>(`/payments?merchant_order_id=${encodeURIComponent(merchant_order_id)}`, {
//         method: "GET",
//       });
//     },

//     refund: async (paymentId: string, transactionId: string, body: PaymentRefundSchema, idempotencyKey: string) => {
//       const headers: Record<string, string> = {};
//       headers["x-idempotency-key"] = idempotencyKey;
//       return this.request<any>(`/payments/${paymentId}/transactions/${transactionId}/refund`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body),
//       });
//     },

//     cancelOrRefund: async (paymentId: string, body: PaymentRefundSchema, idempotencyKey: string) => {
//       const headers: Record<string, string> = {};
//       headers["x-idempotency-key"] = idempotencyKey;
//       return this.request<any>(`/payments/${paymentId}/cancel-or-refund`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body),
//       });
//     },

//     cancelOrRefundWithTransaction: async (paymentId: string, transactionId: string, body: PaymentRefundSchema, idempotencyKey: string) => {
//       const headers: Record<string, string> = {};
//       headers["x-idempotency-key"] = idempotencyKey;
//       return this.request<any>(`/payments/${paymentId}/transactions/${transactionId}/cancel-or-refund`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body),
//       });
//     },

//     cancel: async (paymentId: string, transactionId: string, body: PaymentCancelSchema, idempotencyKey: string) => {
//       const headers: Record<string, string> = {};
//       headers["x-idempotency-key"] = idempotencyKey;
//       return this.request<any>(`/payments/${paymentId}/transactions/${transactionId}/cancel`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body),
//       });
//     },

//     authorize: async (payment: PaymentCreateSchema["payment"], idempotencyKey: string) => {
//       const headers: Record<string, string> = {};
//       headers["x-idempotency-key"] = idempotencyKey;
//       if (payment && payment.payment_method && payment.payment_method.detail && payment.payment_method.detail.card) {
//         payment.payment_method.detail.card.capture = false;
//       }
//       return this.request<YunoPayment>("/payments", {
//         method: "POST",
//         headers,
//         body: JSON.stringify(payment),
//       });
//     },

//     captureAuthorization: async (paymentId: string, transactionId: string, body: PaymentCaptureAuthorizationSchema, idempotencyKey: string) => {
//       const headers: Record<string, string> = {};
//       headers["x-idempotency-key"] = idempotencyKey;
//       return this.request<any>(`/payments/${paymentId}/transactions/${transactionId}/capture`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify(body),
//       });
//     },
//   };

//   paymentLinks = {
//     create: async (paymentLink: YunoPaymentLink) => {
//       const paymentLinkWithAccount = {
//         ...paymentLink,
//         account_id: paymentLink.account_id || this.accountCode,
//       };
//       return this.request<YunoPaymentLink>("/payment-links", {
//         method: "POST",
//         body: JSON.stringify(paymentLinkWithAccount),
//       });
//     },

//     retrieve: async (paymentLinkId: string) => {
//       return this.request<YunoPaymentLink>(`/payment-links/${paymentLinkId}`, {
//         method: "GET",
//       });
//     },

//     cancel: async (paymentLinkId: string, body: PaymentLinkCancelSchema) => {
//       return this.request<YunoPaymentLink>(`/payment-links/${paymentLinkId}/cancel`, {
//         method: "POST",
//         body: JSON.stringify(body),
//       });
//     },
//   };

//   subscriptions = {
//     create: async (subscription: YunoSubscription) => {
//       const subscriptionWithAccount = {
//         ...subscription,
//         account_id: subscription.account_id || this.accountCode,
//       };
//       return this.request<YunoSubscription>("/subscriptions", {
//         method: "POST",
//         body: JSON.stringify(subscriptionWithAccount),
//       });
//     },

//     retrieve: async (subscriptionId: string) => {
//       return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}`, {
//         method: "GET",
//       });
//     },

//     pause: async (subscriptionId: string) => {
//       return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}/pause`, {
//         method: "POST",
//       });
//     },

//     resume: async (subscriptionId: string) => {
//       return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}/resume`, {
//         method: "POST",
//       });
//     },

//     update: async (subscriptionId: string, updateFields: SubscriptionUpdateBody) => {
//       return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}`, {
//         method: "PATCH",
//         body: JSON.stringify(updateFields),
//       });
//     },

//     cancel: async (subscriptionId: string) => {
//       return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}/cancel`, {
//         method: "POST",
//       });
//     },
//   };

//   recipients = {
//     create: async (recipient: RecipientCreateSchema) => {
//       const recipientWithAccount = {
//         ...recipient,
//         account_id: recipient.account_id || this.accountCode,
//       };
//       return this.request<YunoRecipient>("/recipients", {
//         method: "POST",
//         body: JSON.stringify(recipientWithAccount),
//       });
//     },

//     retrieve: async (recipientId: string) => {
//       return this.request<YunoRecipient>(`/recipients/${recipientId}?account_id=${this.accountCode}`, {
//         method: "GET",
//       });
//     },

//     update: async (recipientId: string, updateFields: RecipientUpdateBody) => {
//       return this.request<YunoRecipient>(`/recipients/${recipientId}?account_id=${this.accountCode}`, {
//         method: "PATCH",
//         body: JSON.stringify(updateFields),
//       });
//     },

//     delete: async (recipientId: string) => {
//       return this.request<YunoRecipient>(`/recipients/${recipientId}?account_id=${this.accountCode}`, {
//         method: "DELETE",
//       });
//     },
//   };

//   installmentPlans = {
//     create: async (plan: YunoInstallmentPlan) => {
//       return this.request<YunoInstallmentPlan>("/installments-plans", {
//         method: "POST",
//         body: JSON.stringify(plan),
//       });
//     },

//     retrieve: async (planId: string) => {
//       return this.request<YunoInstallmentPlan>(`/installments-plans/${planId}`, {
//         method: "GET",
//       });
//     },

//     retrieveAll: async (accountId: string) => {
//       return this.request<YunoInstallmentPlan[]>(`/installments-plans?account_id=${encodeURIComponent(accountId)}`, {
//         method: "GET",
//       });
//     },

//     update: async (planId: string, updateFields: InstallmentPlanUpdateBody) => {
//       return this.request<YunoInstallmentPlan>(`/installments-plans/${planId}`, {
//         method: "PATCH",
//         body: JSON.stringify(updateFields),
//       });
//     },

//     delete: async (planId: string) => {
//       return this.request<YunoInstallmentPlan>(`/installments-plans/${planId}`, {
//         method: "DELETE",
//       });
//     },
//   };
// }
