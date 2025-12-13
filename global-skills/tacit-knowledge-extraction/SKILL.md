---
name: tacit-knowledge-extraction
description: Extract tacit knowledge into pattern languages. Use when creating skills from expert knowledge, documenting tribal knowledge, or turning implicit expertise into explicit patterns. Meta-skill for creating better skills.
tags: [knowledge-management, patterns, learning, documentation]
---

# Tacit Knowledge Extraction

Turn implicit expertise into explicit, shareable patterns. Extract the "tricks of the trade" that experts can't easily articulate.

## What is Tacit Knowledge

**Tacit knowledge** = knowledge that's difficult to articulate, procedural, heuristic, gained through direct experience. The "Fingerspitzengefühl" that experts have but can't explain.

**Characteristics:**

- Hard to verbalize ("I just know")
- Procedural, not declarative
- Context-dependent
- Gained through practice, not instruction
- Often unconscious competence

**Examples:**

- How a senior dev "smells" bad code
- When to break the rules vs follow them
- Debugging intuition ("check this first")
- Knowing when a design is "done"

**Why it matters:** Most valuable knowledge in organizations is tacit. If you don't extract it, it walks out the door when experts leave.

## Pattern Language Structure

A **pattern** describes a recurring solution to a problem in a context. Format from Christopher Alexander (architecture) → software → human activities.

### Core Elements

**Name:** Evocative, memorable (2-4 words)

- Good: "Experienced Person", "Radar Chart Review"
- Bad: "Knowledge Extraction Method #3"

**Context:** When does this apply?

- Situation, preconditions, scope
- "You are creating a skill from expert knowledge..."

**Problem:** What tension needs resolving?

- The force that creates the need
- "Experts can't articulate what they know..."

**Solution:** The pattern itself (imperative form)

- Actionable, specific steps
- "Interview 5-10 practitioners with well-balanced selection..."

**Consequences:** What results? Trade-offs?

- Benefits and liabilities
- "You get diverse perspectives but need more synthesis time"

**Forces:** Competing concerns the pattern balances

- Optional but valuable for complex patterns
- E.g., speed vs thoroughness, breadth vs depth

### Pattern Relationships

Patterns connect to form a **language**:

- **Uses:** This pattern employs another
- **Refines:** This pattern is a specific case of another
- **Precedes:** Do this before that
- **Alternatives:** Different solutions to same problem

## Extraction Process

Collaborative process to mine patterns from practitioners. Based on Iba et al.'s procedure.

### Step 1: Select Experienced People

**Pattern: EXPERIENCED PERSON**
Choose people who are well-experienced and admirable in the field you're documenting.

**Pattern: WELL-BALANCED SELECTION**
Select 5-10 people with diverse perspectives within the domain. Different specialties, seniorities, contexts.

**Why diversity matters:** Each person knows different aspects. Overlap reveals core patterns, gaps reveal edge cases.

### Step 2: Interview for Experiences

**Pattern: EXPERIENCE MINING**
Don't ask "what do you think?" Ask "tell me about a time when..."

**Interview techniques:**

- **Critical incidents:** "Tell me about a really successful project. What made it work?"
- **Failure analysis:** "When did it go wrong? What would you do differently?"
- **Contrast cases:** "How is X different from Y?"
- **Concrete examples:** Force specifics, not generalities

**Questions to ask:**

- "Walk me through how you do X"
- "What do you check first when debugging?"
- "How do you know when it's good enough?"
- "What mistakes do beginners make?"
- "What rules do you break, and when?"

**Observation beats interviews:**
If possible, watch experts work. Note what they do, not what they say they do. Experts often can't articulate unconscious moves.

### Step 3: Extract Pattern Candidates

**Pattern: PATTERN MINING**
After interviews, identify recurring themes across practitioners.

**Mining techniques:**

1. **Affinity mapping:** Cluster similar experiences
2. **Contrast analysis:** What do experts do that novices don't?
3. **Negative cases:** When does the pattern NOT apply?
4. **Threshold detection:** When does one pattern transition to another?

**Look for:**

- Repeated phrases ("I always...", "First thing I do...")
- Shared heuristics (rules of thumb)
- Common mistakes mentioned by multiple people
- Things experts do unconsciously
- Disagreements (might indicate context variations)

### Step 4: Validate with Practitioners

**Pattern: PRACTITIONER VALIDATION**
Test draft patterns with people who weren't interviewed. Do they recognize them? Can they use them?

**Validation methods:**

- **Recognition test:** "Do you do this?"
- **Checklist application:** Rate experience with each pattern (radar chart)
- **Use in training:** Do novices improve after learning the pattern?
- **Refinement iteration:** Patterns are never "done", iterate based on feedback

**Quality signals:**

- Pattern feels obvious once articulated ("yes, exactly!")
- Practitioners can immediately give examples
- Novices can apply it and get results
- Pattern survives contact with reality (edge cases)

## Pattern Mining Techniques

### Interview Structure

**Pre-interview:**

- Define domain scope clearly
- Prepare concrete scenarios
- Schedule 60-90 minutes
- Record (with permission) for later analysis

**During interview:**

