import { expect, it, describe, rstest } from "@rstest/core";
import z from "zod";
import { routingLoginSchema, routingCreateSchema, routingGetConnectionsSchema, workflowRequestSchema } from "../src/schemas";
import { 
  routingLoginTool, 
  routingCreateTool, 
  routingGetProvidersTool, 
  routingRetrieveTool, 
  routingUpdateTool, 
  routingPostTool,
  routingLogOutTool 
} from "../src/tools/routing";
import { YunoRoutingLogin, YunoRoutingCreateSchema, YunoRoutingUpdateWorkflow } from "../src/tools/routing/types";

const routingRetrieveSchema = z.object({
  versionCode: z.string().min(1),
});

const routingPostSchema = z.object({
  versionCode: z.string().min(1),
});

const routingLogOutSchema = z.object({});

describe("routingLoginTool", () => {
  it("should authenticate user and return login response", async () => {
    const mockYunoClient = {
      routing: {
        login: rstest.fn().mockResolvedValue({ 
          access_token: "token_123", 
          mfa_token: "mfa_456" 
        }),
      },
    };
    const input: YunoRoutingLogin = { 
      username: "test@example.com", 
      password: "password123", 
      remember_device: false 
    };
    const result = await routingLoginTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.routing.login).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("token_123");
    expect(result.content[0].text).toContain("mfa_456");
  });

  it("should return object type when type is object", async () => {
    const mockYunoClient = {
      routing: {
        login: rstest.fn().mockResolvedValue({ 
          access_token: "token_123", 
          mfa_token: "mfa_456" 
        }),
      },
    };
    const input: YunoRoutingLogin = { 
      username: "test@example.com", 
      password: "password123", 
      remember_device: false 
    };
    const result = await routingLoginTool.handler({ yunoClient: mockYunoClient as any, type: "object" })(input);
    expect(result.content[0].type).toBe("object");
    expect(result.content[0].object).toEqual({ 
      access_token: "token_123", 
      mfa_token: "mfa_456" 
    });
  });

  it("should validate a correct login payload", () => {
    const validLogin = { 
      username: "test@example.com", 
      password: "password123", 
      remember_device: false 
    };
    expect(() => routingLoginSchema.parse(validLogin)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingUsername = { password: "password123", remember_device: false };
    const missingPassword = { username: "test@example.com", remember_device: false };
    const invalidEmail = { username: "invalid-email", password: "password123", remember_device: false };
    const emptyPassword = { username: "test@example.com", password: "", remember_device: false };

    expect(() => routingLoginSchema.parse(missingUsername)).toThrow();
    expect(() => routingLoginSchema.parse(missingPassword)).toThrow();
    expect(() => routingLoginSchema.parse(invalidEmail)).toThrow();
    expect(() => routingLoginSchema.parse(emptyPassword)).toThrow();
  });

  it("should default remember_device to false", () => {
    const loginWithoutRememberDevice = { 
      username: "test@example.com", 
      password: "password123" 
    };
    const parsed = routingLoginSchema.parse(loginWithoutRememberDevice);
    expect(parsed.remember_device).toBe(false);
  });
});

describe("routingCreateTool", () => {
  it("should create routing configuration and return response", async () => {
    const mockYunoClient = {
      routing: {
        create: rstest.fn().mockResolvedValue({ 
          id: "routing_123", 
          name: "Test Routing", 
          payment_method: "CARD" 
        }),
      },
    };
    const input: YunoRoutingCreateSchema = { 
      name: "Test Routing", 
      payment_method: "CARD" 
    };
    const result = await routingCreateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.routing.create).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("routing_123");
    expect(result.content[0].text).toContain("Test Routing");
  });

  it("should validate a correct routing create payload", () => {
    const validRouting = { 
      name: "Test Routing", 
      payment_method: "CARD" 
    };
    expect(() => routingCreateSchema.parse(validRouting)).not.toThrow();
  });

  it("should fail validation for missing or invalid fields", () => {
    const missingName = { payment_method: "CARD" };
    const missingPaymentMethod = { name: "Test Routing" };
    const emptyName = { name: "", payment_method: "CARD" };
    const emptyPaymentMethod = { name: "Test Routing", payment_method: "" };

    expect(() => routingCreateSchema.parse(missingName)).toThrow();
    expect(() => routingCreateSchema.parse(missingPaymentMethod)).toThrow();
    expect(() => routingCreateSchema.parse(emptyName)).toThrow();
    expect(() => routingCreateSchema.parse(emptyPaymentMethod)).toThrow();
  });
});

