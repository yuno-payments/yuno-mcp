import { YunoClientConfig, YunoCustomer, YunoCheckoutSession, YunoPayment } from './types';

export class YunoClient {
  private accountCode: string;
  private publicApiKey: string;
  private privateSecretKey: string;
  private baseUrl: string;

  private constructor(config: YunoClientConfig) {
    this.accountCode = config.accountCode;
    this.publicApiKey = config.publicApiKey;
    this.privateSecretKey = config.privateSecretKey;
    this.baseUrl = config.baseUrl || 'https://api.y.uno/v1';
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
        // 'account-Code': this.accountCode,
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

  checkoutSessions = {
    create: async (checkoutSession: YunoCheckoutSession) => {
      return this.request<YunoCheckoutSession>('/checkout/sessions', {
        method: 'POST',
        body: JSON.stringify(checkoutSession),
      });
    },

    retrievePaymentMethods: async (sessionId: string) => {
      return this.request<import('./types').YunoCheckoutPaymentMethodsResponse>(`/checkout/sessions/${sessionId}/payment-methods`, {
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
} 