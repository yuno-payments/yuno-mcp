import { YunoCheckoutPaymentMethodsResponse, YunoCheckoutSession } from '../checkouts/types';
import { YunoCustomer } from '../customers/types';
import { YunoInstallmentPlan } from '../installmentPlans/types';
import { YunoPaymentLink } from '../paymentLinks/types';
import { YunoPaymentMethod } from '../paymentMethods/types';
import { YunoPayment } from '../payments/types';
import { YunoRecipient } from '../recipients/types';
import { YunoSubscription } from '../subscriptions/types';
import { ApiKeyPrefix, ApiKeyPrefixToEnvironmentSuffix, EnvironmentSuffix, YunoClientConfig } from './types';

const apiKeyPrefixToEnvironmentSuffix = {
  dev: "-dev",
  staging: "-staging",
  sandbox: "-sandbox",
  prod: "",
} as ApiKeyPrefixToEnvironmentSuffix;

function generateBaseUrlApi(publicApiKey: string) {
  const [apiKeyPrefix] = publicApiKey.split("_");
  const environmentSuffix = apiKeyPrefixToEnvironmentSuffix[
    apiKeyPrefix as ApiKeyPrefix
  ] as EnvironmentSuffix;
  const baseURL = `https://api${environmentSuffix}.y.uno/v1`;

  return baseURL;
}

export class YunoClient {
  public accountCode: string;
  private publicApiKey: string;
  private privateSecretKey: string;
  private baseUrl: string;

  private constructor(config: YunoClientConfig) {
    this.accountCode = config.accountCode;
    this.publicApiKey = config.publicApiKey;
    this.privateSecretKey = config.privateSecretKey;
    this.baseUrl = generateBaseUrlApi(this.publicApiKey);
  }