describe("routingGetProvidersTool", () => {
  it("should retrieve providers for payment method and return response", async () => {
    const mockYunoClient = {
      routing: {
        getConnections: rstest.fn().mockResolvedValue({ 
          integrations: [
            { 
              integration_code: "provider_123", 
              name: "Test Provider", 
              active: true 
            }
          ]
        }),
      },
    };
    const input = { paymentMethod: "CARD" };
    const result = await routingGetProvidersTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.routing.getConnections).toHaveBeenCalledWith("CARD");
    expect(result.content[0].text).toContain("provider_123");
    expect(result.content[0].text).toContain("Test Provider");
  });

  it("should validate a correct get providers payload", () => {
    const validRequest = { paymentMethod: "CARD" };
    expect(() => routingGetConnectionsSchema.parse(validRequest)).not.toThrow();
  });

  it("should fail validation for missing or invalid payment method", () => {
    const missingPaymentMethod = {};
    const emptyPaymentMethod = { paymentMethod: "" };

    expect(() => routingGetConnectionsSchema.parse(missingPaymentMethod)).toThrow();
    expect(() => routingGetConnectionsSchema.parse(emptyPaymentMethod)).toThrow();
  });
});

describe("routingRetrieveTool", () => {
  it("should retrieve workflow by version code and return response", async () => {
    const mockYunoClient = {
      routing: {
        retrieve: rstest.fn().mockResolvedValue({ 
          workflow: { 
            id: 1, 
            name: "Test Workflow", 
            code: "wf_123" 
          },
          version: { 
            id: 1, 
            code: "v_123", 
            number: 1 
          }
        }),
      },
    };
    const input = { versionCode: "v_123" };
    const result = await routingRetrieveTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.routing.retrieve).toHaveBeenCalledWith("v_123");
    expect(result.content[0].text).toContain("Test Workflow");
    expect(result.content[0].text).toContain("v_123");
  });

  it("should validate a correct retrieve payload", () => {
    const validRequest = { versionCode: "v_123" };
    expect(() => routingRetrieveSchema.parse(validRequest)).not.toThrow();
  });

  it("should fail validation for missing or empty version code", () => {
    const missingVersionCode = {};
    const emptyVersionCode = { versionCode: "" };

    expect(() => routingRetrieveSchema.parse(missingVersionCode)).toThrow();
    expect(() => routingRetrieveSchema.parse(emptyVersionCode)).toThrow();
  });
});

