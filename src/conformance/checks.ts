import Ajv2020 from "ajv/dist/2020.js";

/**
 * The conformance contract, asserted against a live MCP server.
 *
 * Every check reads what the server actually advertises (tools/list), what its
 * describeTool meta tool serves as the full schema, and how read-only tools
 * behave under tools/call with deliberately invalid arguments. Nothing here
 * re-derives a schema from this repository's source.
 *
 * Safety: tools/call is only ever sent to tools the server itself marks
 * readOnlyHint: true (and to describeTool). A mutating or destructive tool is
 * never called, so no probe depends on the very validation it is checking to
 * avoid a side effect. Mutating tools are asserted statically from their live
 * advertised schema against the live describeTool schema.
 */

export type Finding = {
  tool: string;
  finding: string;
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

export interface McpProbe {
  listTools(): Promise<{ tools: ListedTool[] }>;
  callTool(args: { name: string; arguments?: Record<string, unknown> }): Promise<CallResult>;
}

export type DescribedTool = {
  method: string;
  description?: string;
  inputSchema?: JsonSchemaNode;
  outputSchema?: JsonSchemaNode;
  example?: unknown;
};

const PROBE_MARKER = "conformanceProbeKey";
const SNAKE_CASE = /^[a-z0-9]+(_[a-z0-9]+)*$/;

export const textOf = (result: CallResult | undefined): string =>
  (result?.content ?? []).find((entry) => entry.type === "text")?.text ?? "";

const snakeToCamel = (key: string): string => key.replace(/_([a-z])/g, (_all, letter: string) => letter.toUpperCase());

const topLevelProperties = (schema: JsonSchemaNode | undefined): Record<string, JsonSchemaNode> =>
  (schema?.properties as Record<string, JsonSchemaNode> | undefined) ?? {};

const requiredOf = (schema: JsonSchemaNode | undefined): string[] =>
  Array.isArray(schema?.required) ? (schema.required as string[]) : [];

export const isReadOnly = (tool: ListedTool): boolean => tool.annotations?.readOnlyHint === true;

function probeKeyFor(tool: ListedTool): { sent: string; canonical: string } {
  const snakeProp = Object.keys(topLevelProperties(tool.inputSchema)).find((key) => key.includes("_"));
  if (snakeProp) return { sent: snakeToCamel(snakeProp), canonical: snakeProp };
  return { sent: PROBE_MARKER, canonical: "conformance_probe_key" };
}

export type LiveSurface = {
  tools: ListedTool[];
  toolsByName: Map<string, ListedTool>;
  nameAccepted: Map<string, boolean>;
  unknownParamProbe: Map<string, CallResult>;
  missingArgProbe: Map<string, CallResult>;
  describeAvailable: string[];
  described: Map<string, DescribedTool | { error: string }>;
};

const parseDescribed = (text: string): DescribedTool | { error: string } => {
  try {
    return JSON.parse(text) as DescribedTool;
  } catch {
    return { error: `describeTool returned non-JSON: ${text.slice(0, 120)}` };
  }
};

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

const asErrorResult = (error: unknown): CallResult => ({ isError: true, content: [{ type: "text", text: String(error) }] });

async function probeReadOnlyTool(probe: McpProbe, tool: ListedTool, surface: LiveSurface): Promise<void> {
  const { sent } = probeKeyFor(tool);
  try {
    surface.unknownParamProbe.set(tool.name, await probe.callTool({ name: tool.name, arguments: { [sent]: "conformance-probe" } }));
    surface.nameAccepted.set(tool.name, true);
  } catch (error) {
    surface.nameAccepted.set(tool.name, false);
    surface.unknownParamProbe.set(tool.name, asErrorResult(error));
  }
  try {
    surface.missingArgProbe.set(tool.name, await probe.callTool({ name: tool.name, arguments: {} }));
  } catch (error) {
    surface.missingArgProbe.set(tool.name, asErrorResult(error));
  }
}

export async function collectSurface(probe: McpProbe): Promise<LiveSurface> {
  const { tools } = await probe.listTools();
  const surface: LiveSurface = {
    tools,
    toolsByName: new Map(tools.map((tool) => [tool.name, tool])),
    nameAccepted: new Map(),
    unknownParamProbe: new Map(),
    missingArgProbe: new Map(),
    describeAvailable: [],
    described: new Map(),
  };

  for (const tool of tools) {
    if (isReadOnly(tool) && tool.name !== "describeTool") await probeReadOnlyTool(probe, tool, surface);
  }

  if (surface.toolsByName.has("describeTool")) {
    const unknown = await probe.callTool({ name: "describeTool", arguments: { method: "__conformance_unknown__" } });
    surface.describeAvailable.push(...parseAvailableTools(textOf(unknown)));
    for (const name of surface.describeAvailable) {
      const answer = await probe.callTool({ name: "describeTool", arguments: { method: name } });
      surface.described.set(name, answer.isError ? { error: textOf(answer) } : parseDescribed(textOf(answer)));
    }
  }

  return surface;
}

const fullSchemaOf = (surface: LiveSurface, name: string): JsonSchemaNode | undefined => {
  const described = surface.described.get(name);
  if (!described || "error" in described) return undefined;
  return described.inputSchema;
};

export function checkSomethingWasProbed(surface: LiveSurface): Finding[] {
  if (surface.tools.length === 0) {
    return [{ tool: "server", finding: "no-tools-advertised", message: "tools/list returned no tools; nothing was checked." }];
  }
  if (surface.unknownParamProbe.size === 0) {
    return [
      {
        tool: "server",
        finding: "no-tools-probed",
        message: "No read-only tool was probed with tools/call; the behavioural checks did not run, so the run cannot pass.",
      },
    ];
  }
  if (!surface.toolsByName.has("describeTool") || surface.described.size === 0) {
    return [{ tool: "describeTool", finding: "describe-unavailable", message: "describeTool is not advertised or described nothing; the schema checks did not run." }];
  }
  return [];
}

export function checkToolNamesAccepted(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const [name, accepted] of surface.nameAccepted) {
    if (!accepted) {
      findings.push({
        tool: name,
        finding: "tool-name-not-callable",
        message: `${name} is advertised in tools/list but tools/call rejects the name (no such tool).`,
      });
    }
  }
  for (const tool of surface.tools) {
    if (tool.name !== "describeTool" && surface.described.size > 0 && !surface.describeAvailable.includes(tool.name)) {
      findings.push({
        tool: tool.name,
        finding: "tool-name-not-registered",
        message: `${tool.name} is advertised in tools/list but the server's own tool registry (describeTool) does not know that name.`,
      });
    }
  }
  return findings;
}

