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

Phase 0 through Phase 8 are complete.
Phase 9 hardening is now active.
Phase 4 shipped the stateless primitive foundation: canonical array, state, stack, hash-map, tree, call-tree, code-trace, and narration renderers, plus shared edge/layout utilities and deterministic renderer tests.
Phase 5 shipped the runtime verification layer: semantic/frame/code-line/pedagogical/viewport checks, author-review surfacing, and a checked-in JSON golden for the flagship binary-search runtime path.
Phase 6 shipped the visualization-first shell refinement: compact control band, dominant stage surface, docked context column, and responsive narrow-width header behavior.
Phase 7 shipped the first real author-mode foundation: runtime-backed event inspection, frame diffs, narration binding inspection, grouped verification context, and learner-mode blocking when verification fails.
Phase 8 is complete. House Robber has been added as the second flagship lesson with presets, lesson-specific verification, and a checked-in golden. Maximum Depth of Binary Tree is now added as the third flagship lesson, proving the structural tree, stack, and call-tree primitives in a verified recursive DFS path with its own checked-in golden. Graph BFS Frontier is now added as the fourth flagship lesson, proving the graph and queue primitives in a verified frontier-traversal path with its own checked-in golden. Sliding Window Maximum is now added as the fifth flagship lesson, proving dense window state transitions and the reusable sequence primitive in a verified monotonic-deque path with its own checked-in golden. Coin Change Memo DFS is now added as the sixth flagship lesson, proving memoization reuse with call-tree, stack, and hash-map primitives in a verified memoized-recursion path with its own checked-in golden. Heap Top K is now added as the seventh flagship lesson, proving priority-structure behavior with a verified min-heap path and its own checked-in golden. Tree DFS Traversal with Stack is now added as the eighth flagship lesson, proving the remaining stack-execution lesson family with a verified iterative preorder path and its own checked-in golden. Phase 9 has started with a shared binary-tree-array utility and direct tests so tree-based lessons stop duplicating structural input logic. Phase 9 now also includes client-bundle hardening: syntax highlighting moved onto a fine-grained lazy path, the primitive audit harness is on-demand, lesson content is chunked separately, and the production build no longer emits oversized chunk warnings. The stale scaffold e2e check has been replaced with real Playwright smoke coverage for runtime load, author review, lesson switching, preset switching, and custom-input parse failures. Playwright coverage now also spans all eight flagship lessons plus alternate presets for memoization, priority-structure, and stack-execution cases, explicit desktop no-scroll checks, deterministic playback stepping through pointer, keyboard, and timeline controls, region-level overflow checks for dense presets, primitive-level fit checks for the tallest tree, call-tree, and heap canvases, successful custom-input replay coverage across the full flagship set, the first shadcn shell-audit refactor by moving custom input onto the shared dialog primitives, interactive author-review navigation that can drive the live timeline without leaving the drawer, a deeper author audit workflow with issue filtering, full event timeline inspection, and live primitive focus, completion of the remaining blocker-shell audit by moving learner-mode verification failures onto the shared dialog shell, a command-driven shell pass that unifies hotkeys, the task picker, and command palette entries under shared action definitions, a richer preset studio dialog that replaces the bare preset dropdown with descriptive verified scenarios plus in-place custom input, a shared keyboard-display contract that renders combinations and alternative bindings consistently from one component, and a single-mode player decision that fixes the product on `full` instead of exposing multiple projection modes.
Phase 9 now also includes a shared lesson view-spec contract so approach metadata and projector viewport roles can come from one source of truth. Maximum Depth of Binary Tree now uses that contract to make the recursive execution tree primary while keeping the structural tree as supporting context.
Phase 9 now also includes the first motion-system slice: a canonical motion contract in the architecture/runtime/visual specs and a Binary Search pilot for pointer travel, active code-line handoff, and state-value commitment under reduced-motion-safe rules.
Phase 9 now also includes the first explicit continuity guard for tracked signals: runtime verification warns when pointers blink out between adjacent non-terminal frames, and House Robber has been corrected to keep its focus pointer visible across the loop-check step.
Phase 9 now also extends the motion pilot into recursion: Maximum Depth of Binary Tree now animates execution-tree node promotion, call-stack push/pop handoff, and return-value commitment as the first non-array motion pass.
Phase 9 now also upgrades the shared pointer system: array and sequence pointers are rendered as animated arrow primitives rather than bordered chips, with movement bias driven by tracked pointer continuity.
Phase 9 now also has a documented follow-up architecture for cross-view execution tokens: pointers are no longer the intended root semantic object, and the next hardening slice is to make important execution objects recognizable across stage, state, narration, and later code through one shared token identity.
Phase 9 now also has live execution-token pilots beyond the initial pointer rollout: Binary Search, House Robber, and Sliding Window Maximum share token identity across stage, state, and narration, and Maximum Depth of Binary Tree now carries a shared `dfs` token across the execution tree, call stack, and narration.
Phase 9 now also includes the first shared code-trace execution-token pass: the player shell decorates active-line code spans from the current frame's token identity, with Binary Search as the first pilot.
Phase 9 now also makes author review token-aware at the active-frame level: audit can summarize shared execution tokens and which synchronized views currently project them, so token drift is inspectable instead of inferred.
Phase 9 now also has a documented stage-composition correction: the old `primary` / `secondary` / `tertiary` routing is not enough for lessons with multiple mechanism views, so the next shell pass should evolve toward `primary`, `co-primary`, `context`, and `support`.
Phase 9 now also has the first runtime implementation of that model: the player shell can route explicit `co-primary` views into the stage stack, keep explicit `context` views in a separate stage rail, and keep `support` panels out of the stage entirely.
Graph BFS, Coin Change Memo DFS, and Tree DFS Traversal now also use shared lesson view specs so their stage composition is explicit in lesson metadata and projector viewport roles instead of relying on legacy `secondary` fallbacks.

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
- single full-mode projection infrastructure
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
- no learner-facing mode switcher
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
- docs-first execution-token architecture and pointer-overlay rollout plan
- compatibility bridge from current pointer specs into shared execution tokens
- pointer-overlay migration for array and sequence primitives
- Binary Search token pilot across stage, state, and narration
- flagship lesson audit for `primary` / `co-primary` / `context` / `support` stage composition

