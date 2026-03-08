# Project Context

## What This Project Is

A from-scratch algorithm visualization app for hard interview-style problems.

This is not a general docs site and not a blog-like learning platform.
It is a dark, desktop-first, visualization-heavy study tool for the moment when the learner is stuck and needs the algorithm made concrete step by step.

## What The Previous Product Was

The previous product was an interactive algorithm visualizer built iteratively.
It was strongest when the concept could be explained by a few synchronized views such as:

- two pointers over an array
- sliding window boundaries and conditions
- binary search on a sorted array
- basic tree traversal with a visible tree plus stack

The old product had:

- a dark UI
- a large central visualization area
- step playback controls
- narration for each step
- code shown with the visualization
- custom input support for replaying failed examples

But it was inconsistent and incomplete as a system.
It did not scale cleanly to harder recursive, DP, and structural lessons.

## What We Are Building Now

We are building a stricter and more trustworthy version of that product.

The new app should feel like this on desktop:

- a compact top bar
- one dominant central visualization surface
- synchronized side panels only when they improve understanding
- step narration close to the active visualization
- code trace docked into the same lesson surface
- almost no unnecessary prose or decorative whitespace

The learner should be able to open one lesson and immediately see:

- what changed
- why it changed
- what is waiting now
- what code line this corresponds to
- what the broader execution shape looks like

## Primary User Behavior

The user:

- opens the app only when deeply confused
- uses almost only the visualization
- reads step narration, not long prose
- sometimes loads custom input from a failed whiteboard attempt
- often wants multiple approaches because interview questions may ask for them

## Why This Rebuild Exists

The earlier product was not precise enough as an implementation system.
Main reasons for the rebuild:

- primitives were not designed as a coherent system
- some visualizations became too tall, too sparse, or too hard to trust
- steps often skipped learner-visible micro-transitions or did too much work at once
- important state could be visually lost even when the algorithm was technically correct
- the shell was still too docs-oriented for real usage
- AI-generated first attempts were often wrong, and the learner could not reliably validate them
- the architecture did not make correctness and pedagogical integrity easy to prove

## Product Thesis

This project must be:

- visualization-first
- confusion-first
- AI-authored but verification-gated
- pedagogically verified, not only algorithmically verified
- desktop-study-optimized
- built as a Vite React app with `shadcn/ui` for shell and controls
- rendered through DOM plus SVG plus Motion for animated lesson visuals

## Chosen Stack Summary

- Vite
- React 19
- TypeScript 5
- React Router 7
- Tailwind CSS v4
- shadcn/ui with `base-nova`
- motion / motion-react
- Zustand
- Zod
- Shiki
- fine-grained, lazy client loading for syntax highlighting so the player does not pay the full highlighter cost on first paint
- d3-hierarchy
- Vitest
- React Testing Library
- Playwright

## Current Status

Phase 0 operating docs are defined.
Phase 1 repo bootstrap is complete.
Phase 2 canonical contracts are complete.
Phase 3 runtime core is complete.
Phase 4 primitive foundation is complete.
Phase 5 verification layer is complete.
Phase 6 shell refinement is complete.
Phase 7 author-mode foundation is complete.
Phase 8 flagship lesson expansion is complete.
Phase 9 hardening is now active.

Completed so far:

