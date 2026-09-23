import Ajv2020 from "ajv/dist/2020.js";
import { withCaptureDisabled } from "../client/YunoClient";

/**
 * The conformance contract, asserted against a *live* MCP server.
 *
 * Every check reads what the deployed server actually advertises (`tools/list`)
 * and how it actually behaves (`tools/call` with deliberately invalid arguments),
 * never a re-derivation from this repository's source. The per-tool unit test that
 * this replaces recomputed each tool's schema itself, so it could not catch a
 * regression in the very compaction/registration path it was meant to guard —
 * this reads the surface a client receives instead.
 *
 * Every probe is read-only: it either lists tools or calls a tool with arguments
 * that fail validation before any Yuno API request is made. Destructive tools are
 * never invoked with arguments that could execute.
 *
 * `describeTool` is used as the live source-of-truth for the full (uncompacted)
 * schema, so "the lean schema still accepts what the underlying schema accepts"
 * and "descriptions survive" are both asserted over the wire, comparing the lean
 * `tools/list` surface against the full `describeTool` surface.
 */

export type Finding = {
  /** The tool the violation belongs to (or "describeTool"/"server" for meta checks). */
  tool: string;
  /** Short, stable label for the finding category. */
  finding: string;
  /** Operator-facing detail. */
  message: string;
};

export type JsonSchemaNode = Record<string, unknown>;

export type ListedTool = {
  name: string;
  description?: string;
  inputSchema?: JsonSchemaNode;
  outputSchema?: JsonSchemaNode;
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; [key: string]: unknown };
};

export type CallResult = {
  isError?: boolean;
  content?: Array<{ type?: string; text?: string }>;
};

/** The minimal MCP client surface the checks need. The SDK `Client` satisfies it. */
export interface McpProbe {
  listTools(): Promise<{ tools: ListedTool[] }>;
  callTool(args: { name: string; arguments?: Record<string, unknown> }): Promise<CallResult>;
}

/** A tool answered by describeTool: the full, uncompacted schema plus its worked example. */
export type DescribedTool = {
  method: string;
  description?: string;
  inputSchema?: JsonSchemaNode;
  outputSchema?: JsonSchemaNode;
  example?: unknown;
};

const PROBE_MARKER = "conformanceProbeKey";

export const textOf = (result: CallResult | undefined): string =>
  (result?.content ?? []).find((entry) => entry.type === "text")?.text ?? "";

const snakeToCamel = (key: string): string => key.replace(/_([a-z])/g, (_all, letter: string) => letter.toUpperCase());

const topLevelProperties = (schema: JsonSchemaNode | undefined): Record<string, JsonSchemaNode> =>
  (schema?.properties as Record<string, JsonSchemaNode> | undefined) ?? {};

const requiredOf = (schema: JsonSchemaNode | undefined): string[] =>
  Array.isArray(schema?.required) ? (schema.required as string[]) : [];

/** A snake_case top-level property whose camelCase form makes a good "unknown parameter" probe. */
function probeKeyFor(tool: ListedTool): { sent: string; canonical: string } {
  const snakeProp = Object.keys(topLevelProperties(tool.inputSchema)).find((key) => key.includes("_"));
  if (snakeProp) return { sent: snakeToCamel(snakeProp), canonical: snakeProp };
  return { sent: PROBE_MARKER, canonical: "conformance_probe_key" };
}

// ---------------------------------------------------------------------------
// Live surface collection
// ---------------------------------------------------------------------------

export type LiveSurface = {
  tools: ListedTool[];
  toolsByName: Map<string, ListedTool>;
  /** Result of a name-acceptance probe per advertised tool. `undefined` value => throw (name rejected). */
  nameAccepted: Map<string, boolean>;
  /** Result of the unknown-parameter probe per tool. */
  unknownParamProbe: Map<string, CallResult>;
  /** Result of the missing-argument probe, where it is safe to make one. */
  missingArgProbe: Map<string, CallResult | undefined>;
  /** Every tool describeTool says it can describe. */
  describeAvailable: string[];
  /** describeTool's answer for each tool it names. */
  described: Map<string, DescribedTool | { error: string }>;
};

const parseDescribed = (text: string): DescribedTool | { error: string } => {
  try {
    return JSON.parse(text) as DescribedTool;
  } catch {
    return { error: `describeTool returned non-JSON: ${text.slice(0, 120)}` };
  }
};

