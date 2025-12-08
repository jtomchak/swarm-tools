import { describe, expect, it } from "vitest";
import {
  BeadSchema,
  BeadTypeSchema,
  BeadCreateArgsSchema,
  EpicCreateArgsSchema,
  EvaluationSchema,
  CriterionEvaluationSchema,
  TaskDecompositionSchema,
  SubtaskSchema,
  SwarmStatusSchema,
  ValidationResultSchema,
} from "./index";

describe("BeadSchema", () => {
  it("validates a complete bead", () => {
    const bead = {
      id: "bd-abc123",
      title: "Fix the thing",
      type: "bug",
      status: "open",
      priority: 1,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    expect(() => BeadSchema.parse(bead)).not.toThrow();
  });

  it("rejects invalid priority", () => {
    const bead = {
      id: "bd-abc123",
      title: "Fix the thing",
      type: "bug",
      status: "open",
      priority: 5, // Invalid: max is 3
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    expect(() => BeadSchema.parse(bead)).toThrow();
  });

  it("accepts all valid types", () => {
    const types = ["bug", "feature", "task", "epic", "chore"];
    for (const type of types) {
      expect(() => BeadTypeSchema.parse(type)).not.toThrow();
    }
  });
});

describe("BeadCreateArgsSchema", () => {
  it("validates minimal create args", () => {
    const args = { title: "New bead" };
    const result = BeadCreateArgsSchema.parse(args);
    expect(result.title).toBe("New bead");
    expect(result.type).toBe("task"); // default
    expect(result.priority).toBe(2); // default
  });

  it("rejects empty title", () => {
    const args = { title: "" };
    expect(() => BeadCreateArgsSchema.parse(args)).toThrow();
  });
});

describe("EpicCreateArgsSchema", () => {
  it("validates epic with subtasks", () => {
    const args = {
      epic_title: "Big feature",
      subtasks: [
        { title: "Part 1", priority: 2 },
        { title: "Part 2", priority: 3 },
      ],
    };
    expect(() => EpicCreateArgsSchema.parse(args)).not.toThrow();
  });

  it("requires at least one subtask", () => {
    const args = {
      epic_title: "Big feature",
      subtasks: [],
    };
    expect(() => EpicCreateArgsSchema.parse(args)).toThrow();
  });
});

describe("EvaluationSchema", () => {
  it("validates a passing evaluation", () => {
    const evaluation = {
      passed: true,
      criteria: {
        type_safe: { passed: true, feedback: "All types correct" },
        no_bugs: { passed: true, feedback: "No issues found" },
      },
      overall_feedback: "Good work",
      retry_suggestion: null,
    };
    expect(() => EvaluationSchema.parse(evaluation)).not.toThrow();
  });

  it("validates a failing evaluation with retry suggestion", () => {
    const evaluation = {
      passed: false,
      criteria: {
        type_safe: { passed: false, feedback: "Missing types on line 42" },
      },
      overall_feedback: "Needs work",
      retry_suggestion: "Add explicit types to the handler function",
    };
    expect(() => EvaluationSchema.parse(evaluation)).not.toThrow();
  });
});

describe("TaskDecompositionSchema", () => {
  it("validates a decomposition", () => {
    const decomposition = {
      epic_title: "Add auth",
      epic_description: "Implement OAuth",
      subtasks: [
        {
          title: "Add OAuth provider",
          description: "Configure Google OAuth",
          files: ["src/auth/google.ts"],
          priority: 2,
          estimated_complexity: "medium" as const,
        },
      ],
      parallel_groups: [["subtask-1"]],
      estimated_total_time: "2 hours",
    };
    expect(() => TaskDecompositionSchema.parse(decomposition)).not.toThrow();
  });

  it("validates subtask complexity values", () => {
    const complexities = ["trivial", "simple", "medium", "complex", "unknown"];
    for (const complexity of complexities) {
      const subtask = {
        title: "Test",
        description: "Test",
        files: [],
        priority: 2,
        estimated_complexity: complexity,
      };
      expect(() => SubtaskSchema.parse(subtask)).not.toThrow();
    }
  });
});

describe("SwarmStatusSchema", () => {
  it("validates swarm status", () => {
    const status = {
      epic_id: "bd-epic123",
      total: 3,
      completed: 1,
      in_progress: 1,
      pending: 1,
      failed: 0,
      subtasks: [
        { id: "bd-1", title: "Task 1", status: "completed" as const },
        { id: "bd-2", title: "Task 2", status: "in_progress" as const },
        { id: "bd-3", title: "Task 3", status: "pending" as const },
      ],
    };
    expect(() => SwarmStatusSchema.parse(status)).not.toThrow();
  });
});

describe("ValidationResultSchema", () => {
  it("validates success result", () => {
    const result = {
      success: true,
      data: { foo: "bar" },
      attempts: 1,
      extractionMethod: "direct",
    };
    expect(() => ValidationResultSchema.parse(result)).not.toThrow();
  });

  it("validates failure result with errors", () => {
    const result = {
      success: false,
      attempts: 2,
      errors: ["Missing required field: name", "Invalid type for age"],
    };
    expect(() => ValidationResultSchema.parse(result)).not.toThrow();
  });
});
