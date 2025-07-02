import {
  paymentCreateTool,
  paymentRetrieveTool,
  paymentRetrieveByMerchantOrderIdTool,
  paymentRefundTool,
  paymentCancelOrRefundTool,
  paymentCancelOrRefundWithTransactionTool,
  paymentCancelTool,
  paymentAuthorizeTool,
  paymentCaptureAuthorizationTool,
} from '../src/payments';
import {
  paymentCreateSchema,
  paymentRefundSchema,
  paymentCancelSchema,
  paymentCaptureAuthorizationSchema,
} from '../src/payments/types';
import z from 'zod';

describe('paymentCreateTool', () => {
  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      accountCode: 'acc_123',
      payments: {
        create: jest.fn().mockResolvedValue({ id: 'pay_123', description: 'Test payment' }),
      },
    };
    const input = {
      payment: {
        account_id: 'acc_123',
        description: 'Test payment',
        country: 'US',
        merchant_order_id: 'order_1',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD' },
      },
      idempotency_key: 'b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6',
    };
    const result = await paymentCreateTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.create).toHaveBeenCalledWith(input.payment, input.idempotency_key);
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('Test payment');
  });

  it('should validate a correct minimal payload (only required fields)', () => {
    const minimal = {
      payment: {
        description: 'Test payment',
        country: 'US',
        merchant_order_id: 'order_1',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD' },
      },
    };
    expect(() => paymentCreateSchema.parse(minimal)).not.toThrow();
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingDescription = {
      payment: {
        country: 'US',
        merchant_order_id: 'order_1',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD' },
      },
    };
    const invalidCountry = {
      payment: {
        description: 'Test payment',
        country: null,
        merchant_order_id: 'order_1',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD' },
      },
    };
    expect(() => paymentCreateSchema.parse(missingDescription)).toThrow();
    expect(() => paymentCreateSchema.parse(invalidCountry)).toThrow();
  });

  it('should handle execution with all optional fields, nested objects, and empty optional arrays/objects', async () => {
    const mockYunoClient = {
      accountCode: 'acc_123',
      payments: {
        create: jest.fn().mockResolvedValue({ id: 'pay_456', description: 'Full payment', metadata: [] }),
      },
    };
    const input = {
      payment: {
        account_id: 'acc_123',
        description: 'Full payment',
        country: 'US',
        merchant_order_id: 'order_2',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD', vault_on_success: true },
        customer_payer: { first_name: 'John', last_name: 'Doe' },
        callback_url: 'https://callback',
        fraud_screening: {},
        split_marketplace: [],
        metadata: [],
      },
      idempotency_key: 'b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6',
    };
    const result = await paymentCreateTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.create).toHaveBeenCalledWith(input.payment, input.idempotency_key);
    expect(result.content[0].text).toContain('pay_456');
    expect(result.content[0].text).toContain('Full payment');
  });

  it('should handle execution with only required fields', async () => {
    const mockYunoClient = {
      accountCode: 'acc_123',
      payments: {
        create: jest.fn().mockResolvedValue({ id: 'pay_789', description: 'Minimal payment' }),
      },
    };
    const input = {
      payment: {
        description: 'Minimal payment',
        country: 'US',
        merchant_order_id: 'order_3',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD' },
      },
    };
    const result = await paymentCreateTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...input.payment,
        account_id: 'acc_123',
      }),
      expect.any(String)
    );
    expect(result.content[0].text).toContain('pay_789');
    expect(result.content[0].text).toContain('Minimal payment');
  });
});

describe('paymentRetrieveTool', () => {
  const retrieveSchema = z.object({ payment_id: z.string() });

  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      payments: {
        retrieve: jest.fn().mockResolvedValue({ id: 'pay_123', description: 'Test payment' }),
      },
    };
    const input = { payment_id: 'pay_123' };
    const result = await paymentRetrieveTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.retrieve).toHaveBeenCalledWith('pay_123');
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('Test payment');
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingId = {};
    const invalidId = { payment_id: null };
    expect(() => retrieveSchema.parse(missingId)).toThrow();
    expect(() => retrieveSchema.parse(invalidId)).toThrow();
  });
});