describe("routingUpdateTool", () => {
  it("should update workflow configuration and return response", async () => {
    const mockYunoClient = {
      routing: {
        update: rstest.fn().mockResolvedValue({ 
          success: true, 
          workflow_id: "wf_123" 
        }),
      },
    };
    const input = {
      updateRoute: {
        workflow: {
          id: 1,
          code: "wf_123",
          name: "Test Workflow",
          status: "active",
          account_code: "acc_123",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          payment_method_type: "CARD",
          is_active: true
        },
        version: {
          id: 1,
          workflow_id: 1,
          code: "v_123",
          status: "draft",
          number: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Test Version",
          publishable: true,
          favorite: false,
          repair: false,
          updated_by: "user_123",
          payment_enabled: true,
          fraud_enabled: false,
          paused: false
        },
        condition_sets: []
      },
      provider_connection_code: "conn_123",
      providers: {
        integrations: []
      }
    } as YunoRoutingUpdateWorkflow;
    const result = await routingUpdateTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.routing.update).toHaveBeenCalledWith(input);
    expect(result.content[0].text).toContain("success");
    expect(result.content[0].text).toContain("wf_123");
  });

  it("should validate a correct update workflow payload", () => {
    const validRequest = {
      updateRoute: {
        workflow: {
          id: 1,
          code: "wf_123",
          name: "Test Workflow",
          status: "active",
          account_code: "acc_123",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          payment_method_type: "CARD",
          is_active: true
        },
        version: {
          id: 1,
          workflow_id: 1,
          code: "v_123",
          status: "draft",
          number: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          name: "Test Version",
          publishable: true,
          favorite: false,
          repair: false,
          updated_by: "user_123",
          payment_enabled: true,
          fraud_enabled: false,
          paused: false
        },
        condition_sets: []
      },
      provider_connection_code: "conn_123",
      providers: {
        integrations: []
      }
    };
    expect(() => workflowRequestSchema.parse(validRequest)).not.toThrow();
  });
});

describe("routingPostTool", () => {
  it("should post workflow configuration and return response", async () => {
    const mockYunoClient = {
      routing: {
        post: rstest.fn().mockResolvedValue({ 
          success: true, 
          published_at: "2024-01-01T00:00:00Z" 
        }),
      },
    };
    const input = { versionCode: "v_123" };
    const result = await routingPostTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.routing.post).toHaveBeenCalledWith("v_123");
    expect(result.content[0].text).toContain("success");
    expect(result.content[0].text).toContain("published_at");
  });

  it("should validate a correct post payload", () => {
    const validRequest = { versionCode: "v_123" };
    expect(() => routingPostSchema.parse(validRequest)).not.toThrow();
  });

  it("should fail validation for missing or empty version code", () => {
    const missingVersionCode = {};
    const emptyVersionCode = { versionCode: "" };

    expect(() => routingPostSchema.parse(missingVersionCode)).toThrow();
    expect(() => routingPostSchema.parse(emptyVersionCode)).toThrow();
  });
});

describe("routingLogOutTool", () => {
  it("should log out user and return response", async () => {
    const mockYunoClient = {
      routing: {
        logout: rstest.fn().mockResolvedValue({ 
          success: true, 
          message: "Logged out successfully" 
        }),
      },
    };
    const input = {};
    const result = await routingLogOutTool.handler({ yunoClient: mockYunoClient as any, type: "text" })(input);
    expect(mockYunoClient.routing.logout).toHaveBeenCalled();
    expect(result.content[0].text).toContain("success");
    expect(result.content[0].text).toContain("Logged out successfully");
  });

  it("should return object type when type is object", async () => {
    const mockYunoClient = {
      routing: {
        logout: rstest.fn().mockResolvedValue({ 
          success: true, 
          message: "Logged out successfully" 
        }),
      },
    };
    const input = {};
    const result = await routingLogOutTool.handler({ yunoClient: mockYunoClient as any, type: "object" })(input);
    expect(result.content[0].type).toBe("object");
    expect(result.content[0].object).toEqual({ 
      success: true, 
      message: "Logged out successfully" 
    });
  });

  it("should validate empty logout payload", () => {
    const validRequest = {};
    expect(() => routingLogOutSchema.parse(validRequest)).not.toThrow();
  });

  it("should handle logout without any parameters", async () => {
    const mockYunoClient = {
      routing: {
        logout: rstest.fn().mockResolvedValue({ success: true }),
      },
    };
    const result = await routingLogOutTool.handler({ yunoClient: mockYunoClient as any, type: "text" })({});
    expect(mockYunoClient.routing.logout).toHaveBeenCalledWith();
    expect(result.content[0].text).toContain("success");
  });
});