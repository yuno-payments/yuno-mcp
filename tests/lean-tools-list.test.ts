import { expect, it, describe, afterEach } from "@rstest/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, type ListToolsResult } from "@modelcontextprotocol/sdk/types.js";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv";
import { leanJsonSchema, leanToolsListResult } from "../src/schemas/lean-json-schema";
import { compactSchema, HEAVY_KEYS } from "../src/schemas/compact";
import { tools } from "../src/tools";
import { describeTool } from "../src/tools/describe";
import { initializeYunoMCP } from "../src/index";

describe("leanJsonSchema", () => {
  it("keeps a nullable union in its long form, which every client can read", () => {
    const nullable = { anyOf: [{ type: "string", minLength: 3 }, { type: "null" }], description: "d" };
    expect(leanJsonSchema(nullable)).toEqual(nullable);
  });

  it("never emits an array-form type", () => {
    const nullableEnum = { anyOf: [{ type: "string", enum: ["A", "B"] }, { type: "null" }] };
    expect(leanJsonSchema(nullableEnum)).toEqual(nullableEnum);
  });

  it("leaves a real union alone", () => {
    const real = { anyOf: [{ type: "string" }, { type: "number" }] };
    expect(leanJsonSchema(real)).toEqual(real);
  });

  it("leaves a union of three alone, even when one member is null", () => {
    const three = { anyOf: [{ type: "string" }, { type: "number" }, { type: "null" }] };
    expect(leanJsonSchema(three)).toEqual(three);
  });

  it("drops a union whose other member is empty, since that already accepts null", () => {
    expect(leanJsonSchema({ description: "d", anyOf: [{}, { type: "null" }] })).toEqual({ description: "d" });
  });

  it("drops the outer null when the member is already nullable", () => {
    const inner = { anyOf: [{ type: "object", additionalProperties: {} }, { type: "null" }] };
    expect(leanJsonSchema({ description: "outer", anyOf: [inner, { type: "null" }] })).toEqual({ ...inner, description: "outer" });
  });

  it("keeps the outer null when the nullable member carries other keywords", () => {
    const node = { anyOf: [{ anyOf: [{ type: "string" }, { type: "null" }], default: "x" }, { type: "null" }] };
    expect(leanJsonSchema(node)).toEqual(node);
  });

  it("strips $schema at every level", () => {
    expect(leanJsonSchema({ $schema: "x", properties: { a: { $schema: "y", type: "string" } } })).toEqual({
      properties: { a: { type: "string" } },
    });
  });

  it("recurses through arrays and leaves primitives alone", () => {
    expect(leanJsonSchema({ items: [{ anyOf: [{}, { type: "null" }] }, 1, "a", null] })).toEqual({
      items: [{}, 1, "a", null],
    });
  });

  it("does not mutate its input", () => {
    const input = { anyOf: [{}, { type: "null" }] };
    leanJsonSchema(input);
    expect(input).toEqual({ anyOf: [{}, { type: "null" }] });
  });
});

describe("leanToolsListResult", () => {
  const nullable = { anyOf: [{}, { type: "null" }] };

  it("leans each tool's inputSchema and outputSchema", () => {
    const result = leanToolsListResult({ tools: [{ name: "t", inputSchema: { $schema: "x", properties: { a: nullable } }, outputSchema: { $schema: "x", ...nullable } }] });
    expect(result.tools[0]).toEqual({ name: "t", inputSchema: { properties: { a: {} } }, outputSchema: {} });
  });

  it("leaves every non-schema field alone, even one shaped like a schema", () => {
    const envelope = {
      tools: [{ name: "t", description: "d", annotations: { hint: nullable }, _meta: { $schema: "keep" }, inputSchema: { type: "object" } }],
      _meta: { $schema: "keep", fold: nullable },
      nextCursor: "c",
    };
    const result = leanToolsListResult(envelope);
    expect(result.tools[0].annotations).toEqual({ hint: nullable });
    expect(result.tools[0]._meta).toEqual({ $schema: "keep" });
    expect(result._meta).toEqual({ $schema: "keep", fold: nullable });
    expect(result.nextCursor).toBe("c");
  });

  it("omits a schema field the tool did not have", () => {
    expect(leanToolsListResult({ tools: [{ name: "t", inputSchema: {} }] }).tools[0]).not.toHaveProperty("outputSchema");
  });

  it("passes through anything that is not a tool list", () => {
    expect(leanToolsListResult(null)).toBeNull();
    expect(leanToolsListResult({ other: nullable })).toEqual({ other: nullable });
  });
});

