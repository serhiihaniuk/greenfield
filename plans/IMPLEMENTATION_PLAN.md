# Greenfield Implementation Plan

## Objective

Build a new visualization-first app from scratch at the workspace root.
The product must be optimized for AI-driven lesson creation and must be trustworthy even when the learner cannot validate the lesson themselves.

## Delivery Strategy

This plan assumes:

- the new app is the real project and is built independently at this workspace root
- the new app is a Vite React TypeScript app
- `shadcn/ui` is bootstrapped from the start for shell and utility UI
- correctness, pedagogical integrity, and authoring reliability take priority over shipping many pages quickly

## Chosen Stack

### Platform

- package manager: `npm`
- app runtime: `Vite`
- UI framework: `React 19`
- language: `TypeScript 5`
- routing: `React Router 7`

### Shell and styling

- `Tailwind CSS v4`
- `shadcn/ui` with the Base UI-backed `base-nova` style
- `lucide-react`
- semantic CSS variable tokens

### Visualization layer

- `motion` / `motion/react`
- DOM-based node rendering
- SVG edge layer
- `d3-hierarchy` for structural tree layout
- custom execution-tree layout

### State, validation, content, and tests

- `Zustand`
- `Zod`
- TypeScript lesson modules under `content/lessons`
- `Vitest`
- `React Testing Library`
- `Playwright`
- structured JSON goldens

## What Was Missing Before This Revision

The earlier plan still left too much to be invented during implementation.
These were the main missing items:

- no exact router choice
- no exact animation technology for diagram transitions
- no rendering model for nodes versus edges
- no exact state management choice
- no validation library choice
- no code-highlighting choice
- no layout-engine choice for trees and call trees
- no fixed MVP lesson set
- no explicit decision on JSON versus screenshot goldens

Those are now fixed in the architecture and in this plan.

## Current Execution Status

Phase 0 through Phase 7 are complete.
Phase 4 shipped the stateless primitive foundation: canonical array, state, stack, hash-map, tree, call-tree, code-trace, and narration renderers, plus shared edge/layout utilities and deterministic renderer tests.
Phase 5 shipped the runtime verification layer: semantic/frame/code-line/pedagogical/viewport checks, author-review surfacing, and a checked-in JSON golden for the flagship binary-search focus path.
Phase 6 shipped the visualization-first shell refinement: compact control band, dominant stage surface, docked context column, and responsive narrow-width header behavior.
Phase 7 shipped the first real author-mode foundation: runtime-backed event inspection, frame diffs, narration binding inspection, grouped verification context, and learner-mode blocking when verification fails.
Phase 8 is now active. House Robber has been added as the second flagship lesson with presets, lesson-specific verification, and a checked-in focus golden. Maximum Depth of Binary Tree is now added as the third flagship lesson, proving the structural tree, stack, and call-tree primitives in a verified recursive DFS path with its own checked-in focus golden. Graph BFS Frontier is now added as the fourth flagship lesson, proving the graph and queue primitives in a verified frontier-traversal path with its own checked-in focus golden. Sliding Window Maximum is now added as the fifth flagship lesson, proving dense window state transitions and the reusable sequence primitive in a verified monotonic-deque path with its own checked-in focus golden.

## Phase 0: Operating System

### Deliverables

- `README.md`
- `AGENTS.md`
- `CODEX.md`
- `PROJECT_CONTEXT.md`
- greenfield architecture doc
- this implementation plan

### Exit criteria

- the workspace has a clear source of truth
- fresh chats can restore context without relying on old app docs

Follow `docs/BOOTSTRAP_SPEC.md` exactly during project initialization.

## Phase 1: Repo Bootstrap

### Deliverables

- initialize the new app at the workspace root as a Vite React TypeScript project
- bootstrap `shadcn/ui` with the `vite` template through `--base base --preset nova`, yielding `base-nova`
- generate `components.json`
- install core libraries: router, motion, zustand, zod, shiki, d3-hierarchy, test stack
- define base TypeScript path aliases
- establish the `src/` workspace structure from the architecture doc
- add baseline lint, format, typecheck, unit test, and e2e test wiring

### Acceptance criteria

- the new app boots independently through Vite
- `shadcn/ui` is initialized and usable in the project
- `components.json` exists and is valid
- the folder structure matches the architecture contract
- CI-equivalent local commands exist for lint, typecheck, unit tests, and e2e smoke tests

### Bootstrap rule

Use the `shadcn` CLI to create or initialize the project.
Do not hand-roll a pseudo-shadcn setup.

## Phase 2: Canonical Contracts

### Deliverables

- implement lesson schema types
- implement trace event types
- implement frame types
- implement verification report types
- implement visual change taxonomy types
- implement pedagogical integrity check types
- implement lesson registry contracts

### Acceptance criteria