/**
 * The advertised required[] must equal what the handler enforces. For every tool
 * that is the full schema describeTool serves (the one the handler validates
 * with); read-only tools are additionally probed with an empty call.
 */
export function checkRequiredMatchesEnforcement(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    const advertised = requiredOf(tool.inputSchema);
    const full = fullSchemaOf(surface, tool.name);
    if (full) {
      const enforced = requiredOf(full);
      const missing = enforced.filter((key) => !advertised.includes(key));
      if (missing.length > 0) {
        findings.push({
          tool: tool.name,
          finding: advertised.length === 0 ? "empty-required-but-enforced" : "required-under-advertised",
          message: `${tool.name} advertises required ${JSON.stringify(advertised)} but its handler enforces ${JSON.stringify(enforced)}; ${JSON.stringify(missing)} is told to clients as optional when it is not.`,
        });
      }
    }

    const probe = surface.missingArgProbe.get(tool.name);
    if (!probe) continue;
    const rejectsMissing = probe.isError === true;
    if (rejectsMissing && advertised.length === 0) {
      findings.push({
        tool: tool.name,
        finding: "empty-required-but-enforced",
        message: `${tool.name} advertises required[] = [] but rejects a call with no arguments.`,
      });
    }
    if (!rejectsMissing && advertised.length > 0) {
      findings.push({
        tool: tool.name,
        finding: "required-not-enforced",
        message: `${tool.name} advertises required ${JSON.stringify(advertised)} but accepted a call with no arguments.`,
      });
    }
  }
  return findings;
}

