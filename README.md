# Greenfield Workspace

This folder is the standalone workspace for the new algorithm visualization app.

This app is a dark, desktop-first, visualization-heavy study tool for hard problems.
It is built for the moment when the learner is stuck and needs step-by-step visual execution, narration, and code synchronization.
The shell and controls system should be built with `shadcn/ui` on the `base-nova` preset.

Start here:
- `AGENTS.md` - new-chat entrypoint and operating summary
- `CODEX.md` - Codex operating rules for this workspace
- `PROJECT_CONTEXT.md` - what the old product was, what the new app should feel like, current status
- `docs/VISUALIZATION_FIRST_ARCHITECTURE.md` - target product and technical architecture
- `docs/PRIMITIVE_SYSTEM_SPEC.md` - canonical primitive anatomy, pointer system, semantic states, and composition rules
- `docs/PRIMITIVE_VISUAL_SPEC.md` - canonical visual grammar for primitive sizing, spacing, orientation, and continuity
- `docs/RUNTIME_PLAYER_SPEC.md` - runtime, playback, synchronization, and author-mode contract
- `docs/BOOTSTRAP_SPEC.md` - exact project initialization commands and setup checks
- `docs/VISUALIZATION_CREATION_PROTOCOL.md` - exact workflow for creating a new lesson or skill-driven visualization
- `plans/IMPLEMENTATION_PLAN.md` - execution plan for the rebuild

This workspace is intended to stand on its own as the real project.
Phase 0 through Phase 6 are complete: the docs are in place, the repo root contains the working Vite + `shadcn/ui` Base UI scaffold, the canonical lesson/runtime contract layer is implemented in code, one lesson runs end to end through the runtime player, the primitive foundation includes canonical array, state, stack, hash-map, tree, call-tree, code-trace, and narration renderers with shared edge/layout infrastructure, the verification layer blocks bad runtime output while locking the flagship binary-search flow to a checked-in JSON golden, and the shell now behaves like a compact visualization-first instrument across desktop and narrow mobile widths.
