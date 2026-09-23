import { defineConfig } from "@rstest/core";

export default defineConfig({
  coverage: {
    // Sonar's QualityGate step reads coverage/lcov.info (sonar-project.properties).
    // Without it the gate sees 0% coverage and fails the build.
    enabled: true,
    include: ["src/**/*.ts"],
    reporters: ["lcovonly", "text-summary"],
    reportsDirectory: "coverage",
  },
});
