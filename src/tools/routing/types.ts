import z from "zod";
import {workflowRequestSchema} from "../../schemas";

export interface YunoRoutingLogin {
    username: string;
    password: string;
    remember_device: boolean;
}

export interface TestYunoRoutingLogin {
    username: string;
    password: string;
    remember_device?: boolean;
    name: string;
    payment_method: string;
}

export interface YunoRoutingCreateSchema {
    name: string;
    payment_method: string;
}

export interface YunoRoutingLoginResponse {
    access_token: string;
    mfa_token?: string;
    next_step?: string;
    authenticator_type?: string;
    secret?: string;
    barcode_uri?: string
}

export interface YunoWorkflow {
    id?: number;
    code?: string;
    name?: string;
    status?: string;
    account_code?: string;
    created_at?: string;
    updated_at?: string;
    payment_method_type?: string;
    is_active?: boolean;
}

export interface YunoWorkflowVersion {
    id?: number;
    workflow_id?: number;
    code?: string;
    status?: string;
    number?: number;
    created_at?: string;
    updated_at?: string;
    published_at?: string | null;
    name?: string;
    publishable?: boolean;
    favorite?: boolean;
    repair?: boolean;
    updated_by?: string;
    payment_enabled?: boolean;
    fraud_enabled?: boolean;
    paused?: boolean;
    deleted_at?: string | null;
}

export interface YunoConditionDetail {
    name?: string;
    description?: string;
    criteria?: string;
    operators?: string[];
    payment_methods?: string[];
    value_source?: string;
    icon?: string;
}

export interface YunoCondition {
    condition_set_id?: number;
    condition_type?: string;
    values?: any[];
    conditional?: string;
    complex_name?: string | null;
    complex_index?: string | null;
    additional_field_name?: string | null;
    detail?: YunoConditionDetail;
    visible?: boolean;
    metadata_key?: string | null;
    time_period_repeat_amount?: number | null;
    time_period_repetition_days?: number | null;
    time_period_repeat_frequency?: string | null;
    time_period_start_time?: string | null;
    time_period_end_time?: string | null;
}

export interface YunoRouteNextIndex {
    index?: number;
    percentage?: number;
}

export interface YunoRouteOutput {
    has_split?: boolean;
    output?: string;
    order?: number;
    type?: string;
    next_route_indexes?: YunoRouteNextIndex[];
    next_route_index?: number | null;
    name?: string | null;
    id?: string | null;
    decline_types?: any[];
}

export interface YunoRouteData {
    action?: string | null;
    integration_code?: string;
    provider_id?: string;
    provider_type?: "PAYMENT" | "PROCESSOR";
    provider_icon?: string;
    provider_name?: string;
    time_out?: number;
    monitor_message?: boolean;
    network_token_on?: boolean;
    network_token_enable?: boolean;
    smart_routing?: boolean;
    three_d_secure_exemptions?: any[];
    percentage?: string;
}

export interface YunoRoute {
    index?: number;
    outputs?: YunoRouteOutput[];
    data?: YunoRouteData;
    type?: "PROVIDER" | "CONDITION";
    updated_at?: string;
    repair?: boolean;
    paused?: boolean;
    alerted?: boolean;
}

export interface YunoConditionSetStart {
    index?: number;
    percentage?: number;
}

export interface YunoConditionSet {
    editable?: boolean;
    sort_number?: number;
    conditions?: YunoCondition[];
    routes?: YunoRoute[];
    start?: YunoConditionSetStart[];
    updated_at?: string;
    category?: string;
    expired?: boolean;
    threshold_code?: string | null;
    monitor_active?: boolean | null;
    id?: number;
    name?: string | null;
    description?: string | null;
    smart_routing_mode?: string | null;
}

export interface YunoRoutingIntegration {
    integration_code?: string;
    type?: string;
    provider_id?: string;
    icon?: string;
    name?: string;
    description?: string;
    active?: boolean;
    connection_name?: string;
    provider_icon?: string;
    category?: string;
    created_at?: string;
    updated_at?: string;
    provider_name?: string;
    connection_state?: string;
    flow_type?: string;
    costs?: any[];
}
export interface YunoRoutingIntegrationResponse {
    integrations?: YunoRoutingIntegration[];
}

export interface YunoRoutingWorkflowResponse {
    workflow?: YunoWorkflow;
    version?: YunoWorkflowVersion;
    condition_sets?: YunoConditionSet[];
}

export interface YunoRoutingLogoutResponse {
    success?: boolean;
    message?: string;
}

export type YunoRoutingUpdateWorkflow = z.infer<typeof workflowRequestSchema>