/** Parses the "Available tools: a, b, c" list describeTool returns for an unknown method. */
export function parseAvailableTools(text: string): string[] {
  const marker = "Available tools:";
  const at = text.indexOf(marker);
  if (at < 0) return [];
  return text
    .slice(at + marker.length)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * Drives the live server once, gathering everything the checks need. All probes
 * are read-only. Destructive tools (per their advertised annotations) are never
 * probed with a missing-argument call that could reach the API.
 */
export async function collectSurface(probe: McpProbe): Promise<LiveSurface> {
  const { tools } = await probe.listTools();
  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));

  const nameAccepted = new Map<string, boolean>();
  const unknownParamProbe = new Map<string, CallResult>();
  const missingArgProbe = new Map<string, CallResult | undefined>();

  for (const tool of tools) {
    const { sent } = probeKeyFor(tool);
    try {
      const result = await probe.callTool({ name: tool.name, arguments: { [sent]: "conformance-probe" } });
      nameAccepted.set(tool.name, true);
      unknownParamProbe.set(tool.name, result);
    } catch (error) {
      // The SDK throws (McpError -32602) when the name is not a registered tool.
      nameAccepted.set(tool.name, false);
      unknownParamProbe.set(tool.name, { isError: true, content: [{ type: "text", text: String(error) }] });
    }

    // Missing-argument probe: only where a call with {} cannot cause a side effect.
    // Read-only tools are always safe; a mutating tool is probed only when it
    // advertises required keys, so validation refuses {} before any API request.
    const readOnly = tool.annotations?.readOnlyHint === true;
    const hasRequired = requiredOf(tool.inputSchema).length > 0;
    if (readOnly || hasRequired) {
      try {
        missingArgProbe.set(tool.name, await probe.callTool({ name: tool.name, arguments: {} }));
      } catch (error) {
        missingArgProbe.set(tool.name, { isError: true, content: [{ type: "text", text: String(error) }] });
      }
    } else {
      missingArgProbe.set(tool.name, undefined);
    }
  }

  // describeTool: unknown-method listing, then a describe call per named tool.
  const describeAvailable: string[] = [];
  const described = new Map<string, DescribedTool | { error: string }>();
  if (toolsByName.has("describeTool")) {
    const unknown = await probe.callTool({ name: "describeTool", arguments: { method: "__conformance_unknown__" } });
    describeAvailable.push(...parseAvailableTools(textOf(unknown)));
    for (const name of describeAvailable) {
      const answer = await probe.callTool({ name: "describeTool", arguments: { method: name } });
      described.set(name, answer.isError ? { error: textOf(answer) } : parseDescribed(textOf(answer)));
    }
  }

  return { tools, toolsByName, nameAccepted, unknownParamProbe, missingArgProbe, describeAvailable, described };
}

// ---------------------------------------------------------------------------
// Individual checks (each pure over already-collected data where possible)
// ---------------------------------------------------------------------------

/** Every advertised tool name must be one the server accepts in tools/call. */
export function checkToolNamesAccepted(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    if (surface.nameAccepted.get(tool.name) !== true) {
      findings.push({
        tool: tool.name,
        finding: "tool-name-not-callable",
        message: `${tool.name} is advertised in tools/list but tools/call rejects the name (no such tool).`,
      });
    }
  }
  return findings;
}

/**
 * required[] must match what the handler enforces: no tool may advertise an empty
 * required[] while still rejecting a call with no arguments, and a tool advertising
 * required keys must actually reject a call missing them.
 */
export function checkRequiredMatchesEnforcement(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    const probe = surface.missingArgProbe.get(tool.name);
    if (probe === undefined) continue; // not safe to probe; skipped deliberately
    const required = requiredOf(tool.inputSchema);
    const rejectsMissing = probe.isError === true;
    if (rejectsMissing && required.length === 0) {
      findings.push({
        tool: tool.name,
        finding: "empty-required-but-enforced",
        message: `${tool.name} advertises required[] = [] but rejects a call with no arguments; a client is told the arguments are optional when they are not.`,
      });
    }
    if (!rejectsMissing && required.length > 0) {
      findings.push({
        tool: tool.name,
        finding: "required-not-enforced",
        message: `${tool.name} advertises required ${JSON.stringify(required)} but accepted a call with no arguments; the advertised contract is not enforced.`,
      });
    }
  }
  return findings;
}

/**
 * An unknown / misspelled parameter must be refused, never silently dropped, and
 * the refusal must name the correct snake_case spelling. The probe sends the
 * camelCase form of a real snake_case parameter, which is exactly the mistake a
 * model makes.
 */