describe("a live tools/list", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  /**
   * Returns what a client receives (`lean`) and what the SDK's own tools/list
   * handler produced before the wrapper in src/index.ts leaned it (`raw`). The raw
   * handler is captured through the SDK's public `Server.setRequestHandler`, which
   * is how McpServer installs it; the lean wrapper bypasses that method.
   */
  async function listTools(): Promise<{ lean: ListToolsResult; raw: ListToolsResult }> {
    globalThis.fetch = (() => Promise.resolve(new Response("{}", { status: 200 }))) as unknown as typeof fetch;
    let rawHandler: (() => unknown) | undefined;
    const setRequestHandler = Server.prototype.setRequestHandler;
    Server.prototype.setRequestHandler = function (this: Server, schema: unknown, handler: unknown) {
      if (schema === ListToolsRequestSchema) rawHandler = handler as () => unknown;
      return (setRequestHandler as (...args: unknown[]) => void).call(this, schema, handler);
    } as typeof setRequestHandler;
    let result: Awaited<ReturnType<typeof initializeYunoMCP>>;
    try {
      result = await initializeYunoMCP({ accountCode: "acct", publicApiKey: "staging_key", privateSecretKey: "s" });
    } finally {
      Server.prototype.setRequestHandler = setRequestHandler;
    }
    if (!result?.yunoMCP || !rawHandler) throw new Error("initializeYunoMCP failed");
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([client.connect(clientTransport), result.yunoMCP.connect(serverTransport)]);
    return { lean: await client.listTools(), raw: (await rawHandler()) as ListToolsResult };
  }

  /**
   * The wrapper in src/index.ts reaches past the SDK's public surface to find the
   * handler it replaces. This is what makes that safe: if a future SDK version
   * moves the handler, it fails instead of the payload quietly growing back.
   */
  it("serves no $schema", async () => {
    const { lean, raw } = await listTools();
    expect(JSON.stringify(raw)).toContain('"$schema"');
    expect(JSON.stringify(lean)).not.toContain('"$schema"');
  });

  /**
   * Released @yuno-payments/agent-toolkit versions read `type` as a string only;
   * an array there turns the field into z.unknown() on their side.
   */
  it("never serves an array-form type", async () => {
    const arrays: string[] = [];
    const visit = (node: unknown, path: string): void => {
      if (Array.isArray(node)) {
        node.forEach((item, index) => {
          visit(item, `${path}[${String(index)}]`);
        });
        return;
      }
      if (!node || typeof node !== "object") return;
      for (const [key, value] of Object.entries(node)) {
        if (key === "type" && Array.isArray(value)) arrays.push(path);
        visit(value, `${path}.${key}`);
      }
    };
    visit((await listTools()).lean.tools, "tools");
    expect(arrays).toEqual([]);
  });

  it("points at describeTool only from tools whose schema was abbreviated", async () => {
    const { lean } = await listTools();
    const abbreviated = [...tools, describeTool]
      .filter((tool) => {
        let collapsed = false;
        const onCollapse = () => {
          collapsed = true;
        };
        compactSchema(tool.schema, { maxDepth: 3, heavyKeys: HEAVY_KEYS, onCollapse });
        if (tool.outputSchema) compactSchema(tool.outputSchema, { maxDepth: 2, heavyKeys: HEAVY_KEYS, partialTopLevel: true, onCollapse });
        return collapsed && tool !== describeTool;
      })
      .map((tool) => tool.method)
      .sort();
    const hinted = lean.tools
      .filter((tool) => tool.description?.includes("call describeTool for the full schema"))
      .map((tool) => tool.name)
      .sort();
    expect(hinted).toEqual(abbreviated);
    expect(hinted).not.toContain("describeTool");
    expect(hinted.length).toBeLessThan(lean.tools.length);
    expect(JSON.stringify(lean)).not.toContain("full field list");
  });

  it("still advertises a nullable field as accepting null", async () => {
    const { lean } = await listTools();
    const schema = lean.tools.find((tool) => tool.name === "checkoutSessionCreate")?.inputSchema as {
      properties: Record<string, unknown>;
    };
    expect(schema.properties.callback_url).toMatchObject({ anyOf: [{ type: "string" }, { type: "null" }] });
  });

  /**
   * The claim the whole module rests on: for every tool, a client validating
   * against the lean schema accepts exactly what it accepts against the raw one.
   * Both are compiled with the validator the MCP SDK Client uses, and fed an
   * instance built from the raw schema plus a replacement at every path — null,
   * each primitive type, an object, an array, and every enum/const value found
   * there — so both valid and invalid inputs are compared.
   */
  it("accepts and rejects exactly what the raw schema does, for every tool", async () => {
    const { lean, raw } = await listTools();
    const validator = new AjvJsonSchemaValidator();
    const leanByName = new Map(lean.tools.map((tool) => [tool.name, tool]));
    const mismatches: string[] = [];
    let compared = 0;
    let nullAccepted = 0;

    for (const rawTool of raw.tools) {
      const leanTool = leanByName.get(rawTool.name);
      for (const field of ["inputSchema", "outputSchema"] as const) {
        const rawSchema = rawTool[field] as JsonSchema | undefined;
        if (!rawSchema) continue;
        const validateRaw = validator.getValidator(rawSchema);
        const validateLean = validator.getValidator(leanTool?.[field] as JsonSchema);
        for (const instance of probeInstances(rawSchema)) {
          compared++;
          const expected = validateRaw(instance.value).valid;
          if (expected && instance.isNull) nullAccepted++;
          if (validateLean(instance.value).valid !== expected) {
            mismatches.push(`${rawTool.name}.${field} ${instance.path}=${JSON.stringify(instance.replacement)}`);
          }
        }
      }
    }

    console.log(`lean/raw equivalence: ${String(compared)} instances compared, ${String(nullAccepted)} accepting null`);
    expect(mismatches.slice(0, 20)).toEqual([]);
    expect(compared).toBeGreaterThan(10_000);
    expect(nullAccepted).toBeGreaterThan(100);
  });

  it("stays within the payload budget", async () => {
    /**
     * Measured at 139,653 bytes when written, down from 153,517 on the base branch
     * (#51). The headroom is for #53, which restores ~11 KB of parameter
     * descriptions compactSchema used to drop: 150,520 bytes with both.
     */
    const BUDGET_BYTES = 155_000;
    const bytes = Buffer.byteLength(JSON.stringify((await listTools()).lean));
    console.log(`live tools/list: ${String(bytes)} bytes (~${String(Math.round(bytes / 4))} tokens), budget ${String(BUDGET_BYTES)}`);
    expect(bytes).toBeLessThan(BUDGET_BYTES);
  });
});

