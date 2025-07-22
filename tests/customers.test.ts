import { expect, it, describe, rstest } from "@rstest/core";
import z from "zod";
import { customerCreateSchema, customerUpdateSchema } from "../src/schemas";
import { customerCreateTool, customerRetrieveTool, customerRetrieveByExternalIdTool, customerUpdateTool } from "../src/tools/customers";
import { CustomerUpdateSchema, YunoCustomer } from "../src/tools/customers/types";

const customerRetrieveSchema = z.object({
  customerId: z.string().min(36).max(64),
});

const customerRetrieveByExternalIdSchema = z.object({
  merchant_customer_id: z.string(),
});

describe("customerCreateTool", () => {
  it("should create a customer, call YunoClient, and return the result", async () => {
    const mockYunoClient = {
      customers: {
        create: rstest.fn().mockResolvedValue({ id: "cus_123", email: "test@example.com" }),
      },
    };
    const input = { merchant_customer_id: "abc", email: "test@example.com" };
    const result = await customerCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.customers.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("cus_123");
    expect(result.content[0].text).toContain("test@example.com");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = { merchant_customer_id: "abc", email: "test@example.com" };
    expect(() => customerCreateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingEmail = { merchant_customer_id: "abc" };
    const missingId = { email: "test@example.com" };
    const invalidId = { merchant_customer_id: null, email: "test@example.com" };
    const invalidEmail = { merchant_customer_id: "abc", email: "a" };
    const invalidGender = { merchant_customer_id: "abc", email: "test@example.com", gender: "X" };
    expect(() => customerCreateSchema.parse(missingEmail)).toThrow();
    expect(() => customerCreateSchema.parse(missingId)).toThrow();
    expect(() => customerCreateSchema.parse(invalidId)).toThrow();
    expect(() => customerCreateSchema.parse(invalidEmail)).toThrow();
    expect(() => customerCreateSchema.parse(invalidGender)).toThrow();
  });

  it("should handle creation with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      customers: {
        create: rstest.fn().mockResolvedValue({ id: "cus_456", email: "full@example.com", first_name: "Full", metadata: [] }),
      },
    };
    const input = {
      merchant_customer_id: "full",
      merchant_customer_created_at: "2024-01-01",
      first_name: "Full",
      last_name: "Test",
      gender: "M",
      date_of_birth: "1990-01-01",
      email: "full@example.com",
      document: { document_type: "passport", document_number: "123456" },
      phone: { number: "1234567890", country_code: "1" },
      billing_address: {
        address_line_1: "123 Main St",
        state: "CA",
        city: "LA",
        zip_code: "90001",
      },
      shipping_address: {
        address_line_1: "123 Main St",
        state: "CA",
        city: "LA",
        zip_code: "90001",
      },
      metadata: [],
    } as const satisfies YunoCustomer;
    const result = await customerCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.customers.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("cus_456");
    expect(result.content[0].text).toContain("full@example.com");
    expect(result.content[0].text).toContain("Full");
  });

  it("should handle creation with only required fields", async () => {
    const mockYunoClient = {
      customers: {
        create: rstest.fn().mockResolvedValue({ id: "cus_789", email: "minimal@example.com" }),
      },
    };
    const input = { merchant_customer_id: "minimal", email: "minimal@example.com" };
    const result = await customerCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.customers.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("cus_789");
    expect(result.content[0].text).toContain("minimal@example.com");
  });
});

describe("customerRetrieveTool", () => {
  it("should retrieve a customer, call YunoClient, and return the result", async () => {
    const mockYunoClient = {
      customers: {
        retrieve: rstest.fn().mockResolvedValue({ id: "cus_123", email: "test@example.com" }),
      },
    };
    const input = { customerId: "cus_123" };
    const result = await customerRetrieveTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.customers.retrieve).toHaveBeenCalledWith(input.customerId);
    expect(result.content[0].text).toContain("cus_123");
    expect(result.content[0].text).toContain("test@example.com");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { customerId: null };
    expect(() => customerRetrieveSchema.parse(missingId)).toThrow();
    expect(() => customerRetrieveSchema.parse(invalidId)).toThrow();
  });
});

