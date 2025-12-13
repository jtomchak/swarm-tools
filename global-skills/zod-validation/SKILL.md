---
name: zod-validation
description: Schema validation patterns with Zod for runtime type safety. Use when defining data structures, validating tool arguments, parsing API responses, or creating type-safe schemas. Covers composition, refinements, error formatting, and TypeScript inference.
---

# Zod Validation Patterns

Schema validation with Zod for runtime type safety. Zod provides parse-don't-validate semantics: schemas both validate AND transform data, with full TypeScript inference.

## Quick Reference

```typescript
import { z } from "zod";

// Define schema
const UserSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
});

// Infer TypeScript type
type User = z.infer<typeof UserSchema>;

// Parse (throws on invalid)
const user = UserSchema.parse(data);

// Safe parse (returns result object)
const result = UserSchema.safeParse(data);
if (result.success) {
  const user = result.data;
} else {
  const errors = result.error;
}
```

## Schema Basics

### Primitives

```typescript
z.string(); // any string
z.string().min(1); // non-empty string
z.string().max(100); // max length
z.string().email(); // email validation
z.string().url(); // URL validation
z.string().uuid(); // UUID validation
z.string().regex(/^[a-z]+$/); // regex validation

z.number(); // any number
z.number().int(); // integer only
z.number().positive(); // > 0
z.number().nonnegative(); // >= 0
z.number().min(0).max(100); // range

z.boolean(); // true/false
z.date(); // Date object
z.null(); // null
z.undefined(); // undefined
z.unknown(); // any value (no validation)
```

### Strings with Format Validation

```typescript
// ISO-8601 datetime with timezone offset
z.string().datetime({ offset: true });
// Examples: "2025-01-15T10:30:00Z", "2025-01-15T10:30:00-05:00"

// Custom format validation
z.string().regex(
  /^[a-z0-9]+(-[a-z0-9]+)+(\.[\w-]+)?$/,
  "Invalid bead ID format",
);
// Custom error message as second argument
```

### Enums

```typescript
// Enum from array of literals
export const StatusSchema = z.enum([
  "open",
  "in_progress",
  "blocked",
  "closed",
]);
export type Status = z.infer<typeof StatusSchema>;

// Usage
StatusSchema.parse("open"); // ✓ "open"
StatusSchema.parse("invalid"); // ✗ throws ZodError

// Access enum values
StatusSchema.options; // ["open", "in_progress", "blocked", "closed"]
```

### Arrays

```typescript
// Array of strings
z.array(z.string());

// Non-empty array
z.array(z.string()).min(1);

// Array with length constraints
z.array(z.string()).min(1).max(10);

// Array of objects
z.array(
  z.object({
    id: z.string(),
    value: z.number(),
  }),
);
```

### Objects

```typescript
// Basic object
const PersonSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Optional properties
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(), // email | undefined
  bio: z.string().nullable(), // string | null
});

// Required vs optional
z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.string().default("default value"),
  nullable: z.string().nullable(),
});
```

### Records and Maps

```typescript
// Record<string, unknown> - for metadata
z.record(z.string(), z.unknown());

// Record<string, specific type>
z.record(z.string(), z.number());
// Example: { "key1": 1, "key2": 2 }

// Record with typed keys and values
const CriteriaSchema = z.record(
  z.string(), // criterion name
  z.object({
    passed: z.boolean(),
    feedback: z.string(),
  }),
);
// Example: { "type_safe": { passed: true, feedback: "..." } }
```

## Composition Patterns

### Union Types

```typescript
// Either/or types
const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
});

const ResultSchema = z.union([SuccessSchema, ErrorSchema]);
type Result = z.infer<typeof ResultSchema>;
// Result = { success: true, data: unknown } | { success: false, error: string }

// Discriminated unions (better inference)
const ResultSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema,
]);
```

### Intersection Types

```typescript
// Combine multiple schemas
const NameSchema = z.object({ name: z.string() });
const AgeSchema = z.object({ age: z.number() });

const PersonSchema = z.intersection(NameSchema, AgeSchema);
// Equivalent to: z.object({ name: z.string(), age: z.number() })
```

### Extending Schemas

