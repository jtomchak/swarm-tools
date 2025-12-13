---
name: agent-patterns
description: AI agent design patterns from "Patterns for Building AI Agents". Use when designing agent architectures, planning agent capabilities, implementing human-in-the-loop workflows, or setting up agent evals. Covers capability whiteboards, architecture evolution, dynamic agents, context engineering, and multi-agent coordination.
---

# Agent Patterns

Actionable patterns for building production AI agents. From "Patterns for Building AI Agents" by Sam Bhagwat & Michelle Gienow.

## Whiteboard Agent Capabilities

**Problem**: Dozens of potential capabilities, unclear where to start.

**Solution**: Ruthless prioritization using impact/effort matrix.

### Process

1. **List all possible capabilities** - brainstorm everything the agent could do
2. **Plot on 2x2 matrix** - Impact (low/high) vs Effort (low/high)
3. **Start with high-impact, low-effort** - quick wins build momentum
4. **Defer low-impact, high-effort** - avoid complexity that doesn't move the needle
5. **Validate with users** - don't build what you think they want

### Warning Signs

- Building features users didn't request
- Starting with hardest capability first
- No clear success metrics per capability
- "We'll need this eventually" justifications

### Example: Code Assistant Agent

**High Impact, Low Effort** (DO FIRST):

- Code completion for common patterns
- Syntax error detection
- Import statement fixes

**High Impact, High Effort** (DO LATER):

- Full codebase refactoring
- Architecture recommendations
- Security vulnerability analysis

