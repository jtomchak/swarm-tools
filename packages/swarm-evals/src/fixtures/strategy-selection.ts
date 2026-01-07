/**
 * Test cases for strategy selection quality
 *
 * Each case includes:
 * - input: task description to classify
 * - expected: strategy that should be selected
 */

export interface StrategySelectionTestCase {
  input: {
    task: string;
    context?: string;
  };
  expected: {
    strategy: "file-based" | "feature-based" | "risk-based" | "research-based";
    reasoning?: string;
  };
}

export const strategySelectionCases: StrategySelectionTestCase[] = [
  // FILE-BASED cases (structural changes, migrations, refactors)
  {
    input: {
      task: "Refactor auth module to use new pattern",
      context: "Existing auth code in src/auth/**",
    },
    expected: {
      strategy: "file-based",
      reasoning: "Refactoring existing code structure maps naturally to file organization",
    },
  },
  {
    input: {
      task: "Migrate from Express to Fastify",
      context: "Large codebase with Express throughout",
    },
    expected: {
      strategy: "file-based",
      reasoning: "Migration tasks involve systematic changes to existing file structure",
    },
  },
  {
    input: {
      task: "Move all components to new directory structure",
    },
    expected: {
      strategy: "file-based",
      reasoning: "Organizational restructuring is inherently file-based",
    },
  },
  {
    input: {
      task: "Update all imports to use new path alias",
    },
    expected: {
      strategy: "file-based",
      reasoning: "Import updates are file-level changes",
    },
  },
  {
    input: {
      task: "Rename user service to account service across codebase",
    },
    expected: {
      strategy: "file-based",
      reasoning: "Systematic renaming maps to file boundaries",
    },
  },

  // FEATURE-BASED cases (new functionality, user stories)
  {
    input: {
      task: "Add user dashboard feature",
      context: "New feature for users to view their activity",
    },
    expected: {
      strategy: "feature-based",
      reasoning: "New features naturally decompose by functionality, not file structure",
    },
  },
  {
    input: {
      task: "Implement OAuth authentication",
    },
    expected: {
      strategy: "feature-based",
      reasoning: "Feature implementation focuses on capabilities, not files",
    },
  },
  {
    input: {
      task: "Create admin panel for user management",
    },
    expected: {
      strategy: "feature-based",
      reasoning: "New UI features decompose by user-facing capabilities",
    },
  },
  {
    input: {
      task: "Add real-time notifications system",
    },
    expected: {
      strategy: "feature-based",
      reasoning: "New system features span multiple files organized by capability",
    },
  },
  {
    input: {
      task: "Build export functionality for user data",
    },
    expected: {
      strategy: "feature-based",
      reasoning: "Feature development task, not structural reorganization",
    },
  },

  // RISK-BASED cases (security, critical bugs, production issues)
  {
    input: {
      task: "Fix security vulnerability CVE-2024-1234",
      context: "Critical SQL injection vulnerability in auth",
    },
    expected: {
      strategy: "risk-based",
      reasoning: "Security vulnerabilities require focused, security-first decomposition",
    },
  },
  {
    input: {
      task: "Fix critical production bug causing data loss",
    },
    expected: {
      strategy: "risk-based",
      reasoning: "Production-critical bugs need risk-based prioritization",
    },
  },
  {
    input: {
      task: "Address memory leak in payment processing",
    },
    expected: {
      strategy: "risk-based",
      reasoning: "Payment systems require careful risk-based approach",
    },
  },
  {
    input: {
      task: "Fix authentication bypass in admin endpoints",
    },
    expected: {
      strategy: "risk-based",
      reasoning: "Security bypass is a critical vulnerability",
    },
  },
  {
    input: {
      task: "Patch XSS vulnerability in user input handling",
    },
    expected: {
      strategy: "risk-based",
      reasoning: "XSS is a security risk requiring careful remediation",
    },
  },

  // RESEARCH-BASED cases (exploration, investigation, debugging)
  {
    input: {
      task: "Investigate performance regression in API",
      context: "Response times increased 3x after recent deploy",
    },
    expected: {
      strategy: "research-based",
      reasoning: "Investigation tasks require exploratory research approach",
    },
  },
  {
    input: {
      task: "Debug intermittent test failures in CI",
    },
    expected: {
      strategy: "research-based",
      reasoning: "Debugging unknown issues needs systematic exploration",
    },
  },
  {
    input: {
      task: "Analyze why caching isn't working as expected",
    },
    expected: {
      strategy: "research-based",
      reasoning: "Analysis of unexpected behavior requires investigation",
    },
  },
  {
    input: {
      task: "Find root cause of database connection timeouts",
    },
    expected: {
      strategy: "research-based",
      reasoning: "Root cause analysis is exploratory research",
    },
  },
  {
    input: {
      task: "Explore migration path to new framework version",
    },
    expected: {
      strategy: "research-based",
      reasoning: "Exploration and feasibility assessment",
    },
  },

  // EDGE CASES - ambiguous tasks that could go multiple ways
  {
    input: {
      task: "Fix the login flow",
      context: "Users report login sometimes fails",
    },
    expected: {
      strategy: "research-based",
      reasoning: "Vague 'fix' without known issue suggests investigation needed",
    },
  },
  {
    input: {
      task: "Improve application performance",
    },
    expected: {
      strategy: "research-based",
      reasoning: "Generic performance improvement requires profiling and analysis first",
    },
  },
];