/**
 * Unknown / misspelled parameters must be refused and never silently dropped.
 * Every tool must advertise snake_case keys only (a camelCase alias is the exact
 * regression) and additionalProperties: false; read-only tools are also called
 * with the camelCase spelling and the refusal must name the snake_case key.
 */
export function checkUnknownParameterRefused(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    const keys = Object.keys(topLevelProperties(tool.inputSchema));
    const aliases = keys.filter((key) => !SNAKE_CASE.test(key));
    if (aliases.length > 0) {
      findings.push({
        tool: tool.name,
        finding: "camelcase-alias-advertised",
        message: `${tool.name} advertises non-snake_case parameter(s) ${aliases.join(", ")}; aliases make the canonical key optional and let a misspelling through.`,
      });
    }
    if (tool.inputSchema && tool.inputSchema.additionalProperties !== false) {
      findings.push({
        tool: tool.name,
        finding: "unknown-parameter-not-forbidden",
        message: `${tool.name} does not advertise additionalProperties: false; an unknown parameter would be silently dropped.`,
      });
    }

    const result = surface.unknownParamProbe.get(tool.name);
    if (!result) continue;
    const { sent, canonical } = probeKeyFor(tool);
    if (result.isError !== true) {
      findings.push({
        tool: tool.name,
        finding: "unknown-parameter-silently-accepted",
        message: `${tool.name} accepted the unknown parameter "${sent}" instead of refusing it; a misspelled parameter is silently dropped.`,
      });
      continue;
    }
    if (!textOf(result).includes(canonical)) {
      findings.push({
        tool: tool.name,
        finding: "unknown-parameter-no-hint",
        message: `${tool.name} refused "${sent}" but the message never names the correct snake_case spelling "${canonical}".`,
      });
    }
  }
  return findings;
}

export function checkDescriptionsPreserved(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    const full = topLevelProperties(fullSchemaOf(surface, tool.name));
    const lean = topLevelProperties(tool.inputSchema);
    for (const [key, node] of Object.entries(full)) {
      if (typeof node.description !== "string" || node.description.length === 0) continue;
      const leanNode = lean[key] as JsonSchemaNode | undefined;
      const leanDescription = leanNode?.description;
      if (typeof leanDescription !== "string" || leanDescription.length === 0) {
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

export function acceptsNull(node: JsonSchemaNode | undefined): boolean {
  if (!node || typeof node !== "object") return false;
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

export function checkLeanAcceptsNull(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  for (const tool of surface.tools) {
    const full = topLevelProperties(fullSchemaOf(surface, tool.name));
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

export function checkDescribeToolCoverageAndExamples(surface: LiveSurface): Finding[] {
  const findings: Finding[] = [];
  const ajv = new Ajv2020({ strict: false, allErrors: true });

  for (const name of surface.tools.map((tool) => tool.name).filter((toolName) => toolName !== "describeTool")) {
    if (!surface.describeAvailable.includes(name)) {
      findings.push({ tool: name, finding: "describe-missing-tool", message: `${name} is advertised in tools/list but describeTool does not list it as describable.` });
    }
  }

  for (const name of surface.describeAvailable) {
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
      findings.push({ tool: name, finding: "describe-example-invalid", message: `${name} worked example does not validate against its own input schema: ${errorText}` });
    }
  }
  return findings;
}

export function runChecks(surface: LiveSurface): Finding[] {
  return [
    ...checkSomethingWasProbed(surface),
    ...checkToolNamesAccepted(surface),
    ...checkRequiredMatchesEnforcement(surface),
    ...checkUnknownParameterRefused(surface),
    ...checkDescriptionsPreserved(surface),
    ...checkLeanAcceptsNull(surface),
    ...checkNoArrayTypeShorthand(surface),
    ...checkDescribeToolCoverageAndExamples(surface),
  ];
}

export async function runConformance(probe: McpProbe): Promise<Finding[]> {
  return runChecks(await collectSurface(probe));
}