```typescript
// Extend existing schema with new fields
const BaseSchema = z.object({
  id: z.string(),
  created_at: z.string().datetime({ offset: true }),
});

const ExtendedSchema = BaseSchema.extend({
  updated_at: z.string().datetime({ offset: true }),
  status: z.enum(["active", "inactive"]),
});

// ExtendedSchema has: id, created_at, updated_at, status

// Common pattern: add metadata to base evaluation
const CriterionEvaluationSchema = z.object({
  passed: z.boolean(),
  feedback: z.string(),
  score: z.number().min(0).max(1).optional(),
});

const WeightedCriterionEvaluationSchema = CriterionEvaluationSchema.extend({
  weight: z.number().min(0).max(1).default(1),
  weighted_score: z.number().min(0).max(1).optional(),
  deprecated: z.boolean().default(false),
});
```

## Defaults and Transformations

### Default Values

```typescript
// .default() provides value if field is undefined
z.object({
  status: z.enum(["open", "closed"]).default("open"),
  priority: z.number().int().min(0).max(3).default(2),
  tags: z.array(z.string()).default([]),
  description: z.string().optional().default(""),
});

// Input:  { }
// Output: { status: "open", priority: 2, tags: [], description: "" }

// Input:  { status: "closed" }
// Output: { status: "closed", priority: 2, tags: [], description: "" }
```

### Optional vs Default

```typescript
// .optional() - field can be missing or undefined
z.string().optional(); // string | undefined

// .nullable() - field can be null
z.string().nullable(); // string | null

// .optional().default() - missing becomes default
z.string().optional().default("default"); // string (never undefined)

// .nullable().default() - null remains null
z.string().nullable().default("default"); // string | null
```

### Transform Data

```typescript
// .transform() - modify parsed data
const NumberFromString = z.string().transform((val) => parseInt(val, 10));

NumberFromString.parse("42"); // 42 (number)

// Chain transforms
const TrimmedString = z
  .string()
  .transform((val) => val.trim())
  .transform((val) => val.toLowerCase());

TrimmedString.parse("  HELLO  "); // "hello"
```

## Refinements and Custom Validation

### .refine()

```typescript
// Custom validation logic
const PositiveNumberSchema = z
  .number()
  .refine((val) => val > 0, { message: "Number must be positive" });

// Multiple refinements
const BeadIdSchema = z
  .string()
  .min(1, "ID required")
  .refine((id) => id.includes("-"), {
    message: "ID must contain project prefix",
  })
  .refine((id) => /^[a-z0-9]+(-[a-z0-9]+)+(\.[\w-]+)?$/.test(id), {
    message: "Invalid ID format",
  });

// Refinement with context
const SubtaskSchema = z
  .object({
    files: z.array(z.string()),
    dependencies: z.array(z.number()),
  })
  .refine(
    (data) => {
      // Can't depend on yourself
      return data.dependencies.every((dep) => dep >= 0);
    },
    {
      message: "Invalid dependency index",
      path: ["dependencies"], // Error path in object
    },
  );
```

### .superRefine()

```typescript
// Advanced validation with multiple errors
const DecompositionSchema = z
  .object({
    subtasks: z.array(
      z.object({
        files: z.array(z.string()),
        dependencies: z.array(z.number()),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    const maxIndex = data.subtasks.length - 1;

    data.subtasks.forEach((subtask, idx) => {
      subtask.dependencies.forEach((dep) => {
        if (dep > maxIndex) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Subtask ${idx} depends on non-existent subtask ${dep}`,
            path: ["subtasks", idx, "dependencies"],
          });
        }
      });
    });
  });
```

## TypeScript Inference

### Infer Types from Schemas

```typescript
// Define schema first, infer type
export const BeadSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  status: z.enum(["open", "in_progress", "closed"]).default("open"),
  priority: z.number().int().min(0).max(3).default(2),
});

export type Bead = z.infer<typeof BeadSchema>;
// Bead = {
//   id: string;
//   title: string;
//   status: "open" | "in_progress" | "closed";
//   priority: number;
// }

// Use in functions
function createBead(data: z.infer<typeof BeadSchema>): Bead {
  return BeadSchema.parse(data);
}
```

### Input vs Output Types

```typescript
// Schema with defaults and transforms
const UserSchema = z.object({
  name: z.string(),
  age: z.string().transform((s) => parseInt(s, 10)),
  role: z.enum(["user", "admin"]).default("user"),
});

// Input type (before parsing)
type UserInput = z.input<typeof UserSchema>;
// { name: string; age: string; role?: "user" | "admin" }

