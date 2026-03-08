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
Phase 8 flagship lesson expansion is now active.

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
- flagship binary-search focus mode is locked to a checked-in JSON golden under `content/lessons/binary-search/approaches/iterative/goldens`
- binary-search projection was tightened so early frames and compare/decision frames now produce distinct learner-visible changes instead of relying on narration-only differences
- shell refinement completed: the top slab is now a denser instrument bar, the stage reads as one dominant surface, and the docked context column is visually subordinate but still synchronized
- responsive shell behavior was tightened so the top header and badges no longer collapse into broken narrow-column layouts on mobile-width screens
- Phase 7 author-mode foundation shipped: author review now exposes event payloads, snapshots, adjacent frame diffs, narration bindings, and grouped verification issues on the same runtime state
- learner mode is now blocked behind a verification overlay when a lesson fails checks, instead of showing plausible but untrusted visuals
- Phase 8 started with a second flagship lesson: House Robber is now implemented as a registered, verified rolling-DP lesson with presets, lesson-specific verification, and a checked-in focus golden under `content/lessons/house-robber/approaches/rolling-dp/goldens`
- Phase 8 now includes a recursion-first flagship lesson: Maximum Depth of Binary Tree is implemented as a registered, verified recursive DFS lesson with structural tree, call-stack, and execution-tree views plus a checked-in focus golden under `content/lessons/maximum-depth/approaches/recursive-dfs/goldens`
- Phase 8 now includes a frontier-traversal flagship lesson: Graph BFS Frontier is implemented as a registered, verified queue-based BFS lesson with graph, queue, and traversal-state views plus a checked-in focus golden under `content/lessons/graph-bfs/approaches/queue-bfs/goldens`
- Phase 8 now includes a dense-window flagship lesson: Sliding Window Maximum is implemented as a registered, verified monotonic-deque lesson with array, sequence, and window-state views plus a checked-in focus golden under `content/lessons/sliding-window-maximum/approaches/monotonic-deque/goldens`
- Phase 8 now includes a memoization flagship lesson: Coin Change Memo DFS is implemented as a registered, verified memoized recursion lesson with call-tree, call-stack, and memo-table views plus a checked-in focus golden under `content/lessons/coin-change/approaches/memo-dfs/goldens`
- Phase 8 now includes a priority-structure flagship lesson: Heap Top K is implemented as a registered, verified min-heap lesson with heap tree, input scan, and threshold state views plus a checked-in focus golden under `content/lessons/heap-top-k/approaches/min-heap/goldens`

## Immediate Next Step

Continue Phase 8 from the plan:

1. add the next flagship lesson that exercises a remaining confusion family beyond memoization reuse, recursion, rolling state, and frontier traversal
2. finish Phase 8 by adding the remaining explicit tree DFS traversal lesson with a visible call stack, since priority-structure is now covered by Heap Top K
3. keep every new lesson on the same verification bar: runtime checks, lesson-specific verification, and checked-in JSON goldens
4. use Heap Top K, Coin Change, Sliding Window Maximum, House Robber, Maximum Depth, and Graph BFS as the templates for how new flagship lessons should be registered and hardened

## Canonical Files

Read these before making major changes:

- `CODEX.md`
- `docs/VISUALIZATION_FIRST_ARCHITECTURE.md`
- `docs/PRIMITIVE_SYSTEM_SPEC.md`
- `docs/RUNTIME_PLAYER_SPEC.md`
- `docs/BOOTSTRAP_SPEC.md`
- `docs/VISUALIZATION_CREATION_PROTOCOL.md`
- `plans/IMPLEMENTATION_PLAN.md`
