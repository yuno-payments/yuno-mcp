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
    this.baseUrl = config.baseUrl || 'https://api.y.uno';
  }

  static async initialize(config: YunoClientConfig): Promise<YunoClient> {
    const client = new YunoClient(config);
    return client;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Account-Code': this.accountCode,
      'X-Public-Api-Key': this.publicApiKey,
      'X-Private-Secret-Key': this.privateSecretKey,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred while making the request');
    }

    return response.json();
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
  };

  checkoutSessions = {
    create: async (checkoutSession: YunoCheckoutSession) => {
      return this.request<YunoCheckoutSession>('/checkout-sessions', {
        method: 'POST',
        body: JSON.stringify(checkoutSession),
      });
    },

    retrieve: async (sessionId: string) => {
      return this.request<YunoCheckoutSession>(`/checkout-sessions/${sessionId}`, {
        method: 'GET',
      });
    },
  };

  payments = {
    create: async (payment: YunoPayment, idempotencyKey?: string) => {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

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
  };
} 