describe("customerRetrieveByExternalIdTool", () => {
  it("should retrieve a customer by external id, call YunoClient, and return the result", async () => {
    const mockYunoClient = {
      customers: {
        retrieveByExternalId: rstest.fn().mockResolvedValue({ id: "cus_456", email: "external@example.com" }),
      },
    };
    const input = { merchant_customer_id: "external_123" };
    const result = await customerRetrieveByExternalIdTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.customers.retrieveByExternalId).toHaveBeenCalledWith(input.merchant_customer_id);
    expect(result.content[0].text).toContain("cus_456");
    expect(result.content[0].text).toContain("external@example.com");
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = {};
    const invalidId = { merchant_customer_id: null };
    expect(() => customerRetrieveByExternalIdSchema.parse(missingId)).toThrow();
    expect(() => customerRetrieveByExternalIdSchema.parse(invalidId)).toThrow();
  });
});

describe("customerUpdateTool", () => {
  it("should execute the main action, call the client, and return the expected result", async () => {
    const mockYunoClient = {
      customers: {
        update: rstest.fn().mockResolvedValue({ id: "cus_123", email: "updated@example.com" }),
      },
    };
    const input = { customerId: "cus_123456789012345678901234567890123456", email: "updated@example.com" };
    const result = await customerUpdateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.customers.update).toHaveBeenCalledWith(input.customerId, { email: "updated@example.com" });
    expect(result.content[0].text).toContain("cus_123");
    expect(result.content[0].text).toContain("updated@example.com");
  });

  it("should validate a correct minimal payload (only required fields)", () => {
    const minimal = { customerId: "cus_123456789012345678901234567890123456" };
    expect(() => customerUpdateSchema.parse(minimal)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingId = { email: "fail@example.com" };
    const invalidId = { customerId: "short", email: "fail@example.com" };
    expect(() => customerUpdateSchema.parse(missingId)).toThrow();
    expect(() => customerUpdateSchema.parse(invalidId)).toThrow();
  });

  it("should handle execution with all optional fields, nested objects, and empty optional arrays/objects", async () => {
    const mockYunoClient = {
      customers: {
        update: rstest.fn().mockResolvedValue({ id: "cus_456", email: "full@example.com", first_name: "Full", metadata: [] }),
      },
    };
    const input = {
      customerId: "cus_123456789012345678901234567890123456",
      first_name: "Full",
      last_name: "Test",
      gender: "M",
      date_of_birth: "1990-01-01",
      email: "full@example.com",
      nationality: "US",
      country: "US",
      document: { document_type: "passport", document_number: "123456" },
      phone: { number: "1234567890", country_code: "1" },
      billing_address: {
        address_line_1: "123 Main St",
        state: "CA",
        city: "LA",
        zip_code: "90001",
      },
      shipping_address: {
        address_line_1: "123 Main St",
        state: "CA",
        city: "LA",
        zip_code: "90001",
      },
      metadata: [],
      merchant_customer_created_at: "2024-01-01",
    } as const satisfies CustomerUpdateSchema;
    const result = await customerUpdateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    const { customerId, ...updateFields } = input;
    expect(mockYunoClient.customers.update).toHaveBeenCalledWith(customerId, updateFields);
    expect(result.content[0].text).toContain("cus_456");
    expect(result.content[0].text).toContain("full@example.com");
    expect(result.content[0].text).toContain("Full");
  });

  it("should handle execution with only required fields", async () => {
    const mockYunoClient = {
      customers: {
        update: rstest.fn().mockResolvedValue({ id: "cus_789", email: "minimal@example.com" }),
      },
    };
    const input = { customerId: "cus_123456789012345678901234567890123456" };
    const result = await customerUpdateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.customers.update).toHaveBeenCalledWith(input.customerId, {});
    expect(result.content[0].text).toContain("cus_789");
  });
});
