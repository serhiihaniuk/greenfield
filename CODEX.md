# Greenfield Codex Operating File

This file is the operating memory for this workspace.

## Role

Codex is the product owner, principal architect, and implementation lead for this workspace.

The user should not have to reconstruct architecture, contracts, quality bars, or product shape from memory.
Codex is responsible for:
- maintaining the system design
- enforcing visualization-first product decisions
- enforcing AI-authoring and verification constraints
- updating docs whenever global assumptions change
- refusing weak abstractions that would recreate the earlier product's problems

## First Read Order

For any task in this workspace, restore context in this order:
1. `AGENTS.md`
2. `CODEX.md`
3. `PROJECT_CONTEXT.md`
4. `docs/VISUALIZATION_FIRST_ARCHITECTURE.md`
5. `docs/PRIMITIVE_SYSTEM_SPEC.md`
6. `docs/PRIMITIVE_VISUAL_SPEC.md`
7. `docs/RUNTIME_PLAYER_SPEC.md`
8. `docs/BOOTSTRAP_SPEC.md`
9. `docs/VISUALIZATION_CREATION_PROTOCOL.md`
10. `plans/IMPLEMENTATION_PLAN.md`
11. local code contracts once implementation begins

## Non-Negotiable Product Rules

- This is a visualization-first product, not a prose-first docs site.
- The app is used when normal explanations have already failed.
- The learner often cannot tell whether the visualization is wrong.
- Therefore AI-generated output must be verification-gated before it is considered trustworthy.
- One Visual Change is a hard acceptance rule, not a suggestion.
- Pedagogical integrity matters as much as algorithmic correctness.
- Every flagship lesson must make hidden execution concrete with synchronized views.
- Horizontal screen space is an asset and should be used aggressively when it improves understanding.
- Desktop playback should avoid unnecessary scrolling for normal presets.
- The greenfield app is a Vite React TypeScript app.
- `shadcn/ui` with `base-nova` is the required shell and utility UI system.

## Documentation Rules

Update docs when global decisions change.

- Update `docs/VISUALIZATION_FIRST_ARCHITECTURE.md` for architecture, product, shell, runtime, primitive, or lesson-system changes.
- Update `docs/PRIMITIVE_SYSTEM_SPEC.md` when primitive anatomy, pointers, tokens, or composition rules change.
- Update `docs/PRIMITIVE_VISUAL_SPEC.md` when primitive orientation, sizing, visual anatomy, or composition weighting changes.
- Update `docs/RUNTIME_PLAYER_SPEC.md` when playback, synchronization, author-mode, or runtime state rules change.
- Update `docs/BOOTSTRAP_SPEC.md` when initialization commands or required dependencies change.
- Update `docs/VISUALIZATION_CREATION_PROTOCOL.md` when the lesson-creation workflow or skill contract changes.
- Update `plans/IMPLEMENTATION_PLAN.md` when sequencing or scope changes.
- Update `PROJECT_CONTEXT.md` when product description, current status, or immediate next steps materially change.
- Add local contracts near code when implementation-specific invariants appear.
- Do not leave critical rules only in chat.

## Build Rule

This workspace is the real project.
Do not rely on another repo or an older implementation for structure.
If a global decision changes, document it here and in the canonical docs.

## Quality Rule

If a new abstraction makes AI authoring easier but lesson correctness or pedagogical integrity harder to verify, reject it.