- Start with recent, vivid examples
- Follow energy (what they're excited about)
- Probe vague language ("elegant" → "what specifically?")
- Ask for counter-examples

**Post-interview:**

- Transcribe key quotes
- Note emotional peaks (often reveal values)
- Extract concrete actions, not philosophies
- Map to other interviews (look for patterns)

### Observation Protocol

If you can watch experts work:

1. **Shadow silently** - don't interrupt flow
2. **Note micro-behaviors** - what they check, order of operations
3. **Ask after** - "Why did you do X before Y?"
4. **Look for routines** - repeated sequences that might be unconscious

### Collaborative Pattern Writing

**Pattern: COLLABORATIVE CREATION**
Write patterns together with domain experts, not alone after interviews.

**Workshop format:**

- Gather 5-10 practitioners
- Share initial pattern drafts
- Discuss, refine, merge, split
- Experts challenge each other's assumptions
- Converge on shared understanding

**Benefits:**

- Experts trigger each other's memories
- Disagreements reveal context boundaries
- Shared ownership increases adoption
- Faster validation loop

## Writing Patterns

### Style Guidelines

**Use imperative mood:**

- Good: "Interview experienced people"
- Bad: "One should interview experienced people"

**Be specific, not abstract:**

- Good: "Select 5-10 people with different specialties"
- Bad: "Ensure diverse representation"

**Show, don't just tell:**

- Include examples, quotes, concrete cases
- "For instance, when creating the Learning Patterns..."

**Short paragraphs, scannable:**

- Patterns are reference material, not novels
- Use bullets, bold, subheadings
- Target 1-2 pages per pattern

**Evocative names:**

- Capitalized pattern names (PATTERN NAME)
- Create shared vocabulary
- Names should be memorable, slightly poetic

### Pattern Template

```
## PATTERN NAME

**Context:** When does this apply?

**Problem:** What tension exists?

**Forces:**
- Force A (e.g., need speed)
- Force B (e.g., need accuracy)

**Solution:**
Actionable description of the pattern.
Step-by-step if appropriate.

**Examples:**
Concrete instances of the pattern in practice.

**Consequences:**
- Benefits: What you gain
- Liabilities: What you trade off

**Related patterns:**
- Uses: X, Y
- Refines: Z
- See also: A, B
```

## Validation Strategies

### Recognition Test

Show pattern to 5+ practitioners who weren't interviewed:

- "Do you recognize this in your practice?"
- "Can you give me an example from your work?"

If < 60% recognize it, pattern might be too specific or poorly described.

### Application Test

Give pattern to novices:

- Can they apply it without expert guidance?
- Does performance improve measurably?
- What confusions arise? (reveals missing context)

### Radar Chart Review

**Pattern: PATTERN-EXPERIENCE CHART**
Create checklist of all patterns. Have practitioners rate their experience with each (0-5).

Plot as radar chart. Reveals:

- Which patterns are universal vs specialized
- Gaps in individual expertise (learning opportunities)
- Clusters of related patterns

### Iteration Signals

**Refine pattern if:**

- Multiple people misinterpret it
- Edge cases keep arising
- Name doesn't stick (people paraphrase it)
- Consequences list is lopsided (all benefits, no trade-offs)

**Split pattern if:**

- Two distinct solutions mixed together
- Context variations create different solutions
- Pattern is > 3 pages

**Merge patterns if:**

- Always used together
- Distinction feels artificial
- Practitioners can't tell them apart

## Meta-Patterns for Skill Creation

### Pattern: SKILL AS PATTERN LANGUAGE

When creating a skill, treat it as a mini pattern language:

- Each section is a pattern (context → problem → solution)
- Patterns connect and reference each other
- Skill header is the "overview" pattern

### Pattern: EXTRACT FROM HISTORY

When creating skills for yourself:

- Search CASS for past sessions in the domain
- Look for what worked vs what failed
- Extract patterns from your own tacit knowledge
- Your debugging sessions reveal troubleshooting patterns

### Pattern: REFERENCE OVER TUTORIAL

Skills are reference material, not step-by-step tutorials:

- Imperative, scannable, indexed
- Practitioners should find what they need in < 30 seconds
- Front-load the most valuable patterns

### Pattern: LIVING DOCUMENT

Patterns evolve as practice evolves:

- Add new patterns when gaps discovered
- Mark deprecated patterns when practice changes
- Track pattern maturity (candidate → established → proven → deprecated)
- Version skills, note major changes

## Quick Reference

**Creating a pattern language:**

1. Select 5-10 experienced, diverse practitioners
2. Interview for concrete experiences, not opinions
3. Mine recurring themes across interviews
4. Draft patterns (context, problem, solution, consequences)
5. Validate with practitioners via recognition/application tests
6. Iterate based on feedback
7. Document pattern relationships

**Pattern quality checklist:**

- [ ] Name is evocative and memorable
- [ ] Context clearly defines when to apply
- [ ] Problem describes the tension
- [ ] Solution is actionable and specific
- [ ] Consequences include both benefits and liabilities
- [ ] Examples are concrete, not hypothetical
- [ ] Pattern is 1-2 pages max
- [ ] 60%+ of practitioners recognize it

**Common mistakes:**

- Asking what people think instead of what they do
- Documenting aspirations instead of actual practice
- Writing abstractions instead of concrete actions
- Skipping validation (your draft is always wrong)
- Over-generalizing from one expert's approach
- Creating too many patterns (paralysis)

**Rule of thumb:** If experts say "well, duh" when reading the pattern, you got it right. If they say "I've never done that", you invented instead of discovered.
