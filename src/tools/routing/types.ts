import { z } from "zod";
import { routingLoginSchema, routingCreateSchema } from "../../schemas";

export interface YunoCreateRouting {
    name? : string;
    payment_method?: string;
}

export interface RoutingLoginRequest {
    email: string;
    password: string;
}

export interface RoutingLoginResponse {
    access_token: string;
    mfa_token: string;
    next_step: string;
    authenticator_type: string | null;
    secret: string | null;
    barcode_uri: string | null;
}

export interface RoutingCreateRequest {
    name: string;
    paymentMethod: string;
}

export interface RoutingWorkflow {
    id: number;
    code: string;
    name: string;
    status: string;
    account_code: string;
    created_at: string;
    updated_at: string;
    payment_method_type: string;
    is_active: boolean;
}

export interface RoutingVersion {
    id: number;
    workflow_id: number;
    code: string;
    status: string;
    number: number;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    name: string;
    publishable: boolean;
    favorite: boolean;
    repair: boolean;
    updated_by: string;
    payment_enabled: boolean;
    fraud_enabled: boolean;
    paused: boolean;
    deleted_at: string | null;
}

export interface RoutingCondition {
    condition_set_id: number;
    condition_type: string;
    values: any[];
    conditional: string;
    complex_name: string | null;
    complex_index: string | null;
    additional_field_name: string | null;
    detail: {
        name: string;
        description: string;
        criteria: string;
        operators: string[];
        payment_methods: any[];
        value_source: string;
        icon: string;
    };
    visible: boolean;
    metadata_key: string | null;
    time_period_repeat_amount: string | null;
    time_period_repetition_days: string | null;
    time_period_repeat_frequency: string | null;
    time_period_start_time: string | null;
    time_period_end_time: string | null;
}

export interface RoutingConditionSet {
    editable: boolean;
    sort_number: number;
    conditions: RoutingCondition[];
    routes: any[];
    start: string | null;
    updated_at: string;
    category: string;
    expired: boolean;
    threshold_code: string | null;
    monitor_active: string | null;
    id: number;
    name: string | null;
    description: string | null;
    smart_routing_mode: string | null;
}

export interface RoutingCreateResponse {
    workflow: RoutingWorkflow;
    version: RoutingVersion;
    condition_sets: RoutingConditionSet[];
}

export type RoutingLoginSchema = z.infer<typeof routingLoginSchema>;
export type RoutingCreateSchema = z.infer<typeof routingCreateSchema>;