# Visualization Creation Protocol

## Purpose

This document defines the exact workflow for creating a new visualization lesson in this workspace.

Use it when:

- creating a new lesson from scratch
- asking another AI to generate a lesson
- turning the lesson workflow into a reusable skill

The goal is low ambiguity.
A lesson should not appear through ad hoc page edits or undocumented decisions.

## What This Protocol Solves

Architecture alone is not enough for reliable lesson creation.
Another AI also needs:

- defined inputs
- exact files to create or update
- required contracts
- validation gates
- a clear definition of done
- validation gates for pedagogical integrity, not only algorithmic correctness

This protocol provides that layer.

A lesson is not complete just because the algorithm is correct.
It must also be safe as a teaching artifact: no skipped learner-visible steps, no hidden state loss, and no overloaded frames.

## Required Inputs

A lesson creation request must provide or derive these fields:

- `slug`
- `title`
- `problem type`
- `primary confusion type`
- `approach list`
- `default approach`
- `default visualization mode` (currently always `full`)
- `at least 2 presets`
- `code template per approach`
- `required synchronized views`
- `custom input format`

If any are missing, the AI should infer them from the problem and write the assumptions into the lesson files.

## Preset Design Contract

Presets are not filler examples.
They are part of the teaching surface and should be chosen for explanatory value.

Every approach should define presets that cover:

- the most explanatory success path
- the most explanatory failure path when failure is meaningful for the problem
- important edge cases that reveal the lesson shape, constraints, or branching behavior

Do not spend preset slots on arbitrary random inputs when a more legible case exists.

Recommended semantic preset labels:

- `success path` - the clean representative run that teaches the intended core mechanic
- `failure path` - a miss, impossible target, exhausted frontier, or other instructive negative outcome
- `edge case` - a boundary or shape that exposes a structural nuance the learner is likely to miss

When the shell supports preset badges, these semantic classes should use semantic tokens rather than arbitrary decorative colors.
That means:

- success-like presets use reassuring/supportive emphasis
- failure-like presets use destructive emphasis
- edge-case presets use neutral or outline emphasis

The point is not decoration.
The point is to help the learner immediately understand what kind of scenario they are selecting.

Presets should also exercise token continuity.
At minimum, flagship presets should expose:

- a success path where the main execution tokens are easy to follow
- a failure path where those tokens remain legible through the negative outcome
- edge cases that prove tokens do not blink out, drift semantically, or become ambiguous under boundary conditions

## Canonical Lesson Workflow

1. Define the lesson.
2. Define each approach.
3. Define the semantic trace events.
4. Define the projection into frames.
5. Bind narration to frame state.
6. Wire the lesson into the lesson registry.
7. Run verification.
8. Review in author mode.
9. Expose in learner mode only after verification passes.

Narration binding should now use the structured explanation path by default.
Do not treat this step as "write a sentence for each frame."

## Files A New Lesson Must Create

Assuming lesson slug `coin-change`, create these files:

```txt
content/lessons/coin-change/
  lesson.ts
  presets.ts
  approaches/
    memo-dfs/
      code.ts
      trace.ts
      project.ts
      verify.ts
      notes.ts
```

Required meanings:

- `lesson.ts` - top-level lesson definition and metadata
- `presets.ts` - preset inputs
- `code.ts` - learner-facing code template
- `trace.ts` - semantic event generator
- `project.ts` - event-to-frame projector
- `verify.ts` - lesson-specific verification helpers
- `notes.ts` - short pattern note and short supporting insights only

## Files The AI May Also Need To Update

```txt
content/lessons/index.ts
src/domains/lessons/registry.ts
src/domains/lessons/types.ts
src/domains/tracing/*
src/domains/projection/*
src/domains/verification/*
```

Only update shared contracts when the lesson genuinely requires a new reusable capability.
Do not patch shared types for one-off page behavior.

## Structured Narration Requirement

New lessons should not hand-author narration as arbitrary prose strings.
The default path is:

1. classify the frame event into a narration family
2. build a `headline`
3. add a `reason`
4. add an `implication` when the learner needs to understand what survives or happens next
5. attach compact evidence when it materially improves trust

Use shared narration builders where possible.
If a lesson bypasses the structured narration path, that should be treated as an exception requiring review.

## Required Contract Sequence

### Step 1: Lesson definition

Create `lesson.ts` with:

- lesson metadata
- confusion type
- default mode
- viewport contract
- approach references
- `requiredViews` derived from a shared approach view-spec list rather than duplicated manually

### Step 2: Code template

Create `code.ts` for each approach.
The code must be the canonical code the learner is expected to understand or write.

### Step 3: Trace generator

Create `trace.ts`.
The trace must emit typed semantic events only.
Do not emit visual instructions here.

### Step 4: Projector

Create `project.ts`.
The projector maps semantic events to learner-visible frames.
Each frame must:

- point to a source event
- point to a code line
- declare one visual change type
- produce primitive states
- produce narration payload

Do not hardcode primitive viewport roles independently from lesson metadata.
Each approach should define one shared view-spec list and use it in both places:

- `lesson.ts` derives `requiredViews`
- `project.ts` reads the same view specs to assign primitive viewport roles and preferred sizes

### Step 5: Verification

Create `verify.ts`.
This file checks:

- semantic invariants
- frame invariants
- code-line mapping
- one-visual-change compliance
- state continuity and no-hidden-state-loss rules
- lesson-specific correctness requirements
- lesson-specific pedagogical integrity requirements

### Step 6: Registration

Add the lesson to the canonical lesson registry.
Do not create hidden routes or hardcoded page lists.

## One Visual Change Taxonomy

Every learner-visible frame must declare exactly one of these step types:

| Step Type | What Changes                                      | Example                           |
| --------- | ------------------------------------------------- | --------------------------------- |
| `Move`    | A pointer or frontier marker moves                | `i` moves from index `2` to `3`   |
| `Compare` | Elements or states are checked against each other | `arr[mid]=5 < target=7`           |
| `Mutate`  | The data structure or tracked state is modified   | Push `3` onto stack               |
| `Result`  | A result value is written, returned, or committed | `answer[0] = 3`                   |
| `Enter`   | A new frame or scope is entered                   | Push `dfs(4)` onto call stack     |
| `Exit`    | A frame or scope completes                        | Pop a frame and mark subtree done |

Rules:

- one frame may declare only one step type
- if two learner-visible changes happen, split them into two frames
- if state changes ownership, the handoff must be visible
- if a frame completes, the learner must still be able to see what finished and where control returned

## Required Synchronized Views

The AI must choose views from confusion type.

Do not classify views only as "main thing" and "sidebar thing".
Choose them by pedagogical job:

- `support` - narration, code trace, compact code-state
- `primary` - main teaching surface
- `co-primary` - another stage-core view required to explain the transition
- `secondary` - a true auxiliary execution aid, currently limited to recursive call stack and memo table
- `context` - optional orientation view only

Use this selection test:

1. Which view answers "what is happening right now?"
2. Which second view is required to answer "why is that the next step?"
3. Which remaining view is only a call stack or memo table and therefore qualifies as `secondary`?
4. Which remaining view only reassures or orients the learner?
5. Which remaining values are only code-state mirrors and therefore belong in support?

### `pointer-state`

Minimum:

- primary sequence or array view
- pointer labels
- invariant or comparison state
- code trace
- narration

### `stack-execution`

Minimum:

- primary execution view when the confusion is about recursive flow, aggregation, or return propagation
- primary structural view only when the learner is mainly tracking traversal location through the original structure
- secondary call stack only when recursion waiting relationships materially help
- code trace
- narration

Example:

- Maximum Depth of Binary Tree should usually make the execution tree primary and keep the call stack secondary.
- Iterative tree traversal should usually keep the structural tree primary because the learner is tracking where traversal goes next through the original tree.

