import { routingLoginSchema, routingCreateSchema, routingGetConnectionsSchema, workflowRequestSchema } from "../../schemas";
import {
    YunoRoutingCreateSchema, YunoRoutingIntegrationResponse,
    YunoRoutingLogin,
    YunoRoutingLoginResponse, YunoRoutingUpdateWorkflow, YunoRoutingWorkflowResponse, YunoRoutingLogoutResponse,
} from "./types";
import type { HandlerContext, Output, Tool } from "../../types";
import { z } from "zod";

export const routingLoginTool = {
    method: "routingLogin",
    description: "Authenticate to the Yuno dashboard. You must provide your username (email) and password. The remember_device option is automatically set to false for security.",
    schema: routingLoginSchema,
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
            async (data: YunoRoutingLogin): Promise<Output<TType, YunoRoutingLoginResponse>> => {
                const YunoLoginResponse = await yunoClient.routing.login(data);

                if (type === "text") {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: JSON.stringify(YunoLoginResponse, null, 4),
                            },
                        ],
                    } as Output<TType, YunoRoutingLoginResponse>;
                }
                
                return {
                    content: [
                        {
                            type: "object" as const,
                            object: YunoLoginResponse,
                        },
                    ],
                } as Output<TType, YunoRoutingLoginResponse>;
            },
}  as const satisfies Tool;

export const routingCreateTool = {
    method: "routingCreate",
    description: "Create a routing configuration. You must provide the name and payment method.",
    schema: routingCreateSchema,
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
            async (data: YunoRoutingCreateSchema): Promise<Output<TType, YunoRoutingWorkflowResponse>> => {
                const routingResponse = await yunoClient.routing.create(data);

                if (type === "text") {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: JSON.stringify(routingResponse, null, 4),
                            },
                        ],
                    } as Output<TType, YunoRoutingWorkflowResponse>;
                }
                
                return {
                    content: [
                        {
                            type: "object" as const,
                            object: routingResponse,
                        },
                    ],
                } as Output<TType, YunoRoutingWorkflowResponse>;
            },
}  as const satisfies Tool;

export const routingGetProvidersTool = {
    method: "routingGetProviders",
    description: "Retrieve all routing connections for a specific payment method. The account_code is automatically taken from the client configuration.",
    schema: routingGetConnectionsSchema,
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
            async (data: { paymentMethod: string }): Promise<Output<TType, YunoRoutingIntegrationResponse>> => {
                const connections = await yunoClient.routing.getConnections(data.paymentMethod);

                if (type === "text") {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: JSON.stringify(connections, null, 4),
                            },
                        ],
                    } as Output<TType, YunoRoutingIntegrationResponse>;
                }
                return {
                    content: [
                        {
                            type: "object" as const,
                            object: connections,
                        },
                    ],
                } as Output<TType, YunoRoutingIntegrationResponse>;
            },
} as const satisfies Tool;

export const routingRetrieveTool = {
    method: "routingRetrieve",
    description: "Retrieve a routing workflow configuration by version code.",
    schema: z.object({
        versionCode: z.string().min(1).describe("The version code to retrieve"),
    }),
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
            async (data: { versionCode: string }): Promise<Output<TType, YunoRoutingWorkflowResponse>> => {
                const workflow = await yunoClient.routing.retrieve(data.versionCode);

                if (type === "text") {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: JSON.stringify(workflow, null, 4),
                            },
                        ],
                    } as Output<TType, YunoRoutingWorkflowResponse>;
                }
                return {
                    content: [
                        {
                            type: "object" as const,
                            object: workflow,
                        },
                    ],
                } as Output<TType, YunoRoutingWorkflowResponse>;
            },
} as const satisfies Tool;

export const routingUpdateTool = {
    method: "routingUpdate",
    description: "Configure a routing provider by setting up the provider connection in an existing workflow.",
    schema: workflowRequestSchema,
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
            async (data: YunoRoutingUpdateWorkflow): Promise<Output<TType, YunoRoutingWorkflowResponse>> => {
                const result = await yunoClient.routing.update(data);

                if (type === "text") {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: JSON.stringify(result, null, 4),
                            },
                        ],
                    } as Output<TType, YunoRoutingWorkflowResponse>;
                }
                return {
                    content: [
                        {
                            type: "object" as const,
                            object: result,
                        },
                    ],
                } as Output<TType, YunoRoutingWorkflowResponse>;
            },
} as const satisfies Tool;

export const routingPostTool = {
    method: "routingPost",
    description: "Post a routing workflow configuration to the Yuno API.",
    schema: z.object({
        versionCode: z.string().min(1).describe("The version code to post"),
    }),
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
            async (data: { versionCode: string }): Promise<Output<TType, YunoRoutingWorkflowResponse>> => {
                const result = await yunoClient.routing.post(data.versionCode);

                if (type === "text") {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: JSON.stringify(result, null, 4),
                            },
                        ],
                    } as Output<TType, YunoRoutingWorkflowResponse>;
                }
                return {
                    content: [
                        {
                            type: "object" as const,
                            object: result,
                        },
                    ],
                } as Output<TType, YunoRoutingWorkflowResponse>;
            },
} as const satisfies Tool;

export const routingLogOutTool = {
    method: "routingLogOut",
    description: "Log out from the Yuno dashboard. This will invalidate the current session.",
    schema: z.object({}),
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
            async (): Promise<Output<TType, YunoRoutingLogoutResponse>> => {
                await yunoClient.routing.logout();
                
                // Create a success response since logout returns void
                const result: YunoRoutingLogoutResponse = {
                    success: true,
                    message: "Logged out successfully"
                };

                if (type === "text") {
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: JSON.stringify(result, null, 4),
                            },
                        ],
                    } as Output<TType, YunoRoutingLogoutResponse>;
                }
                return {
                    content: [
                        {
                            type: "object" as const,
                            object: result,
                        },
                    ],
                } as Output<TType, YunoRoutingLogoutResponse>;
            },
} as const satisfies Tool;

export const routingTools = [
    routingLoginTool,
    routingCreateTool,
    routingGetProvidersTool,
    routingRetrieveTool,
    routingUpdateTool,
    routingPostTool,
    routingLogOutTool
] as const satisfies Tool[];