describe('paymentRetrieveByMerchantOrderIdTool', () => {
  const retrieveSchema = z.object({ merchant_order_id: z.string() });

  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      payments: {
        retrieveByMerchantOrderId: jest.fn().mockResolvedValue([{ id: 'pay_123', description: 'Test payment' }]),
      },
    };
    const input = { merchant_order_id: 'order_123' };
    const result = await paymentRetrieveByMerchantOrderIdTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.retrieveByMerchantOrderId).toHaveBeenCalledWith('order_123');
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('Test payment');
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingId = {};
    const invalidId = { merchant_order_id: null };
    expect(() => retrieveSchema.parse(missingId)).toThrow();
    expect(() => retrieveSchema.parse(invalidId)).toThrow();
  });
});

describe('paymentRefundTool', () => {
  const refundSchema = z.object({
    paymentId: z.string().min(36).max(64),
    transactionId: z.string().min(36).max(64),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional(),
  });

  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      payments: {
        refund: jest.fn().mockResolvedValue({ id: 'pay_123', refunded: true }),
      },
    };
    const input = {
      paymentId: 'pay_123456789012345678901234567890123456',
      transactionId: 'txn_123456789012345678901234567890123456',
      body: { merchant_reference: 'ref_1', customer_payer: {} },
      idempotency_key: 'b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6',
    };
    const result = await paymentRefundTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.refund).toHaveBeenCalledWith(
      input.paymentId,
      input.transactionId,
      input.body,
      input.idempotency_key
    );
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('true');
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingId = { transactionId: 'txn_123456789012345678901234567890123456', body: { merchant_reference: 'ref_1', customer_payer: {} } };
    const invalidId = { paymentId: null, transactionId: null, body: { merchant_reference: 'ref_1', customer_payer: {} } };
    expect(() => refundSchema.parse(missingId)).toThrow();
    expect(() => refundSchema.parse(invalidId)).toThrow();
  });
});

describe('paymentCancelOrRefundTool', () => {
  const cancelOrRefundSchema = z.object({
    paymentId: z.string().min(36).max(64),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional(),
  });

  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      payments: {
        cancelOrRefund: jest.fn().mockResolvedValue({ id: 'pay_123', cancelled: true }),
      },
    };
    const input = {
      paymentId: 'pay_123456789012345678901234567890123456',
      body: { merchant_reference: 'ref_1', customer_payer: {} },
      idempotency_key: 'b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6',
    };
    const result = await paymentCancelOrRefundTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.cancelOrRefund).toHaveBeenCalledWith(
      input.paymentId,
      input.body,
      input.idempotency_key
    );
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('true');
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingId = { body: { merchant_reference: 'ref_1', customer_payer: {} } };
    const invalidId = { paymentId: null, body: { merchant_reference: 'ref_1', customer_payer: {} } };
    expect(() => cancelOrRefundSchema.parse(missingId)).toThrow();
    expect(() => cancelOrRefundSchema.parse(invalidId)).toThrow();
  });
});

describe('paymentCancelOrRefundWithTransactionTool', () => {
  const cancelOrRefundWithTransactionSchema = z.object({
    paymentId: z.string().min(36).max(64),
    transactionId: z.string().min(36).max(64),
    body: paymentRefundSchema,
    idempotency_key: z.string().uuid().optional(),
  });

  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      payments: {
        cancelOrRefundWithTransaction: jest.fn().mockResolvedValue({ id: 'pay_123', cancelled: true }),
      },
    };
    const input = {
      paymentId: 'pay_123456789012345678901234567890123456',
      transactionId: 'txn_123456789012345678901234567890123456',
      body: { merchant_reference: 'ref_1', customer_payer: {} },
      idempotency_key: 'b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6',
    };
    const result = await paymentCancelOrRefundWithTransactionTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.cancelOrRefundWithTransaction).toHaveBeenCalledWith(
      input.paymentId,
      input.transactionId,
      input.body,
      input.idempotency_key
    );
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('true');
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingId = { transactionId: 'txn_123456789012345678901234567890123456', body: { merchant_reference: 'ref_1', customer_payer: {} } };
    const invalidId = { paymentId: null, transactionId: null, body: { merchant_reference: 'ref_1', customer_payer: {} } };
    expect(() => cancelOrRefundWithTransactionSchema.parse(missingId)).toThrow();
    expect(() => cancelOrRefundWithTransactionSchema.parse(invalidId)).toThrow();
  });
});