// Output type (after parsing)
type UserOutput = z.output<typeof UserSchema>;
// { name: string; age: number; role: "user" | "admin" }

// Shorthand (equivalent to z.output)
type User = z.infer<typeof UserSchema>;
```

## Tool Argument Schemas

### MCP Tool Integration

```typescript
import { tool } from "@opencode-ai/plugin";

// Define args schema first
export const BeadCreateArgsSchema = z.object({
  title: z.string().min(1, "Title required"),
  type: z.enum(["bug", "feature", "task", "epic", "chore"]).default("task"),
  priority: z.number().int().min(0).max(3).default(2),
  description: z.string().optional(),
  parent_id: z.string().optional(),
});

export type BeadCreateArgs = z.infer<typeof BeadCreateArgsSchema>;

// Use in tool definition
export const beads_create = tool({
  description: "Create a new bead with type-safe validation",
  args: {
    title: tool.schema.string().min(1),
    type: tool.schema.enum(["bug", "feature", "task", "epic", "chore"]),
    priority: tool.schema.number().int().min(0).max(3),
    description: tool.schema.string().optional(),
    parent_id: tool.schema.string().optional(),
  },
  async execute(args, ctx) {
    // Validate with Zod schema
    const validated = BeadCreateArgsSchema.parse(args);

    // validated is now BeadCreateArgs with defaults applied
    return createBead(validated);
  },
});
```

### Validation in Tool Execution

```typescript
// Pattern: separate schema from tool definition
const QueryArgsSchema = z.object({
  status: z.enum(["open", "in_progress", "closed"]).optional(),
  type: z.enum(["bug", "feature", "task"]).optional(),
  ready: z.boolean().optional(),
  limit: z.number().int().positive().default(20),
});

export const beads_query = tool({
  description: "Query beads with filters",
  args: {
    /* tool.schema args */
  },
  async execute(args, ctx) {
    // Step 1: Validate
    const result = QueryArgsSchema.safeParse(args);

    if (!result.success) {
      throw new Error(formatZodErrors(result.error));
    }

    // Step 2: Use validated data
    const { status, type, ready, limit } = result.data;

    // Step 3: Execute
    return queryBeads({ status, type, ready, limit });
  },
});
```

## Error Handling

### Parse vs SafeParse

```typescript
// .parse() - throws ZodError on validation failure
try {
  const data = MySchema.parse(input);
  // Use data
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation errors
    console.error(error.issues);
  }
}

// .safeParse() - returns result object
const result = MySchema.safeParse(input);

if (result.success) {
  const data = result.data;
  // Use validated data
} else {
  const errors = result.error;
  // Handle validation errors
}
```

### Formatting Zod Errors

```typescript
/**
 * Format Zod validation errors as readable bullet points
 *
 * @param error - Zod error from schema validation
 * @returns Array of error messages suitable for feedback
 */
function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

// Usage
const result = BeadSchema.safeParse(input);
if (!result.success) {
  const bullets = formatZodErrors(result.error);
  console.error(bullets.join("\n"));
  // Output:
  // - title: String must contain at least 1 character(s)
  // - priority: Number must be less than or equal to 3
  // - status: Invalid enum value. Expected 'open' | 'in_progress' | 'closed'
}
```

### Custom Error Classes

```typescript
/**
 * Structured validation error with formatted feedback
 */
export class StructuredValidationError extends Error {
  public readonly errorBullets: string[];

  constructor(
    message: string,
    public readonly zodError: z.ZodError | null,
    public readonly rawInput: string,
  ) {
    super(message);
    this.name = "StructuredValidationError";
    this.errorBullets = zodError ? formatZodErrors(zodError) : [message];
  }

  /**
   * Format errors as bullet list for retry prompts
   */
  toFeedback(): string {
    return this.errorBullets.map((e) => `- ${e}`).join("\n");
  }
}

