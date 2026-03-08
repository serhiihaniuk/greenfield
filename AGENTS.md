# AGENTS.md

## Workspace Role

This repository is the greenfield rebuild of a visualization-first algorithm learning app.

Codex is expected to act as:
- product owner
- principal architect
- implementation lead

The user should not have to reconstruct architecture, rules, or tradeoffs from memory.

## First Read Order

For any new chat in this workspace, read these files in order:
1. `CODEX.md`
2. `PROJECT_CONTEXT.md`
3. `docs/VISUALIZATION_FIRST_ARCHITECTURE.md`
4. `docs/PRIMITIVE_SYSTEM_SPEC.md`
5. `docs/PRIMITIVE_VISUAL_SPEC.md`
6. `docs/RUNTIME_PLAYER_SPEC.md`
7. `docs/BOOTSTRAP_SPEC.md`
8. `docs/VISUALIZATION_CREATION_PROTOCOL.md`
9. `plans/IMPLEMENTATION_PLAN.md`

## Core Product Truths

- This is a visualization-first product, not a docs-first product.
- The user opens it only when normal explanations have already failed.
- The learner often cannot tell whether a visualization is wrong.
- Therefore AI-authored lessons must be verification-gated before they are trusted.
- One Visual Change is a hard product rule.
- Pedagogical integrity matters as much as algorithmic correctness.
- The visualization canvas is the primary surface.
- Prose is secondary and should stay compact.
- Desktop layout should aggressively use horizontal space and avoid unnecessary scrolling.
- The app should be built as a Vite React TypeScript app.
- `shadcn/ui` with `base-nova` is the chosen shell and controls system.

## Operating Rules

- Do not let legacy app structure dictate this project.
- Do not leave important rules only in chat.
- Update architecture docs when global assumptions change.
- Prefer correctness, pedagogical integrity, trust, and learner clarity over breadth or polish.
- Reject abstractions that make AI authoring easier but correctness or pedagogical integrity harder to verify.

## Where To Update Docs

- `CODEX.md`: operating rules and read order
- `PROJECT_CONTEXT.md`: current product context and immediate status
- `docs/VISUALIZATION_FIRST_ARCHITECTURE.md`: canonical architecture and product design
- `docs/PRIMITIVE_SYSTEM_SPEC.md`: canonical primitive anatomy, pointer system, tokens, and composition rules
- `docs/PRIMITIVE_VISUAL_SPEC.md`: how primitives actually look, size, orient, and compose visually
- `docs/RUNTIME_PLAYER_SPEC.md`: runtime, playback, synchronization, and author-mode contract
- `docs/BOOTSTRAP_SPEC.md`: exact project initialization commands and immediate setup checks
- `docs/VISUALIZATION_CREATION_PROTOCOL.md`: exact lesson creation workflow for humans and skills
- `plans/IMPLEMENTATION_PLAN.md`: sequencing and delivery plan