Additional rule:

- if the execution view already makes the structure legible, do not keep the original structure visible by default

### `memoization-reuse`

Minimum:

- call tree or focused execution tree
- secondary stack view
- secondary memo table
- code trace
- narration

### `structural-mutation`

Minimum:

- primary structure view
- mutation target emphasis
- result state
- code trace
- narration

## Rules The AI Must Follow

- visualization-first, not prose-first
- one visual change per step
- every learner-visible step maps to a real code line
- primitives are stateless renderers
- semantic meaning must not live only in color or styling
- the lesson should project through the single shipped `full` mode
- desktop playback should avoid unnecessary scrolling on normal presets
- if algorithmic correctness cannot be verified, the lesson is not done
- if pedagogical integrity cannot be verified, the lesson is not done
- if a view explains the algorithm's mechanism, it belongs in the stage, not the support column
- if a view is not a call stack or memo table, it should not use `secondary`
- if a view only mirrors code state, it belongs in support even when it is visually attractive
- do not keep duplicated structural context at equal weight when a richer execution view already subsumes it

## Execution Token Authoring Guidance

Important moving execution objects should be designed as reusable execution tokens.

Examples:

- `lo`
- `hi`
- `mid`
- `i`
- `front`
- `curr`
- `best`

Guidance:

- define the important execution objects once at the semantic level
- reuse the same token identity in stage, narration, and state or code-status views where pedagogically useful
- do not invent separate labels or colors independently in each view
- prefer one recognizable token identity projected across views over ad hoc local styling
- keep token labels short and algorithm-real

Execution-token identity and primitive-local semantic tone are different:

- token identity answers which object the learner is tracking
- primitive-local tone answers what local state that object or target is in right now

Both may be present at once.

Example:

- token `mid` stays recognizable in stage, state, and narration
- the array cell under `mid` may still use local highlight tone `compare`

## Flagship Composition Targets

Use these as the default authoring targets for the current flagship set.

- Binary Search: array `primary`; code-state `support`
- House Robber: houses/state-transition row `primary`; rolling DP scalars `support`
- Maximum Depth: execution tree `primary`; call stack `secondary`
- Graph BFS: graph `primary`; frontier queue `co-primary`; traversal state `support`
- Sliding Window Maximum: array/window `primary`; monotonic deque `co-primary`; window state `support`
- Coin Change Memo DFS: call tree `primary`; memo table and call stack `secondary`
- Heap Top K: heap `primary`; input scan `co-primary`; threshold/top-k state `support`
- Tree DFS Traversal: structural tree `primary`; stack and traversal output `co-primary`

## Definition Of Done

A new lesson is done only when all are true:

- lesson files exist in the canonical content structure
- lesson is registered through the canonical registry
- semantic trace passes verification
- frames pass one-visual-change verification
- code-line mapping is valid
- no required learner-visible micro-step is skipped
- important state is never lost silently between adjacent frames
- important execution tokens remain recognizable across the synchronized views that render them
- required synchronized views are present
- custom input parsing works
- normal presets are readable on desktop without unnecessary scrolling
- author mode can explain why the lesson is correct and pedagogically safe

## What Another AI Should Return

If another AI is instructed to create a lesson through a skill, it should return:

1. the created or modified file list
2. the chosen confusion type
3. the chosen synchronized views
4. any assumptions it had to make
5. verification status
6. known gaps if verification is incomplete

It should not return only prose or only a mockup.
A lesson is an implemented, registered, and verified artifact.

## Skill Conversion Guidance

If this workflow is turned into a reusable skill, the skill should load:

- `AGENTS.md`
- `CODEX.md`
- `PROJECT_CONTEXT.md`
- `docs/VISUALIZATION_FIRST_ARCHITECTURE.md`
- this file

The skill should enforce the lesson workflow above and reject requests that skip verification or pedagogical integrity checks.
