import { expect, it, describe } from "@rstest/core";
import { describeTool } from "../src/tools/describe";
import type { YunoClient } from "../src/client";

const context = { yunoClient: {} as YunoClient, type: "object" as const };

function firstObject(output: { content: { type: string; object?: unknown; text?: string }[] }): Record<string, unknown> {
  const entry = output.content.find((item) => item.type === "text" && item.text?.startsWith("{"));
  expect(entry).toBeDefined();
  return JSON.parse(entry?.text ?? "{}") as Record<string, unknown>;
}

describe("describeTool", () => {
  it("returns the full schema including fields the compact registration hides", async () => {
    const output = await describeTool.handler(context)({ method: "paymentCreate" });
    const details = firstObject(output);

    expect(details.method).toBe("paymentCreate");
    const serialized = JSON.stringify(details.inputSchema);
    // additional_data collapses to a one-line record at registration; the full
    // schema must still expose its deep structure.
    expect(serialized).toContain("airline");
    expect(details.example).toBeDefined();
  });

  it("omits the output schema unless requested", async () => {
    const withoutOutput = await describeTool.handler(context)({ method: "customerRetrieve" });
    expect(firstObject(withoutOutput).outputSchema).toBeUndefined();

    const withOutput = await describeTool.handler(context)({ method: "customerRetrieve", include_output_schema: true });
    expect(firstObject(withOutput).outputSchema).toBeDefined();
  });

  it("lists available tools for an unknown method", async () => {
    const output = await describeTool.handler(context)({ method: "nope" });
    const text = output.content.find((item) => item.type === "text")?.text ?? "";
    expect(text).toContain('Unknown tool "nope"');
    expect(text).toContain("paymentCreate");
    expect(text).toContain("describeTool");
  });

  it("never emits a Response Headers entry (would be misread as an upstream status)", async () => {
    for (const method of ["paymentCreate", "nope"]) {
      const output = await describeTool.handler(context)({ method });
      for (const entry of output.content) {
        if (entry.type === "text") {
          expect(entry.text).not.toMatch(/^Response Headers/);
        }
      }
    }
  });
});