**Low Impact** (DON'T BUILD):

- Custom color scheme suggestions
- Code formatting opinions
- Editor layout recommendations

## Evolve Your Agent Architecture

**Problem**: Need to ship incrementally without over-engineering.

**Solution**: Start simple, evolve based on real usage.

### Architecture Progression

**Level 1: Single-Shot**

- One prompt, one response
- No memory, no tools
- Use for: Simple classification, text generation

**Level 2: Agentic Workflow**

- LLM + tool calls in a loop
- Agent decides when to use tools
- Use for: Research, data gathering, simple automation

**Level 3: Reflection**

- Agent critiques its own outputs
- Iterates until quality threshold met
- Use for: Code generation, content writing, analysis

**Level 4: Multi-Agent**

- Specialized agents for different tasks
- Coordinator routes between them
- Use for: Complex workflows, domain expertise

**Level 5: Human-in-the-Loop**

- Agents request human input at decision points
- Deferred execution for safety-critical actions
- Use for: Financial transactions, legal review, medical diagnosis

### Evolution Triggers

**Add tools when**:

- Hallucinations about external data
- Need real-time information
- Require system actions

**Add reflection when**:

- Quality varies too much
- First draft rarely good enough
- Need self-correction

**Add multi-agent when**:

- Single prompt becomes unwieldy (>2000 tokens)
- Specialized expertise needed
- Parallel work possible

**Add HITL when**:

- High cost of errors
- Legal/compliance requirements
- Trust not yet established

### Anti-Patterns

- Skipping straight to multi-agent without validating single-agent works
- Adding reflection before tools (tools usually higher ROI)
- Building Level 5 when Level 2 would suffice

## Dynamic Agents

**Problem**: Different user types need different agent behaviors, don't want to maintain multiple versions.

**Solution**: Agents that adapt based on context signals.

### Adaptation Strategies

**User-Based**:

- Expertise level (beginner/advanced)
- Role (developer/manager/executive)
- Permissions (read-only/edit/admin)

**Context-Based**:

- Time sensitivity (urgent/routine)
- Risk level (safe/review-required/blocked)
- Data sensitivity (public/internal/confidential)

**Task-Based**:

- Complexity (simple/moderate/complex)
- Familiarity (seen before/novel)
- Confidence (high/medium/low)

### Implementation Patterns

**Via System Prompt**:

```typescript
const systemPrompt = buildPrompt({
  userLevel: user.expertiseLevel,
  riskLevel: task.calculateRisk(),
  tone: user.preferences.tone,
});
```

**Via Tool Selection**:

```typescript
const tools = selectTools({
  userPermissions: user.permissions,
  taskType: task.type,
  contextSensitivity: context.dataLevel,
});
```

**Via Output Format**:

```typescript
const format = user.isExpert ? "technical_detail" : "executive_summary";
```

### Warning Signs

- Same output for all users regardless of context
- Hard-coded behavior that should be dynamic
- Creating separate agents per use case
- No adaptation based on feedback

## Human-in-the-Loop Patterns

**Problem**: Need human judgment for safety-critical decisions.

**Solution**: Strategic pause points, not blanket approval.

### When to Use HITL

**Always**:

- Financial transactions
- Legal commitments
- Privacy/security decisions
- Irreversible actions

**Sometimes**:

- Low confidence predictions
- Novel scenarios
- High-value decisions
- Learning new domains

**Never**:

- Routine operations
- Read-only queries
- Already-verified patterns
- Low-stakes decisions

### Patterns

**Pause-and-Verify**:

- Agent stops execution
- Requests human decision
- Resumes with human input
- Use when: Decision is blocking, immediate context needed

**Deferred Execution**:

- Agent plans action
- Queues for approval
- Human reviews asynchronously
- Executes on approval
- Use when: Batch review possible, non-urgent

**Confidence Threshold**:

- Agent checks confidence score
- Auto-executes if above threshold
- Requests human if below
- Use when: Most cases are clear-cut

**Explanation-First**:

- Agent provides reasoning
- Human approves/rejects/modifies
- Agent proceeds with decision
- Use when: Teaching agent new patterns

### Implementation

```typescript
async function executeWithApproval(action: Action) {
  if (action.risk === "high") {
    const approval = await requestHumanApproval({
      action,
      reasoning: action.reasoning,
      alternatives: action.alternatives,
    });

    if (!approval.approved) {
      return handleRejection(approval.reason);
    }
  }

  return await executeAction(action);
}
```

### Anti-Patterns

- Requesting approval for every action (approval fatigue)
- No context in approval requests (human can't evaluate)
- Blocking on approvals that could be deferred
- No learning from approval patterns

## Evals: Testing Agent Behavior

**Problem**: Can't tell if changes improve or break agent quality.

**Solution**: Test suite of evaluation criteria with measurable metrics.

### Eval Types

**Unit Evals** (single capability):

- Tool calling accuracy
- Formatting compliance
- Entity extraction precision
- Response time

**Integration Evals** (multi-step):

- End-to-end task completion
- Multi-tool orchestration
- Error recovery
- Context retention

**Production Evals** (real usage):

- User satisfaction scores
- Task success rate
- Escalation frequency
- Cost per task

### Building an Eval Suite

**1. Define Success Criteria**:

```typescript
type EvalCriteria = {
  name: string;
  description: string;
  passing: (output: string) => boolean;
  weight: number; // 0-1
};

const criteria: EvalCriteria[] = [
  {
    name: "correct_format",
    description: "Output is valid JSON",
    passing: (out) => isValidJSON(out),
    weight: 1.0, // must pass
  },
  {
    name: "includes_reasoning",
    description: "Explanation provided",
    passing: (out) => out.includes("because"),
    weight: 0.7, // nice to have
  },
];
```

**2. Create Test Cases**:

- Representative samples (80% common cases)
- Edge cases (15% unusual scenarios)
- Adversarial cases (5% intentionally tricky)

**3. Establish Baselines**:

- Measure current performance
- Set minimum acceptable thresholds
- Track regression

**4. Automate Runs**:

- Run on every prompt change
- Run on every code deploy
- Run on schedule (daily/weekly)

### Metrics to Track

**Accuracy**:

- Precision: True positives / (True positives + False positives)
- Recall: True positives / (True positives + False negatives)
- F1: Harmonic mean of precision and recall

**Quality**:

- Hallucination rate
- Instruction following
- Output format compliance

**Efficiency**:

- Token usage
- Latency
- Cost per task

**Safety**:

- False approval rate (approved when should reject)
- False rejection rate (rejected when should approve)
- Out-of-bounds attempts

### Anti-Patterns

- Manual testing only (doesn't scale)
- No quantitative metrics (can't track progress)
- Testing only happy paths (misses edge cases)
- Evals that always pass (not catching regressions)

## Context Engineering

**Problem**: Context window is precious, must optimize what you send.

**Solution**: Systematic approach to context construction.

### Context Budget Strategy

**Allocate token budget** (example for 128k window):

- System prompt: 2k tokens (1.5%)
- Tool definitions: 5k tokens (4%)
- Conversation history: 30k tokens (23%)
- Retrieved context: 40k tokens (31%)
- User message: 1k tokens (0.8%)
- **Reserve**: 50k tokens (39%) for output + safety margin

### What to Include

**Always**:

- Current task description
- User's explicit context
- Error messages from previous attempts

**Usually**:

- Relevant conversation history (last N turns)
- Retrieved documentation snippets
- Related code snippets

**Sometimes**:

- Full file contents (only if directly editing)
- Entire conversation thread (only for handoffs)
- Tangential context (only if user mentioned)

**Never**:

- Entire codebase dumps
- All conversation history
- Unused tool definitions
- Redundant information

### Context Compression

**Summarization**:

```typescript
const summary = await summarizeConversation({
  messages: history.slice(0, -5), // all but last 5
  maxTokens: 500,
});

const context = [
  { role: "system", content: summary },
  ...history.slice(-5), // keep last 5 verbatim
];
```

**Selective Detail**:

- Full detail for active files
- Signatures only for reference files
- Summaries for background context

**Chunking**:

- Break large documents into semantic chunks
- Embed and retrieve only relevant chunks
- Include chunk context (surrounding text)

### Anti-Patterns

- Dumping entire files into context "just in case"
- No context trimming as conversation grows
- Including tool definitions for tools not available
- Repeating same context every turn

## Multi-Agent Coordination

**Problem**: Complex tasks need specialized agents, but coordination is hard.

**Solution**: Clear patterns for routing, handoffs, and shared context.

### Coordination Patterns

**Router (Orchestrator)**:

- Single coordinator routes to specialized agents
- Each specialist returns to coordinator
- Coordinator synthesizes final answer

```typescript
async function route(task: Task) {
  const specialist = selectAgent(task.type);
  const result = await specialist.execute(task);
  return synthesize(result);
}
```

**Use when**:

- Clear task categorization
- Specialists don't need to communicate
- Single final output needed

**Sequential Handoff**:

- Agent A completes its part
- Passes context + output to Agent B
- Agent B continues from there

```typescript
const research = await researchAgent.execute(query);
const draft = await writerAgent.execute({
  research,
  query,
});
const final = await editorAgent.execute(draft);
```

**Use when**:

- Linear workflow
- Each step builds on previous
- No backtracking needed

**Parallel Execution**:

- Multiple agents work simultaneously
- Results aggregated at end
- Faster but requires independence

```typescript
const [research, examples, tests] = await Promise.all([
  researchAgent.execute(task),
  exampleAgent.execute(task),
  testAgent.execute(task),
]);

return combine(research, examples, tests);
```

**Use when**:

- Tasks are independent
- Speed matters
- No dependencies between agents

**Swarm (Peer-to-Peer)**:

- Agents can communicate directly
- Emergent coordination
- More flexible but harder to debug

**Use when**:

- Unpredictable workflow
- Agents need to negotiate
- Exploration over optimization

### Shared Context Strategies

**Minimal** (default):

- Only pass task description + previous output
- Each agent constructs own context
- Fastest, but agents may lack context

**Selective**:

- Pass task + output + key decisions
- Include "why" not just "what"
- Balance between speed and context

**Full**:

- Pass entire conversation thread
- All agents see everything
- Slowest, but maximum context

### Anti-Patterns

- Creating multi-agent system when single agent would work
- No clear ownership (all agents can do everything)
- Agents passing full context when summary would work
- No error handling when specialist fails
- Circular delegation (A → B → A)

## Agent Observability

**Problem**: Can't debug what you can't see.

**Solution**: Structured logging and tracing throughout agent execution.

### What to Log

**Every LLM Call**:

- Timestamp
- Model used
- System prompt hash (not full text)
- User message
- Tool calls
- Response
- Token counts
- Latency
- Cost

**Every Tool Call**:

- Tool name
- Arguments (sanitized)
- Return value (sanitized)
- Success/failure
- Latency

**Every Decision Point**:

- What options were considered
- Which was chosen
- Why (confidence scores, rules triggered)

### Tracing Multi-Agent Flows

```typescript
const trace = {
  trace_id: generateId(),
  parent_id: null,
  agent: "coordinator",
  task: "research_and_write",
  children: [],
};

// Child agent inherits trace context
const childTrace = {
  trace_id: trace.trace_id,
  parent_id: trace.id,
  agent: "researcher",
  task: "gather_sources",
};
```

### Debugging Patterns

**When output is wrong**:

1. Check tool calls - were right tools called with right args?
2. Check retrieved context - was relevant info available?
3. Check prompt - was instruction clear?
4. Check examples - were they representative?

**When agent gets stuck**:

1. Check for infinite loops (same tool called repeatedly)
2. Check for missing tool (agent trying to do something impossible)
3. Check for ambiguous instruction (agent can't decide)

**When cost is too high**:

1. Check context size - are you sending too much?
2. Check retry logic - are you retrying failures?
3. Check model selection - using GPT-4 when 3.5 would work?

### Anti-Patterns

- Logging passwords/API keys/PII
- No structured format (makes analysis hard)
- Logging everything (noise drowns signal)
- No sampling (100% trace on high-volume)
- Logs not searchable/aggregatable

## Quick Reference

**Starting a new agent**:

1. Whiteboard capabilities → prioritize ruthlessly
2. Start with Level 1 or 2 architecture
3. Build eval suite early
4. Add HITL for safety-critical paths
5. Evolve architecture based on real usage

**Agent not performing well**:

1. Check evals - which criteria failing?
2. Improve prompt - clearer instructions, better examples
3. Add tools - reduce hallucination
4. Add reflection - improve quality
5. Add retrieval - expand knowledge

**Scaling to production**:

1. Observability first - can't debug blind
2. Evals in CI/CD - prevent regressions
3. Context budget discipline - trim aggressively
4. Dynamic behavior - adapt to user/task
5. HITL for uncertainty - safety over speed

**Multi-agent complexity**:

1. Prove single-agent won't work
2. Start with router pattern
3. Minimize shared context
4. Trace end-to-end flows
5. Fall back to human when agents stuck