- greenfield workspace created
- canonical architecture written
- primitive system spec written
- runtime and bootstrap specs written
- architecture reviewed for greenfield completeness
- implementation plan created
- Codex operating rules captured for future chats
- frontend platform and rendering stack decisions made
- Vite app scaffolded at the workspace root
- `shadcn/ui` initialized with Base UI in `base-nova` style
- `components.json` and path aliases aligned to the workspace architecture
- baseline lint, typecheck, unit test, build, and Playwright smoke test wiring added
- canonical lesson, trace, frame, primitive, and verification contracts implemented in code
- typed lesson registry and placeholder content lesson registry added
- registry contract tests added and passing
- first end-to-end lesson runtime path implemented with loader, trace, projector, verification, player state, code highlighting, and author review surfaces
- Phase 3 verification gate passing for typecheck, lint, unit tests, and production build
- primitive foundation completed: semantic tone mapping, shared primitive shell, shared SVG edge layer, deterministic tree and call-tree layouts, pointer chips, and stateless `ArrayView`, `StateView`, `StackView`, `HashMapView`, `TreeView`, `CallTreeView`, `CodeTraceView`, and `NarrationView` renderers
- primitive coverage now also includes stateless `SequenceView`, `QueueView`, and `GraphView` renderers, so deque and frontier lessons can use first-class primitives instead of page-local markup
- runtime shell now renders canonical primitives instead of the debug preview widget
- primitive renderer tests added and passing
- runtime verification completed: semantic/frame/code-line/pedagogical/viewport checks run before learner mode is shown
- author review now surfaces frame checks and related verification issues instead of only aggregate counts
- flagship binary-search runtime is locked to a checked-in JSON golden under `content/lessons/binary-search/approaches/iterative/goldens`
- binary-search projection was tightened so early frames and compare/decision frames now produce distinct learner-visible changes instead of relying on narration-only differences
- shell refinement completed: the top slab is now a denser instrument bar, the stage reads as one dominant surface, and the docked context column is visually subordinate but still synchronized
- responsive shell behavior was tightened so the top header and badges no longer collapse into broken narrow-column layouts on mobile-width screens
- Phase 7 author-mode foundation shipped: author review now exposes event payloads, snapshots, adjacent frame diffs, narration bindings, and grouped verification issues on the same runtime state
- learner mode is now blocked behind a verification overlay when a lesson fails checks, instead of showing plausible but untrusted visuals
- Phase 8 started with a second flagship lesson: House Robber is now implemented as a registered, verified rolling-DP lesson with presets, lesson-specific verification, and a checked-in golden under `content/lessons/house-robber/approaches/rolling-dp/goldens`
- Phase 8 now includes a recursion-first flagship lesson: Maximum Depth of Binary Tree is implemented as a registered, verified recursive DFS lesson with structural tree, call-stack, and execution-tree views plus a checked-in golden under `content/lessons/maximum-depth/approaches/recursive-dfs/goldens`
- Phase 8 now includes a frontier-traversal flagship lesson: Graph BFS Frontier is implemented as a registered, verified queue-based BFS lesson with graph, queue, and traversal-state views plus a checked-in golden under `content/lessons/graph-bfs/approaches/queue-bfs/goldens`
- Phase 8 now includes a dense-window flagship lesson: Sliding Window Maximum is implemented as a registered, verified monotonic-deque lesson with array, sequence, and window-state views plus a checked-in golden under `content/lessons/sliding-window-maximum/approaches/monotonic-deque/goldens`
- Phase 8 now includes a memoization flagship lesson: Coin Change Memo DFS is implemented as a registered, verified memoized recursion lesson with call-tree, call-stack, and memo-table views plus a checked-in golden under `content/lessons/coin-change/approaches/memo-dfs/goldens`
- Phase 8 now includes a priority-structure flagship lesson: Heap Top K is implemented as a registered, verified min-heap lesson with heap tree, input scan, and threshold state views plus a checked-in golden under `content/lessons/heap-top-k/approaches/min-heap/goldens`
- Phase 8 now includes the explicit stack-execution flagship lesson: Tree DFS Traversal with Stack is implemented as a registered, verified iterative preorder lesson with tree, stack, and visit-order views plus a checked-in golden under `content/lessons/tree-dfs-traversal/approaches/iterative-stack/goldens`
- Phase 9 hardening has started with a shared binary-tree-array model utility and direct tests, replacing duplicated tree-building logic across the maximum-depth and tree-dfs-traversal lessons while also catching disconnected descendants beneath null parents
- Phase 9 now also hardens the client bundle: code highlighting is lazy-loaded through a fine-grained Shiki path, the primitive audit harness is on-demand, lesson content is chunked separately, and the production build no longer emits oversized chunk warnings
- all current flagship lessons use TypeScript code templates, so the client bundle only ships TypeScript highlighting; other lesson languages currently fall back to plain text until they are explicitly added back as a verified bundle decision
- Phase 9 now replaces the stale scaffold smoke test with real Playwright runtime coverage for learner-mode load, author-mode inspection, lesson and preset switching, and custom-input parse-failure surfacing
- Phase 9 now adds a broader Playwright lesson matrix across all eight flagship lessons plus alternate-preset coverage for memoization, priority-structure, and stack-execution lessons
- Coin Change verification was hardened so impossible-target presets no longer fail for lacking a `remainder 0` base case; terminal-state checks now only require learner-visible outcomes that actually occur in the trace
- Phase 9 now adds explicit desktop viewport and playback-behavior QA, covering no-page-scroll flagship presets plus deterministic stepping through pointer controls, keyboard shortcuts, and timeline scrubbing
- Phase 9 now verifies dense presets at the shell-region level: stage and context columns stay within the desktop viewport contract, author review remains docked, and the secondary primitive stack is capped so code/reference space never collapses to zero height
- Phase 9 now verifies primitive-level fit for the tallest primary renderers: tree, call-tree, and heap canvases expose stable test anchors and are checked to stay fully visible inside their own shells on dense desktop presets
- Phase 9 now adds successful custom-input replay QA across the full flagship set: valid custom inputs rebuild verified runtime state without reload in store tests and Playwright, while parse failures still surface live in the player
- Phase 9 has started the shadcn shell audit: custom input now uses the shared dialog primitives with an accessible dialog contract and keyboard dismissal instead of a hand-rolled overlay
- Phase 9 now adds clickable author-review navigation on the live runtime state: authors can step to previous or next frames from the drawer and jump directly from referenced issues to the linked frame or event
- Phase 9 now deepens the author audit workflow on the same runtime state: the drawer exposes an issue inbox with filters, a full frame-backed event timeline, and primitive-focus controls that highlight the matching live stage view
- Phase 9 now completes the remaining blocker-shell audit: learner-mode verification failures render through the shared dialog shell instead of a custom overlay, while still forcing authors into the same runtime-backed inspection workflow
- Phase 9 now restores a sharper shell contract: lightweight code-state panels stay beside narration and code in the left support column, while stacks, queues, memo tables, outputs, and other execution visuals render inside the right-stage composition with the primary visual
- Phase 9 now introduces a command-driven shell pass: the lesson picker moved to a command palette trigger, hotkeys are defined through shared app commands instead of scattered callbacks, and the old learner-facing `Author` label is now presented as `Audit` to make the QA purpose explicit
- Phase 9 now replaces the bare preset dropdown with a richer preset studio: verified scenarios open in a dedicated dialog with descriptions, input snapshots, sticky run actions, and an in-place path into custom input
- shortcut presentation is now centralized through the shared `Kbd` contract, so combinations render as one chip like `Ctrl + K` while alternative bindings render as separate chips like `Left / A`
- the player now ships one projection mode only: `full`; mode switching has been removed from the shell, command palette, and persisted preferences
- lesson view weighting now has a shared authoring contract: approach `requiredViews` and projector viewport roles can be derived from one view-spec definition instead of drifting apart across lesson files
- Maximum Depth of Binary Tree now treats the recursive execution tree as the primary teaching surface, while the structural binary tree stays visible only as supporting context
- a first motion contract now exists in the canonical docs, and the initial runtime pilot is Binary Search: pointer travel, active code-line handoff, and code-state value commits are now animated under reduced-motion-safe rules
- runtime verification now includes a pointer-continuity guard, and House Robber has been corrected so its index pointer stays visible and moves instead of blinking out between steps
- the motion pilot now covers the first recursion lesson too: Maximum Depth animates execution-tree call nodes, stack push/pop handoff, and return-value commitment so recursive flow is legible without relying on static status changes alone
- shared pointers are no longer rendered as bordered chips; the runtime now uses an arrow-based pointer primitive with directional mount/move animation and shared movement memory across array and sequence views

## Immediate Next Step

Continue Phase 9 from the plan:

1. start the hardening pass now that all eight flagship lesson families are implemented and verified
2. prioritize visual QA, viewport QA, and custom-input QA across the expanded lesson set before adding more breadth
3. retune dense lesson stage composition now that execution visuals share the stage while code-state panels stay beside code
4. continue the remaining visual hardening pass across flagship lessons now that the non-visual shell audit is complete

## Canonical Files

Read these before making major changes:

- `CODEX.md`
- `docs/VISUALIZATION_FIRST_ARCHITECTURE.md`
- `docs/PRIMITIVE_SYSTEM_SPEC.md`
- `docs/RUNTIME_PLAYER_SPEC.md`
- `docs/BOOTSTRAP_SPEC.md`
- `docs/VISUALIZATION_CREATION_PROTOCOL.md`
- `plans/IMPLEMENTATION_PLAN.md`