### Acceptance criteria

- the system can add a new lesson without architectural improvisation
- doc gaps found during implementation are promoted into canonical docs
- shell UI stays inside `shadcn/ui` conventions
- pointer rendering no longer perturbs primitive layout
- important execution objects can become recognizable across multiple synchronized views instead of only inside a pointer renderer
- stage composition is driven by pedagogical job rather than by primitive kind alone
- mechanism views are no longer demoted to generic side panels when they explain the transition

### Phase 9.x: Cross-View Execution Tokens And Pointer Overlay

Why this exists:

- pointer work was exposing a deeper product need
- the learner should recognize the same execution object across stage, state, and narration
- pointers are only one projection of that object, not the semantic root
- geometry and pointer rendering must stop living inside cell layout

Decision:

- document the architecture first in canonical docs
- keep current `PointerSpec` as the authored compatibility contract
- derive shared execution-token identity internally as the migration bridge
- move pointer rendering to overlay layers backed by primitive-owned anchors

Rollout order:

1. internal token compatibility bridge from current pointer specs
2. shared pointer-overlay infrastructure
3. array and sequence migration
4. Binary Search pilot for stage + state + narration token identity
5. QA and verification hardening
6. later expansion to tree, call-tree, graph, queue, stack, and code-trace projections

Acceptance criteria:

- the canonical docs explicitly define execution tokens as the primary semantic object
- pointer overlays do not change primitive width, height, or scroll behavior
- Binary Search demonstrates one shared execution-token identity across stage pointer, state row, and narration
- the rollout is compatibility-based rather than a breaking lesson-authoring rewrite

### Phase 9.y: Pedagogical Stage Composition

Why this exists:

- several flagship lessons still use the stage incorrectly even after shell hardening
- the runtime can currently demote mechanism views into generic secondary panels
- some context views still compete with richer execution views they no longer need to outrank

Decision:

- stop treating `primary` / `secondary` / `tertiary` as the real pedagogical model
- define lesson composition in terms of `support`, `primary`, `co-primary`, and `context`
- audit the flagship set against those roles before making more visual shell changes

Target compositions:

- Binary Search: array `primary`; state `support`
- House Robber: houses row `primary`; rolling state `support`
- Maximum Depth: execution tree `primary`; call stack `co-primary`; structural tree `context`
- Graph BFS: graph `primary`; frontier queue `co-primary`; traversal state `support`
- Sliding Window Maximum: array/window `primary`; monotonic deque `co-primary`; window state `support`
- Coin Change Memo DFS: call tree `primary`; memo table and call stack `co-primary`
- Heap Top K: heap `primary`; input scan `co-primary`; threshold/top-k state `support`
- Tree DFS Traversal: structural tree `primary`; stack and traversal output `co-primary`

Acceptance criteria:

- the composition rules are written into canonical docs before shell changes
- each flagship lesson has an explicit target role assignment
- duplicated structural context can no longer outrank a richer execution view
- support-column content is limited to narration, code trace, compact code-state, and lightweight runtime status

## Sequencing Rules

- do not build many lessons before the contracts and verification layer exist
- do not optimize visual polish before the runtime and verification model are stable
- do not let page-specific hacks become the default shell contract
- do not reintroduce alternate projection modes unless a future product decision proves they are necessary
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