describe('paymentCancelTool', () => {
  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      payments: {
        cancel: jest.fn().mockResolvedValue({ id: 'pay_123', cancelled: true }),
      },
    };
    const input = {
      paymentId: 'pay_123456789012345678901234567890123456',
      transactionId: 'txn_123456789012345678901234567890123456',
      body: { merchant_reference: 'ref_1' },
      idempotency_key: 'b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6',
    };
    const result = await paymentCancelTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.cancel).toHaveBeenCalledWith(
      input.paymentId,
      input.transactionId,
      input.body,
      input.idempotency_key
    );
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('true');
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingId = { transactionId: 'txn_123456789012345678901234567890123456', body: { merchant_reference: 'ref_1' } };
    const invalidId = { paymentId: null, transactionId: null, body: { merchant_reference: 'ref_1' } };
    expect(() => paymentCancelSchema.parse(missingId)).toThrow();
    expect(() => paymentCancelSchema.parse(invalidId)).toThrow();
  });
});

describe('paymentAuthorizeTool', () => {
  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      accountCode: 'acc_123',
      payments: {
        authorize: jest.fn().mockResolvedValue({ id: 'pay_123', authorized: true }),
      },
    };
    const input = {
      payment: {
        account_id: 'acc_123',
        description: 'Test payment',
        country: 'US',
        merchant_order_id: 'order_1',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD' },
      },
      idempotency_key: 'b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6',
    };
    const result = await paymentAuthorizeTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.authorize).toHaveBeenCalledWith(input.payment, input.idempotency_key);
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('true');
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingDescription = {
      payment: {
        country: 'US',
        merchant_order_id: 'order_1',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD' },
      },
    };
    const invalidCountry = {
      payment: {
        description: 'Test payment',
        country: null,
        merchant_order_id: 'order_1',
        amount: { currency: 'USD', value: 100 },
        workflow: 'DIRECT',
        payment_method: { type: 'CARD' },
      },
    };
    expect(() => paymentCreateSchema.parse(missingDescription)).toThrow();
    expect(() => paymentCreateSchema.parse(invalidCountry)).toThrow();
  });
});

describe('paymentCaptureAuthorizationTool', () => {
  it('should execute the main action, call the client, and return the expected result', async () => {
    const mockYunoClient = {
      payments: {
        captureAuthorization: jest.fn().mockResolvedValue({ id: 'pay_123', captured: true }),
      },
    };
    const input = {
      paymentId: 'pay_123456789012345678901234567890123456',
      transactionId: 'txn_123456789012345678901234567890123456',
      body: { merchant_reference: 'ref_1', reason: 'capture' },
      idempotency_key: 'b6b6b6b6-b6b6-4b6b-b6b6-b6b6b6b6b6b6',
    };
    const result = await paymentCaptureAuthorizationTool.handler(
      mockYunoClient as any,
      input
    );
    expect(mockYunoClient.payments.captureAuthorization).toHaveBeenCalledWith(
      input.paymentId,
      input.transactionId,
      input.body,
      input.idempotency_key
    );
    expect(result.content[0].text).toContain('pay_123');
    expect(result.content[0].text).toContain('true');
  });

  it('should fail validation for missing or invalid fields', () => {
    const missingId = { transactionId: 'txn_123456789012345678901234567890123456', body: { merchant_reference: 'ref_1', reason: 'capture' } };
    const invalidId = { paymentId: null, transactionId: null, body: { merchant_reference: 'ref_1', reason: 'capture' } };
    expect(() => paymentCaptureAuthorizationSchema.parse(missingId)).toThrow();
    expect(() => paymentCaptureAuthorizationSchema.parse(invalidId)).toThrow();
  });
});
