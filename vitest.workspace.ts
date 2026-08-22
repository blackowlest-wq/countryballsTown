import { defineWorkspace } from "vitest/config";

// Keep the test seam explicit: each project owns its test files and runtime.
// Vitest 2.1.9 exposes these projects through --project=<name>.
export default defineWorkspace([
  {
    test: {
      name: "domain",
      environment: "node",
      include: ["tests/domain/**/*.test.ts"],
    },
  },
  {
    test: {
      name: "store",
      environment: "node",
      include: ["tests/store/**/*.test.ts"],
    },
  },
  {
    test: {
      name: "ui",
      environment: "jsdom",
      include: ["tests/ui/**/*.test.ts"],
    },
  },
]);