// Usage
try {
  const validated = MySchema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new StructuredValidationError(
      "Validation failed",
      error,
      JSON.stringify(input),
    );
  }
  throw error;
}
```

## JSON Extraction and Validation

### Multi-Strategy JSON Extraction

````typescript
/**
 * Try to extract JSON from text using multiple strategies
 *
 * @param text - Raw text that may contain JSON
 * @returns Tuple of [parsed object, extraction method used]
 * @throws JsonExtractionError if no JSON can be extracted
 */
function extractJsonFromText(text: string): [unknown, string] {
  const trimmed = text.trim();

  // Strategy 1: Direct parse
  try {
    return [JSON.parse(trimmed), "direct_parse"];
  } catch {}

  // Strategy 2: Extract from ```json code blocks
  const jsonBlockMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (jsonBlockMatch) {
    try {
      return [JSON.parse(jsonBlockMatch[1].trim()), "json_code_block"];
    } catch {}
  }

  // Strategy 3: Extract from any code block
  const codeBlockMatch = trimmed.match(/```\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return [JSON.parse(codeBlockMatch[1].trim()), "any_code_block"];
    } catch {}
  }

  // Strategy 4: Find balanced {...} object
  const objectJson = findBalancedBraces(trimmed, "{", "}");
  if (objectJson) {
    try {
      return [JSON.parse(objectJson), "brace_match_object"];
    } catch {}
  }

  throw new JsonExtractionError(
    "Could not extract valid JSON from response",
    text,
    ["direct_parse", "json_code_block", "any_code_block", "brace_match_object"],
  );
}
````

### Extract + Validate Pattern

```typescript
/**
 * Extract JSON from agent response and validate against schema
 */
async function parseAndValidate<T>(
  response: string,
  schema: z.ZodSchema<T>,
): Promise<T> {
  // Step 1: Extract JSON
  const [extracted, method] = extractJsonFromText(response);

  // Step 2: Validate
  const result = schema.safeParse(extracted);

  if (!result.success) {
    throw new StructuredValidationError(
      "Validation failed",
      result.error,
      response,
    );
  }

  return result.data;
}

// Usage
const evaluation = await parseAndValidate(agentResponse, EvaluationSchema);
```

### Schema Registry Pattern

```typescript
/**
 * Schema registry for named schema lookups
 */
const SCHEMA_REGISTRY: Record<string, z.ZodSchema> = {
  evaluation: EvaluationSchema,
  task_decomposition: TaskDecompositionSchema,
  bead_tree: BeadTreeSchema,
};

/**
 * Get schema by name from registry
 */
function getSchemaByName(name: string): z.ZodSchema {
  const schema = SCHEMA_REGISTRY[name];
  if (!schema) {
    throw new Error(
      `Unknown schema: ${name}. Available: ${Object.keys(SCHEMA_REGISTRY).join(", ")}`,
    );
  }
  return schema;
}

// Usage in tool
export const structured_validate = tool({
  description: "Validate agent response against a schema",
  args: {
    response: tool.schema.string(),
    schema_name: tool.schema.enum([
      "evaluation",
      "task_decomposition",
      "bead_tree",
    ]),
  },
  async execute(args, ctx) {
    const schema = getSchemaByName(args.schema_name);
    const [extracted] = extractJsonFromText(args.response);
    return schema.parse(extracted);
  },
});
```

## Anti-Patterns

### Don't: Validate After the Fact

```typescript
// ✗ BAD: TypeScript type with manual validation
type User = {
  name: string;
  age: number;
};

function validateUser(data: any): User {
  if (typeof data.name !== "string") throw new Error("Invalid name");
  if (typeof data.age !== "number") throw new Error("Invalid age");
  return data as User;
}
```

```typescript
// ✓ GOOD: Schema-first with inference
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});
type User = z.infer<typeof UserSchema>;

const user = UserSchema.parse(data); // Validated and typed
```

### Don't: Over-Constrain with Refinements

```typescript
// ✗ BAD: Too many refinements
const PasswordSchema = z
  .string()
  .refine((s) => s.length >= 8)
  .refine((s) => /[A-Z]/.test(s))
  .refine((s) => /[a-z]/.test(s))
  .refine((s) => /[0-9]/.test(s))
  .refine((s) => /[^A-Za-z0-9]/.test(s));
```

```typescript
// ✓ GOOD: Single refinement with regex
const PasswordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/,
    "Must contain uppercase, lowercase, number, and special character",
  );
```

### Don't: Parse in Loops

```typescript
// ✗ BAD: Parse individual items
const items = rawItems.map((item) => ItemSchema.parse(item));
```

```typescript
// ✓ GOOD: Parse array schema once
const ItemsSchema = z.array(ItemSchema);
const items = ItemsSchema.parse(rawItems);
```
