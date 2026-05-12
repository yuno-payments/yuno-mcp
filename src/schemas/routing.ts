import { z } from "zod";

const routingLoginSchema = z.object({
    username: z.string().min(1).email().describe("The email address for login (required)"),
    password: z.string().min(1).describe("The password for login (required)"),
    remember_device: z.boolean().default(false).describe("Automatically set to false for security"),
});

const routingCreateSchema = z.object({
    name: z.string().min(1).max(255).describe("The name of the routing configuration"),
    payment_method: z.string().min(1).max(255).describe("The payment method for the routing configuration"),
});

const routingGetConnectionsSchema = z.object({
    paymentMethod: z.string().min(1).describe("The payment method to get connections for"),
});

const conditionDetailSchema = z.object({
    name: z.string().describe("The name of the condition"),
    description: z.string().describe("Description of the condition"),
    criteria: z.string().describe("Criteria type for the condition"),
    operators: z.array(z.string()).describe("Available operators for the condition"),
    payment_methods: z.array(z.string()).describe("Associated payment methods"),
    value_source: z.string().describe("Source of the value"),
    icon: z.string().describe("Icon identifier for the condition"),
});

const conditionSchema = z.object({
    condition_set_id: z.number().describe("ID of the condition set"),
    condition_type: z.string().describe("Type of condition"),
    values: z.array(z.any()).describe("Values for the condition"),
    conditional: z.string().describe("Conditional operator"),
    complex_name: z.string().nullish().describe("Complex name for the condition"),
    complex_index: z.string().nullish().describe("Complex index for the condition"),
    additional_field_name: z.string().nullish().describe("Additional field name"),
    detail: conditionDetailSchema.describe("Detailed information about the condition"),
    visible: z.boolean().describe("Whether the condition is visible"),
    metadata_key: z.string().nullish().describe("Metadata key"),
    time_period_repeat_amount: z.number().nullish().describe("Time period repeat amount"),
    time_period_repetition_days: z.number().nullish().describe("Time period repetition days"),
    time_period_repeat_frequency: z.string().nullish().describe("Time period repeat frequency"),
    time_period_start_time: z.string().nullish().describe("Time period start time"),
    time_period_end_time: z.string().nullish().describe("Time period end time"),
});

const routeOutputSchema = z.object({
    output: z.enum(["SUCCEEDED", "DECLINED", "ERROR"]).describe("Output type - must be SUCCEEDED, DECLINED, or ERROR"),
    order: z.number().describe("Order of the output"),
    type: z.enum(["SUCCESS", "WARNING", "ERROR"]).describe("Type of the output - must be SUCCESS, WARNING, or ERROR"),
    has_split: z.boolean().describe("Whether the output has split"),
    decline_types: z.array(z.string()).describe("Types of declines"),
    next_route_index: z.number().nullish().describe("Next route index"),
    next_route_indexes: z.array(z.number()).describe("Next route indexes"),
    id: z.string().nullish().describe("Output ID"),
});

const routeDataSchema = z.object({
    action: z.string().nullish().describe("Action for the route"),
    provider_id: z.string().describe("Provider ID"),
    integration_code: z.string().describe("Integration code"),
    provider_type: z.enum(["PAYMENT", "PROCESSOR"]).describe("Type of provider - must be PAYMENT or PROCESSOR"),
});

const routeSchema = z.object({
    type: z.enum(["PROVIDER", "CONDITION"]).describe("Type of route - must be PROVIDER or CONDITION"),
    outputs: z.array(routeOutputSchema).describe("Route outputs"),
    index: z.number().describe("Route index"),
    updated_at: z.string().describe("Last update timestamp"),
    repair: z.boolean().describe("Whether the route is in repair mode"),
    data: routeDataSchema.describe("Route data configuration"),
});

const startConfigSchema = z.object({
    index: z.number().describe("Start index"),
    percentage: z.number().describe("Percentage allocation"),
});

const conditionSetSchema = z.object({
    editable: z.boolean().describe("Whether the condition set is editable"),
    sort_number: z.number().describe("Sort order number"),
    conditions: z.array(conditionSchema).describe("Conditions in the set"),
    routes: z.array(routeSchema).describe("Routes in the condition set"),
    start: z.array(startConfigSchema).describe("Start configuration"),
    updated_at: z.string().describe("Last update timestamp"),
    category: z.string().describe("Category of the condition set"),
    expired: z.boolean().describe("Whether the condition set is expired"),
    threshold_code: z.string().nullish().describe("Threshold code"),
    monitor_active: z.boolean().nullish().describe("Whether monitoring is active"),
    id: z.number().describe("Condition set ID"),
    name: z.string().nullish().describe("Name of the condition set"),
    description: z.string().nullish().describe("Description of the condition set"),
    smart_routing_mode: z.string().nullish().describe("Smart routing mode"),
});

const workflowSchema = z.object({
    id: z.number().describe("Workflow ID"),
    code: z.string().describe("Workflow code (UUID)"),
    name: z.string().describe("Workflow name"),
    status: z.string().describe("Workflow status"),
    account_code: z.string().describe("Account code (UUID)"),
    created_at: z.string().describe("Creation timestamp"),
    updated_at: z.string().describe("Last update timestamp"),
    payment_method_type: z.string().describe("Payment method type"),
    is_active: z.boolean().describe("Whether the workflow is active"),
});