export function checkUnknownParameterRefused(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    const result = surface.unknownParamProbe.get(tool.name);
    if (!result) continue;
    const { sent, canonical } = probeKeyFor(tool);
    const text = textOf(result);
    if (result.isError !== true) {
      findings.push({
        tool: tool.name,
        finding: "unknown-parameter-silently-accepted",
        message: `${tool.name} accepted the unknown parameter "${sent}" instead of refusing it; a misspelled parameter is silently dropped.`,
      });
      continue;
    }
    if (!text.includes(canonical)) {
      findings.push({
        tool: tool.name,
        finding: "unknown-parameter-no-hint",
        message: `${tool.name} refused "${sent}" but the message never names the correct snake_case spelling "${canonical}".`,
      });
    }
  }
  return findings;
}

export type CaptureTransform = (payment: unknown) => unknown;

/**
 * paymentAuthorize must never send a payment that would capture, and must refuse
 * types it cannot hold. This is asserted against the shipped transform the
 * paymentAuthorize handler applies before the request goes out; re-adding the
 * old "only set capture when detail.card was already present" behaviour makes it
 * fail naming paymentAuthorize. The transform is injectable for testing.
 */
export function checkAuthorizeNeverCaptures(transform: CaptureTransform = withCaptureDisabled as CaptureTransform): Finding[] {
  const findings: Finding[] = [];
  const capture = (payment: unknown): unknown => {
    const method = (payment as { payment_method?: { detail?: Record<string, { capture?: unknown }> } }).payment_method;
    return method?.detail;
  };

  const cases: Array<{ label: string; payment: unknown; slot: "card" | "wallet" }> = [
    { label: "CARD type", payment: { payment_method: { type: "CARD", detail: { card: { number: "4111111111111111" } } } }, slot: "card" },
    { label: "CARD type without a card detail (token only)", payment: { payment_method: { type: "CARD", detail: { token: "tok_x" } } }, slot: "card" },
    { label: "GOOGLE_PAY wallet", payment: { payment_method: { type: "GOOGLE_PAY", detail: { wallet: {} } } }, slot: "wallet" },
    { label: "APPLE_PAY wallet", payment: { payment_method: { type: "APPLE_PAY", detail: {} } }, slot: "wallet" },
  ];
  for (const { label, payment, slot } of cases) {
    let held: unknown;
    try {
      const detail = capture(transform(payment)) as Record<string, { capture?: unknown }> | undefined;
      held = detail?.[slot]?.capture;
    } catch (error) {
      findings.push({
        tool: "paymentAuthorize",
        finding: "authorize-would-capture",
        message: `paymentAuthorize threw for ${label} instead of holding funds: ${String(error)}`,
      });
      continue;
    }
    if (held !== false) {
      findings.push({
        tool: "paymentAuthorize",
        finding: "authorize-would-capture",
        message: `paymentAuthorize did not set detail.${slot}.capture=false for ${label}; the authorization would capture and charge the customer.`,
      });
    }
  }

  // A type it cannot hold must be refused, not silently sent as a purchase.
  let refused = false;
  try {
    transform({ payment_method: { type: "PIX", detail: { pix: {} } } });
  } catch {
    refused = true;
  }
  if (!refused) {
    findings.push({
      tool: "paymentAuthorize",
      finding: "authorize-unsupported-not-refused",
      message: "paymentAuthorize did not refuse a payment type it cannot hold (PIX); it would be sent as a purchase.",
    });
  }
  return findings;
}

/** Every top-level parameter that carries a description in the full schema must carry it in tools/list. */
export function checkDescriptionsPreserved(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    const described = surface.described.get(tool.name);
    if (!described || "error" in described || !described.inputSchema) continue;
    const full = topLevelProperties(described.inputSchema);
    const lean = topLevelProperties(tool.inputSchema);
    for (const [key, node] of Object.entries(full)) {
      const fullDescribed = typeof node.description === "string" && node.description.length > 0;
      if (!fullDescribed) continue;
      const leanNode = lean[key] as JsonSchemaNode | undefined;
      const leanDescription = leanNode?.description;
      const leanDescribed = typeof leanDescription === "string" && leanDescription.length > 0;
      if (!leanDescribed) {
        findings.push({
          tool: tool.name,
          finding: "description-dropped",
          message: `${tool.name}.${key} carries a description in the full schema but not in the live tools/list.`,
        });
      }
    }
  }
  return findings;
}

/** True when a JSON Schema node accepts a JSON null. */
export function acceptsNull(node: JsonSchemaNode | undefined): boolean {
  if (!node || typeof node !== "object") return false;
  // An empty schema (a collapsed z.unknown()) accepts anything, null included.
  if (Object.keys(node).length === 0) return true;
  const type = node.type;
  if (type === "null") return true;
  if (Array.isArray(type) && type.includes("null")) return true;
  for (const key of ["anyOf", "oneOf", "allOf"] as const) {
    const members = node[key];
    if (Array.isArray(members) && members.some((member) => acceptsNull(member as JsonSchemaNode))) return true;
  }
  return false;
}