- no visualization code exists without these contracts
- one visual change is represented as a first-class type, not as a comment convention
- pedagogical integrity failures are representable as first-class verification output
- lesson registration is driven by typed contracts, not page-local logic

The runtime implementation must follow `docs/RUNTIME_PLAYER_SPEC.md`.

## Phase 3: Runtime Core

### Deliverables

- lesson loader
- trace runner
- projector runner
- playback state machine
- mode switching infrastructure
- custom input parse and replay pipeline
- code tokenization and line-metadata pipeline

### Acceptance criteria

- one lesson can be loaded end to end from definition to playback
- playback is deterministic across reset and replay
- custom input can regenerate a trace without page reload
- code lines can be highlighted from frame metadata without ad hoc parsing in components

Primitive implementation must follow both `docs/PRIMITIVE_SYSTEM_SPEC.md` and `docs/PRIMITIVE_VISUAL_SPEC.md`.

## Phase 4: Primitive Foundation

### Deliverables

- `ArrayView`
- `StackView`
- `HashMapView`
- `TreeView`
- `CallTreeView`
- `CodeTraceView`
- `NarrationView`
- shared pointer/highlight/annotation contracts
- semantic token layer for primitive states
- shared SVG edge layer
- structural tree layout utility
- execution-tree layout utility
- primitive default size, density, and orientation implementations
- explicit visual handoff and archived-state transition patterns

### Acceptance criteria

- primitives are stateless renderers
- primitives use stable ids and deterministic layout inputs
- execution-tree use cases do not leak into structural tree primitives
- primitives remain independent from `shadcn/ui` implementation details
- edges and nodes animate coherently between adjacent frames

## Phase 5: Verification Layer

### Deliverables

- semantic invariant checks
- frame verification checks
- code-line mapping checks
- one-visual-change checks
- hidden-state-loss checks
- overloaded-frame checks
- viewport sanity checks for flagship presets
- golden JSON generation and comparison helpers

### Acceptance criteria

- a lesson can fail verification before learner mode is shown
- verification results are machine-readable and visible in author mode
- semantically correct but pedagogically unsafe lessons still fail verification
- flagship lessons can be checked against golden traces and frames locally

## Phase 6: Visualization-First Shell

### Deliverables

- desktop-first lesson player shell using `shadcn/ui`
- mode switcher
- approach switcher
- custom input panel
- compact narration and code dock
- base empty, loading, alert, and dialog states using `shadcn/ui`
- local persistence for user inputs and view preferences

### Acceptance criteria

- the visualization is the dominant surface
- normal desktop playback avoids unnecessary scrolling
- shell composition works for pointer, recursion, and memoization lessons
- standard controls use `shadcn/ui` instead of ad hoc markup

## Phase 7: Author Mode

### Deliverables

- author review screen
- semantic event panel
- frame diff panel
- invariant panel
- narration binding panel
- warnings for broken contracts
- lesson verification summary UI

### Acceptance criteria

- an AI-authored lesson can be audited without relying on learner intuition
- a wrong lesson fails loudly instead of looking plausible
- the verification summary makes it clear why a lesson is blocked

## Phase 8: Flagship Lessons

### MVP set

1. binary search
2. sliding window maximum
3. tree DFS traversal with call stack
4. subtree depth-style recursion
5. coin change memo DFS
6. house robber
7. graph BFS frontier
8. heap-based top-k

### Acceptance criteria

- all 8 lessons cover the main confusion types
- at least one lesson exercises each core primitive family
- each flagship lesson has golden-step verification

## Phase 9: Hardening

### Deliverables

- visual QA pass
- viewport QA pass
- custom input QA pass
- authoring workflow refinements
- doc updates based on real implementation friction
- shadcn shell audit for composition and semantic styling compliance
- optional screenshot regression layer for the most important lessons

### Acceptance criteria

- the system can add a new lesson without architectural improvisation
- doc gaps found during implementation are promoted into canonical docs
- shell UI stays inside `shadcn/ui` conventions

## Sequencing Rules

- do not build many lessons before the contracts and verification layer exist
- do not optimize visual polish before the runtime and verification model are stable
- do not let page-specific hacks become the default shell contract
- do not introduce compare mode until the single-lesson teaching surface is already clear
- do not replace visualization primitives with generic shell components
- do not use screenshot diffs as the primary correctness mechanism

## PO Priorities

When tradeoffs appear, prefer this order:

1. correctness, pedagogical integrity, and trust
2. clarity of the learner surface
3. authoring reliability for AI
4. extensibility across hard problem types
5. shell consistency through `shadcn/ui`
6. polish
7. breadth of content

## Immediate Next Build Steps

1. implement the canonical lesson, trace, frame, and verification contracts as code
2. build the typed lesson registry and runtime entry interfaces
3. wire the playback runtime and verification skeleton to those contracts
4. build the first primitive set only after the contract layer is stable
5. ship one end-to-end flagship lesson before expanding breadth