const versionSchema = z.object({
    id: z.number().describe("Version ID"),
    workflow_id: z.number().describe("Associated workflow ID"),
    code: z.string().describe("Version code (UUID)"),
    status: z.string().describe("Version status"),
    number: z.number().describe("Version number"),
    created_at: z.string().describe("Creation timestamp"),
    updated_at: z.string().describe("Last update timestamp"),
    published_at: z.string().nullish().describe("Publication timestamp"),
    name: z.string().describe("Version name"),
    publishable: z.boolean().describe("Whether the version is publishable"),
    favorite: z.boolean().describe("Whether the version is marked as favorite"),
    repair: z.boolean().describe("Whether the version is in repair mode"),
    updated_by: z.string().describe("User who last updated the version"),
    payment_enabled: z.boolean().describe("Whether payments are enabled"),
    fraud_enabled: z.boolean().describe("Whether fraud detection is enabled"),
    paused: z.boolean().describe("Whether the version is paused"),
    deleted_at: z.string().nullish().describe("Deletion timestamp"),
});

const routingIntegrationSchema = z.object({
    integration_code: z.string().nullish().describe("Integration code identifier"),
    type: z.string().nullish().describe("Type of integration"),
    provider_id: z.string().nullish().describe("Provider identifier"),
    icon: z.string().nullish().describe("Icon URL or identifier"),
    name: z.string().nullish().describe("Integration name"),
    description: z.string().nullish().describe("Integration description"),
    active: z.boolean().nullish().describe("Whether the integration is active"),
    connection_name: z.string().nullish().describe("Connection name"),
    provider_icon: z.string().nullish().describe("Provider icon URL or identifier"),
    category: z.string().nullish().describe("Integration category"),
    created_at: z.string().nullish().describe("Creation timestamp"),
    updated_at: z.string().nullish().describe("Last update timestamp"),
    provider_name: z.string().nullish().describe("Provider name"),
    connection_state: z.string().nullish().describe("Connection state"),
    flow_type: z.string().nullish().describe("Flow type"),
    costs: z.array(z.any()).nullish().describe("Associated costs"),
});

const routingIntegrationsResponseSchema = z.object({
    integrations: z.array(routingIntegrationSchema).nullish().describe("List of integrations"),
});

const updateRouteRequestSchema = z.object({
    workflow: workflowSchema.describe("Workflow information"),
    version: versionSchema.describe("Version information"),
    condition_sets: z.array(conditionSetSchema).describe("Condition sets configuration"),
});

const workflowRequestSchema = z.object({
    updateRoute: updateRouteRequestSchema.describe("Request to update a routing workflow"),
    provider_connection_code: z.string().describe("Connection code for the routing workflow"),
    providers: routingIntegrationsResponseSchema.describe("Response containing routing integrations"),

});

const yunoRoutingLoginOutputSchema = z
    .object({
        access_token: z.string(),
        mfa_token: z.string().nullish(),
        next_step: z.string().nullish(),
        authenticator_type: z.string().nullish(),
        secret: z.string().nullish(),
        barcode_uri: z.string().nullish(),
    })
    .passthrough();

const yunoConditionDetailOutputSchema = z
    .object({
        name: z.string().nullish(),
        description: z.string().nullish(),
        criteria: z.string().nullish(),
        operators: z.array(z.string()).nullish(),
        payment_methods: z.array(z.string()).nullish(),
        value_source: z.string().nullish(),
        icon: z.string().nullish(),
    })
    .passthrough();

const yunoConditionOutputSchema = z
    .object({
        condition_set_id: z.number().nullish(),
        condition_type: z.string().nullish(),
        values: z.array(z.any()).nullish(),
        conditional: z.string().nullish(),
        complex_name: z.string().nullish(),
        complex_index: z.string().nullish(),
        additional_field_name: z.string().nullish(),
        detail: yunoConditionDetailOutputSchema.nullish(),
        visible: z.boolean().nullish(),
        metadata_key: z.string().nullish(),
        time_period_repeat_amount: z.number().nullish(),
        time_period_repetition_days: z.number().nullish(),
        time_period_repeat_frequency: z.string().nullish(),
        time_period_start_time: z.string().nullish(),
        time_period_end_time: z.string().nullish(),
    })
    .passthrough();

const yunoRouteNextIndexOutputSchema = z
    .object({
        index: z.number().nullish(),
        percentage: z.number().nullish(),
    })
    .passthrough();

const yunoRouteOutputOutputSchema = z
    .object({
        has_split: z.boolean().nullish(),
        output: z.string().nullish(),
        order: z.number().nullish(),
        type: z.string().nullish(),
        next_route_indexes: z.array(yunoRouteNextIndexOutputSchema).nullish(),
        next_route_index: z.number().nullish(),
        name: z.string().nullish(),
        id: z.string().nullish(),
        decline_types: z.array(z.any()).nullish(),
    })
    .passthrough();

