import { expect, it, describe } from "@rstest/core";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8")) as {
  version: string;
};
const source = readFileSync(join(here, "..", "src", "index.ts"), "utf8");

describe("server version", () => {
  it("matches the package version", () => {
    // The version passed to McpServer is what clients see in the initialize handshake.
    // It was hardcoded and silently drifted a patch release behind package.json, so this
    // guards the pair rather than trusting whoever bumps the release to update both.
    const declared = /version:\s*"([^"]+)"/.exec(source)?.[1];

    expect(declared).toBeDefined();
    expect(declared).toBe(pkg.version);
  });
});