type JsonSchema = Record<string, unknown>;
type Probe = { path: string; value: unknown; replacement: unknown; isNull: boolean };

/** A value shaped by the schema: first anyOf member, first enum value, every property. */
function sample(schema: JsonSchema, depth: number): unknown {
  if (depth > 8) return {};
  if ("const" in schema) return schema.const;
  if (Array.isArray(schema.enum)) return schema.enum[0];
  const members = (schema.anyOf ?? schema.oneOf) as JsonSchema[] | undefined;
  if (members) return sample(members.find((member) => member.type !== "null") ?? members[0], depth);
  if (Array.isArray(schema.allOf)) return sample(schema.allOf[0] as JsonSchema, depth);
  switch (schema.type) {
    case "string":
      return "x";
    case "number":
    case "integer":
      return 1;
    case "boolean":
      return true;
    case "null":
      return null;
    case "array":
      return schema.items ? [sample(schema.items as JsonSchema, depth + 1)] : [];
    default: {
      const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
      return Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, sample(value, depth + 1)]));
    }
  }
}

/** Every enum/const value anywhere in the schema — the values most likely to expose a fold that changed meaning. */
function literals(schema: unknown, found = new Set<string>()): Set<string> {
  if (Array.isArray(schema)) {
    for (const item of schema) literals(item, found);
  } else if (schema && typeof schema === "object") {
    const node = schema as JsonSchema;
    if ("const" in node) found.add(JSON.stringify(node.const));
    if (Array.isArray(node.enum)) for (const value of node.enum) found.add(JSON.stringify(value));
    for (const value of Object.values(node)) literals(value, found);
  }
  return found;
}

function* probeInstances(schema: JsonSchema): Generator<Probe> {
  const base = sample(schema, 0);
  const replacements: unknown[] = [null, "x", "", 0, 1, 1.5, -1, true, {}, [], ...[...literals(schema)].map((value) => JSON.parse(value) as unknown)];
  const paths: (string | number)[][] = [];
  const collect = (value: unknown, path: (string | number)[]): void => {
    paths.push(path);
    if (Array.isArray(value)) value.forEach((item, index) => { collect(item, [...path, index]); });
    else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) collect(child, [...path, key]);
  };
  collect(base, []);
  yield { path: "(sample)", value: base, replacement: base, isNull: false };
  for (const path of paths) {
    for (const replacement of replacements) {
      yield { path: path.join(".") || "(root)", value: replaceAt(base, path, replacement), replacement, isNull: replacement === null };
    }
  }
}

function replaceAt(value: unknown, path: (string | number)[], replacement: unknown): unknown {
  if (path.length === 0) return replacement;
  const [head, ...tail] = path;
  if (Array.isArray(value)) return value.map((item, index) => (index === head ? replaceAt(item, tail, replacement) : item));
  const record = value as Record<string, unknown>;
  return { ...record, [head]: replaceAt(record[head], tail, replacement) };
}