const yunoRouteDataOutputSchema = z
    .object({
        action: z.string().nullish(),
        integration_code: z.string().nullish(),
        provider_id: z.string().nullish(),
        provider_type: z.enum(["PAYMENT", "PROCESSOR"]).nullish(),
        provider_icon: z.string().nullish(),
        provider_name: z.string().nullish(),
        time_out: z.number().nullish(),
        monitor_message: z.boolean().nullish(),
        network_token_on: z.boolean().nullish(),
        network_token_enable: z.boolean().nullish(),
        smart_routing: z.boolean().nullish(),
        three_d_secure_exemptions: z.array(z.any()).nullish(),
        percentage: z.string().nullish(),
    })
    .passthrough();

const yunoRouteOutputSchema = z
    .object({
        index: z.number().nullish(),
        outputs: z.array(yunoRouteOutputOutputSchema).nullish(),
        data: yunoRouteDataOutputSchema.nullish(),
        type: z.enum(["PROVIDER", "CONDITION"]).nullish(),
        updated_at: z.string().nullish(),
        repair: z.boolean().nullish(),
        paused: z.boolean().nullish(),
        alerted: z.boolean().nullish(),
    })
    .passthrough();

const yunoConditionSetStartOutputSchema = z
    .object({
        index: z.number().nullish(),
        percentage: z.number().nullish(),
    })
    .passthrough();

const yunoConditionSetOutputSchema = z
    .object({
        editable: z.boolean().nullish(),
        sort_number: z.number().nullish(),
        conditions: z.array(yunoConditionOutputSchema).nullish(),
        routes: z.array(yunoRouteOutputSchema).nullish(),
        start: z.array(yunoConditionSetStartOutputSchema).nullish(),
        updated_at: z.string().nullish(),
        category: z.string().nullish(),
        expired: z.boolean().nullish(),
        threshold_code: z.string().nullish(),
        monitor_active: z.boolean().nullish(),
        id: z.number().nullish(),
        name: z.string().nullish(),
        description: z.string().nullish(),
        smart_routing_mode: z.string().nullish(),
    })
    .passthrough();

const yunoWorkflowOutputSchema = z
    .object({
        id: z.number().nullish(),
        code: z.string().nullish(),
        name: z.string().nullish(),
        status: z.string().nullish(),
        account_code: z.string().nullish(),
        created_at: z.string().nullish(),
        updated_at: z.string().nullish(),
        payment_method_type: z.string().nullish(),
        is_active: z.boolean().nullish(),
    })
    .passthrough();

const yunoWorkflowVersionOutputSchema = z
    .object({
        id: z.number().nullish(),
        workflow_id: z.number().nullish(),
        code: z.string().nullish(),
        status: z.string().nullish(),
        number: z.number().nullish(),
        created_at: z.string().nullish(),
        updated_at: z.string().nullish(),
        published_at: z.string().nullish(),
        name: z.string().nullish(),
        publishable: z.boolean().nullish(),
        favorite: z.boolean().nullish(),
        repair: z.boolean().nullish(),
        updated_by: z.string().nullish(),
        payment_enabled: z.boolean().nullish(),
        fraud_enabled: z.boolean().nullish(),
        paused: z.boolean().nullish(),
        deleted_at: z.string().nullish(),
    })
    .passthrough();

const yunoRoutingWorkflowOutputSchema = z
    .object({
        workflow: yunoWorkflowOutputSchema.nullish(),
        version: yunoWorkflowVersionOutputSchema.nullish(),
        condition_sets: z.array(yunoConditionSetOutputSchema).nullish(),
    })
    .passthrough();

const yunoRoutingIntegrationOutputSchema = z
    .object({
        integration_code: z.string().nullish(),
        type: z.string().nullish(),
        provider_id: z.string().nullish(),
        icon: z.string().nullish(),
        name: z.string().nullish(),
        description: z.string().nullish(),
        active: z.boolean().nullish(),
        connection_name: z.string().nullish(),
        provider_icon: z.string().nullish(),
        category: z.string().nullish(),
        created_at: z.string().nullish(),
        updated_at: z.string().nullish(),
        provider_name: z.string().nullish(),
        connection_state: z.string().nullish(),
        flow_type: z.string().nullish(),
        costs: z.array(z.any()).nullish(),
    })
    .passthrough();

const yunoRoutingIntegrationsOutputSchema = z
    .object({
        integrations: z.array(yunoRoutingIntegrationOutputSchema).nullish(),
    })
    .passthrough();

const yunoRoutingLogoutOutputSchema = z
    .object({
        success: z.boolean().nullish(),
        message: z.string().nullish(),
    })
    .passthrough();

export {
    routingLoginSchema,
    routingCreateSchema,
    routingGetConnectionsSchema,
    workflowRequestSchema,
    workflowSchema,
    versionSchema,
    conditionSetSchema,
    yunoRoutingLoginOutputSchema,
    yunoRoutingWorkflowOutputSchema,
    yunoRoutingIntegrationsOutputSchema,
    yunoRoutingLogoutOutputSchema,
};