  static async initialize(config: YunoClientConfig): Promise<YunoClient> {
    const client = new YunoClient(config);
    return client;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const headers = {
        'Content-Type': 'application/json',
        'public-api-key': this.publicApiKey,
        'private-secret-key': this.privateSecretKey,
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
        throw new Error(error.message);
      }
      throw new Error('An error occurred while making the request');
    }
    
  }

  customers = {
    create: async (customer: YunoCustomer) => {
        return this.request<YunoCustomer>('/customers', {
          method: 'POST',
          body: JSON.stringify(customer),
        });
    },

    retrieve: async (customerId: string) => {
      return this.request<YunoCustomer>(`/customers/${customerId}`, {
        method: 'GET',
      });
    },

    retrieveByExternalId: async (merchant_customer_id: string) => {
      return this.request<YunoCustomer>(`/customers?merchant_customer_id=${encodeURIComponent(merchant_customer_id)}`, {
        method: 'GET',
      });
    },

    update: async (customerId: string, updateFields: Partial<YunoCustomer>) => {
      return this.request<YunoCustomer>(`/customers/${customerId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateFields),
      });
    },
  };

  paymentMethods = {
    enroll: async (customerId: string, body: any, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers['x-idempotency-key'] = idempotencyKey;
      return this.request<YunoPaymentMethod>(`/customers/${customerId}/payment-methods`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    },
    retrieve: async (customerId: string,paymentMethodId: string) => {
      return this.request<YunoPaymentMethod>(`/customers/${customerId}/payment-methods/${paymentMethodId}`, {
        method: 'GET',
      });
    },
    retrieveEnrolled: async (customerId: string) => {
      return this.request<YunoPaymentMethod[]>(`/customers/${customerId}/payment-methods`, {
        method: 'GET',
      });
    },
    unenroll: async (customerId: string, paymentMethodId: string) => {
      return this.request<YunoPaymentMethod>(`/customers/${customerId}/payment-methods/${paymentMethodId}/unenroll`, {
        method: 'POST',
      });
    },
  };

  checkoutSessions = {
    create: async (checkoutSession: YunoCheckoutSession) => {
      return this.request<YunoCheckoutSession>('/checkout/sessions', {
        method: 'POST',
        body: JSON.stringify(checkoutSession),
      });
    },

    retrievePaymentMethods: async (sessionId: string) => {
      return this.request<YunoCheckoutPaymentMethodsResponse>(`/checkout/sessions/${sessionId}/payment-methods`, {
        method: 'GET',
      });
    },
  };

  payments = {
    create: async (payment: YunoPayment, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers['x-idempotency-key'] = idempotencyKey;
      return this.request<YunoPayment>('/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(payment),
      });
    },

    retrieve: async (paymentId: string) => {
      return this.request<YunoPayment>(`/payments/${paymentId}`, {
        method: 'GET',
      });
    },

    retrieveByMerchantOrderId: async (merchant_order_id: string) => {
      return this.request<YunoPayment[]>(`/payments?merchant_order_id=${encodeURIComponent(merchant_order_id)}`, {
        method: 'GET',
      });
    },

    refund: async (paymentId: string, transactionId: string, body: any, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers['x-idempotency-key'] = idempotencyKey;
      return this.request<any>(`/payments/${paymentId}/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    },

    cancelOrRefund: async (paymentId: string, body: any, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers['x-idempotency-key'] = idempotencyKey;
      return this.request<any>(`/payments/${paymentId}/cancel-or-refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    },

    cancelOrRefundWithTransaction: async (paymentId: string, transactionId: string, body: any, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers['x-idempotency-key'] = idempotencyKey;
      return this.request<any>(`/payments/${paymentId}/transactions/${transactionId}/cancel-or-refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    },

    cancel: async (paymentId: string, transactionId: string, body: any, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers['x-idempotency-key'] = idempotencyKey;
      return this.request<any>(`/payments/${paymentId}/transactions/${transactionId}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    },

    authorize: async (payment: YunoPayment, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers['x-idempotency-key'] = idempotencyKey;
      if (payment && payment.payment_method && payment.payment_method.detail && payment.payment_method.detail.card) {
        payment.payment_method.detail.card.capture = false;
      }
      return this.request<YunoPayment>('/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify(payment),
      });
    },

    captureAuthorization: async (paymentId: string, transactionId: string, body: any, idempotencyKey: string) => {
      const headers: Record<string, string> = {};
      headers['x-idempotency-key'] = idempotencyKey;
      return this.request<any>(`/payments/${paymentId}/transactions/${transactionId}/capture`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    },
  };

  paymentLinks = {
    create: async (paymentLink: YunoPaymentLink) => {
      const paymentLinkWithAccount = { ...paymentLink, account_id: paymentLink.account_id || this.accountCode };
      return this.request<YunoPaymentLink>('/payment-links', {
        method: 'POST',
        body: JSON.stringify(paymentLinkWithAccount),
      });
    },

    retrieve: async (paymentLinkId: string) => {
      return this.request<YunoPaymentLink>(`/payment-links/${paymentLinkId}`, {
        method: 'GET',
      });
    },

    cancel: async (paymentLinkId: string, body: any) => {
      return this.request<YunoPaymentLink>(`/payment-links/${paymentLinkId}/cancel`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
  };

  subscriptions = {
    create: async (subscription: YunoSubscription) => {
      const subscriptionWithAccount = { ...subscription, account_id: subscription.account_id || this.accountCode };
      return this.request<YunoSubscription>('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionWithAccount),
      });
    },

    retrieve: async (subscriptionId: string) => {
      return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}`, {
        method: 'GET',
      });
    },

    pause: async (subscriptionId: string) => {
      return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}/pause`, {
        method: 'POST',
      });
    },

    resume: async (subscriptionId: string) => {
      return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}/resume`, {
        method: 'POST',
      });
    },

    update: async (subscriptionId: string, updateFields: YunoSubscription) => {
      return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateFields),
      });
    },

    cancel: async (subscriptionId: string) => {
      return this.request<YunoSubscription>(`/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
      });
    },
  };

  recipients = {
    create: async (recipient: YunoRecipient) => {
      const recipientWithAccount = { ...recipient, account_id: recipient.account_id || this.accountCode };
      return this.request<YunoRecipient>('/recipients', {
        method: 'POST',
        body: JSON.stringify(recipientWithAccount),
      });
    },

    retrieve: async (recipientId: string) => {
      return this.request<YunoRecipient>(`/recipients/${recipientId}?account_id=${this.accountCode}`, {
        method: 'GET',
      });
    },

    update: async (ID: string, updateFields: YunoRecipient) => {
      return this.request<YunoRecipient>(`/recipients/${ID}?account_id=${this.accountCode}`, {
        method: 'PATCH',
        body: JSON.stringify(updateFields),
      });
    },

    delete: async (recipientId: string) => {
      return this.request<YunoRecipient>(`/recipients/${recipientId}?account_id=${this.accountCode}`, {
        method: 'DELETE',
      });
    },
  };

  installmentPlans = {
    create: async (plan: YunoInstallmentPlan) => {
      return this.request<YunoInstallmentPlan>('/installments-plans', {
        method: 'POST',
        body: JSON.stringify(plan),
      });
    },

    retrieve: async (planId: string) => {
      return this.request<YunoInstallmentPlan>(`/installments-plans/${planId}`, {
        method: 'GET',
      });
    },

    retrieveAll: async (accountId: string) => {
      return this.request<YunoInstallmentPlan[]>(`/installments-plans?account_id=${encodeURIComponent(accountId)}`, {
        method: 'GET',
      });
    },

    update: async (planId: string, updateFields: YunoInstallmentPlan) => {
      return this.request<YunoInstallmentPlan>(`/installments-plans/${planId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateFields),
      });
    },

    delete: async (planId: string) => {
      return this.request<YunoInstallmentPlan>(`/installments-plans/${planId}`, {
        method: 'DELETE',
      });
    },
  };
} 