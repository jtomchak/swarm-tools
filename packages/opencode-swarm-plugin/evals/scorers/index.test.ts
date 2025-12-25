/**
 * Tests for decomposition scorers
 */
import { describe, expect, test } from "bun:test";
import {
  subtaskIndependence,
  coverageCompleteness,
  instructionClarity,
  decompositionCoherence,
} from "./index.js";

describe("Heuristic Scorers", () => {
  const goodDecomposition = JSON.stringify({
    epic: { title: "Add auth", description: "Add authentication" },
    subtasks: [
      {
        title: "Add login form component",
        description: "Create React component for login with email/password",
        files: ["src/components/LoginForm.tsx"],
      },
      {
        title: "Add auth API routes",
        description: "Create API endpoints for login/logout/session",
        files: ["src/api/auth.ts"],
      },
      {
        title: "Add auth middleware",
        description: "Create middleware to protect routes",
        files: ["src/middleware/auth.ts"],
      },
    ],
  });

  const conflictingDecomposition = JSON.stringify({
    epic: { title: "Add auth", description: "Add authentication" },
    subtasks: [
      {
        title: "Add login",
        files: ["src/auth.ts"],
      },
      {
        title: "Add logout",
        files: ["src/auth.ts"], // Same file - conflict!
      },
    ],
  });

  test("subtaskIndependence scores 1.0 for no conflicts", async () => {
    const result = await subtaskIndependence({
      output: goodDecomposition,
      expected: undefined,
      input: {},
    });
    expect(result.score).toBe(1);
    expect(result.message).toContain("No file conflicts");
  });

  test("subtaskIndependence scores 0 for file conflicts", async () => {
    const result = await subtaskIndependence({
      output: conflictingDecomposition,
      expected: undefined,
      input: {},
    });
    expect(result.score).toBe(0);
    expect(result.message).toContain("src/auth.ts");
  });

  test("instructionClarity scores higher for detailed subtasks", async () => {
    const result = await instructionClarity({
      output: goodDecomposition,
      expected: undefined,
      input: {},
    });
    expect(result.score).toBeGreaterThan(0.7);
  });

  test("coverageCompleteness checks subtask count", async () => {
    const result = await coverageCompleteness({
      output: goodDecomposition,
      expected: { minSubtasks: 2, maxSubtasks: 5 },
      input: {},
    });
    expect(result.score).toBe(1);
    expect(result.message).toContain("Good subtask count");
  });
});

describe("LLM-as-Judge Scorer", () => {
  // Skip in CI - requires API key
  const shouldSkip = !process.env.AI_GATEWAY_API_KEY;

  test.skipIf(shouldSkip)(
    "decompositionCoherence returns score and issues",
    async () => {
      const decomposition = JSON.stringify({
        epic: { title: "Add auth", description: "Add authentication" },
        subtasks: [
          {
            title: "Add login form",
            description: "Create login UI",
            files: ["src/LoginForm.tsx"],
          },
          {
            title: "Add auth API",
            description: "Create auth endpoints",
            files: ["src/api/auth.ts"],
          },
        ],
      });

      const result = await decompositionCoherence({
        output: decomposition,
        expected: undefined,
        input: { task: "Add user authentication with login/logout" },
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.message).toBe("string");
    },
    30000,
  ); // 30s timeout for LLM call

  test("decompositionCoherence handles errors gracefully", async () => {
    const result = await decompositionCoherence({
      output: "not valid json at all {{{",
      expected: undefined,
      input: {},
    });

    // Should return neutral score on error, not throw
    expect(result.score).toBe(0.5);
    expect(result.message).toContain("error");
  });
});