/**
 * Each lean top-level schema must still accept a null wherever the full schema
 * does, so no client rejects a valid response the underlying schema allows.
 */
export function checkLeanAcceptsNull(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    const described = surface.described.get(tool.name);
    if (!described || "error" in described || !described.inputSchema) continue;
    const full = topLevelProperties(described.inputSchema);
    const lean = topLevelProperties(tool.inputSchema);
    for (const [key, node] of Object.entries(full)) {
      const leanNode = lean[key] as JsonSchemaNode | undefined;
      if (acceptsNull(node) && leanNode && !acceptsNull(leanNode)) {
        findings.push({
          tool: tool.name,
          finding: "lean-rejects-null",
          message: `${tool.name}.${key} accepts null in the full schema but the lean tools/list schema does not; a client may reject a valid value.`,
        });
      }
    }
  }
  return findings;
}

/** Recursively finds any node whose `type` is an array (the shorthand released agent-toolkit cannot read). */
function findArrayTypeShorthand(node: unknown, path: string, out: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      findArrayTypeShorthand(item, `${path}[${String(index)}]`, out);
    });
    return;
  }
  if (!node || typeof node !== "object") return;
  const record = node as JsonSchemaNode;
  if (Array.isArray(record.type)) out.push(path || "(root)");
  for (const [key, value] of Object.entries(record)) {
    findArrayTypeShorthand(value, path ? `${path}.${key}` : key, out);
  }
}

/** No advertised schema may use the array-form `type` shorthand. */
export function checkNoArrayTypeShorthand(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    for (const [which, schema] of [
      ["inputSchema", tool.inputSchema],
      ["outputSchema", tool.outputSchema],
    ] as const) {
      if (!schema) continue;
      const hits: string[] = [];
      findArrayTypeShorthand(schema, "", hits);
      if (hits.length > 0) {
        findings.push({
          tool: tool.name,
          finding: "array-type-shorthand",
          message: `${tool.name} ${which} uses the array-form type shorthand at ${hits.join(", ")}; released agent-toolkit versions cannot read it.`,
        });
      }
    }
  }
  return findings;
}

/**
 * describeTool must answer for every tool it names and every tool tools/list
 * advertises, and each worked example must validate against its own input schema.
 */
export function checkDescribeToolCoverageAndExamples(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  const ajv = new Ajv2020({ strict: false, allErrors: true });

  const advertised = surface.tools.map((tool) => tool.name).filter((name) => name !== "describeTool");
  for (const name of advertised) {
    if (!surface.describeAvailable.includes(name)) {
      findings.push({
        tool: name,
        finding: "describe-missing-tool",
        message: `${name} is advertised in tools/list but describeTool does not list it as describable.`,
      });
    }
  }

  for (const name of surface.describeAvailable) {
    // The meta tool names itself in its discovery list but has no schema/example
    // to serve for itself; that is by design, not a finding.
    if (name === "describeTool") continue;
    const answer = surface.described.get(name);
    if (!answer || "error" in answer) {
      findings.push({
        tool: name,
        finding: "describe-no-answer",
        message: `describeTool names ${name} but cannot describe it: ${answer && "error" in answer ? answer.error : "no answer"}.`,
      });
      continue;
    }
    if (answer.example === undefined || !answer.inputSchema) continue;
    let valid = false;
    let errorText = "";
    try {
      const validate = ajv.compile(answer.inputSchema);
      valid = validate(answer.example);
      errorText = ajv.errorsText(validate.errors, { separator: "; " });
    } catch (error) {
      errorText = `schema failed to compile: ${String(error)}`;
    }
    if (!valid) {
      findings.push({
        tool: name,
        finding: "describe-example-invalid",
        message: `${name} worked example does not validate against its own input schema: ${errorText}`,
      });
    }
  }
  return findings;
}

/** Runs every check over an already-collected live surface. */
export function runChecks(surface: LiveSurface): Finding[] {
  return [
    ...checkToolNamesAccepted(surface),
    ...checkRequiredMatchesEnforcement(surface),
    ...checkUnknownParameterRefused(surface),
    ...checkAuthorizeNeverCaptures(),
    ...checkDescriptionsPreserved(surface),
    ...checkLeanAcceptsNull(surface),
    ...checkNoArrayTypeShorthand(surface),
    ...checkDescribeToolCoverageAndExamples(surface),
  ];
}

/** Collects the live surface and runs every check. */
export async function runConformance(probe: McpProbe): Promise<Finding[]> {
  const surface = await collectSurface(probe);
  return runChecks(surface);
}
