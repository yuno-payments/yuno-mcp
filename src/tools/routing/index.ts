import { routingLoginSchema, routingCreateSchema } from "../../schemas";
import type { HandlerContext, Output, Tool } from "../../types";
import type { RoutingLoginResponse, RoutingLoginSchema, RoutingCreateResponse, RoutingCreateSchema } from "./types";

export const routingCreateTool = {
    method: "routingLogin",
    description: "Log in to the Yuno Dashboard",
    schema: routingLoginSchema,
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
        async ({ username, password, remember_evice = false }: RoutingLoginSchema): Promise<Output<TType, RoutingLoginResponse>> => {
            const response = await yunoClient.routing.login({ email: username, password });

            if (type === "text") {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(response, null, 4),
                        },
                    ],
                } as Output<TType, RoutingLoginResponse>;
            }

            return {
                content: [
                    {
                        type: "object" as const,
                        object: response,
                    },
                ],
            } as Output<TType, RoutingLoginResponse>;
        },
} as const satisfies Tool;

export const routingWorkflowCreateTool = {
    method: "routingCreate",
    description: "Create a new routing workflow in Yuno Dashboard (automatically handles login)",
    schema: routingCreateSchema,
    handler:
        <TType extends "object" | "text">({ yunoClient, type }: HandlerContext<TType>) =>
        async ({ name, paymentMethod, username, password }: RoutingCreateSchema): Promise<Output<TType, RoutingCreateResponse>> => {
            // Step 1: Login to get access token
            const loginResponse = await yunoClient.routing.login({ 
                email: username, 
                password 
            });
            
            // Step 2: Use access token to create workflow
            const response = await yunoClient.routing.create({ name, paymentMethod }, loginResponse.access_token);

            if (type === "text") {
                return {
                    content: [
                        {
                            type: "text" as const,
                            text: JSON.stringify(response, null, 4),
                        },
                    ],
                } as Output<TType, RoutingCreateResponse>;
            }

            return {
                content: [
                    {
                        type: "object" as const,
                        object: response,
                    },
                ],
            } as Output<TType, RoutingCreateResponse>;
        },
} as const satisfies Tool;

export const routingTools = [
    routingCreateTool,
    routingWorkflowCreateTool
] as const satisfies Tool[];