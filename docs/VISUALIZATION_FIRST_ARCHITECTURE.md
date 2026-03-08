# Visualization-First Architecture

## Purpose

This document defines the target product and technical architecture for the greenfield rebuild.

It is a from-scratch system design for the real app workspace.
There is no dependency on another repo or on preserving an older implementation.

## Product Job

This app exists for one moment:

- the learner is stuck
- whiteboard reasoning broke down
- normal explanations are not enough
- the algorithm must be made concrete, step by step, with no ambiguity

So the product is not a general algorithm education site.
It is a visualization system for when normal explanations fail.

## Product Shape

The app should feel like a focused study instrument, not a content website.

On desktop, the default lesson experience should look like:

- a compact top bar
- one dominant central visualization surface
- synchronized secondary panels only when they improve understanding
- narration anchored close to the active step
- code trace docked into the same surface as the visualization
- a command palette entry point for task and shell actions instead of a dense row of global selectors
- dark theme, low chrome, and minimal wasted space

A learner opening a lesson should immediately understand:

- what changed
- why it changed
- what is waiting now
- what code line is active
- what the broader execution picture looks like

Synchronized views should not feel like unrelated panels.
They should feel like technical drawings of the same execution state from
different angles.

## Core Constraints

### Visualization-first

The learner comes for the visualization, not the prose.
The visualization canvas is the page.
Everything else is supporting infrastructure.

### AI-driven authoring

The first artifact is usually AI-generated.
The architecture must assume first-pass output is often wrong.
The learner cannot be the primary validator because they are using the product at the point of confusion.

### Verification-gated trust

The system must make it hard to ship a lesson that looks convincing but is semantically wrong.
Correctness must be checked before trust is asked from the learner.

### Pedagogical integrity

Algorithmic correctness is necessary but not sufficient.
A lesson can still fail as a teaching artifact even when the algorithm output is right.

The system must block lessons that:

- skip learner-visible micro-steps
- hide important state transitions
- collapse multiple visual changes into one frame
- lose waiting relationships or return relationships
- make the active object or code line visually ambiguous

## Frontend Platform Decision

The greenfield app should be bootstrapped as a **Vite React TypeScript app**.

Use `shadcn/ui` from the start for the non-visualization UI layer.
That means:

- bootstrap the workspace with the `vite` template through the `shadcn` CLI
- use `shadcn/ui` for shell, controls, forms, overlays, panels, tabs, and utility UI
- keep algorithm visualization primitives custom and domain-specific
- do not try to force core data-structure visuals into generic `shadcn` components

`shadcn/ui` is the application UI system.
It is not the visualization primitive system.

## Technology Stack

### Core app platform

- package manager: `npm`
- bundler and dev server: `Vite`
- framework: `React 19`
- language: `TypeScript 5`
- routing: `React Router 7`

### UI and styling

- `Tailwind CSS v4`
- `shadcn/ui` with the Base UI-backed `base-nova` style
- `Base UI` primitives through `shadcn/ui`
- `lucide-react` for iconography
- CSS variables for semantic design tokens

### Visualization rendering

- `React DOM` for nodes, cells, cards, stacks, tables, and overlays
- `SVG` overlay layer for edges, arrows, connectors, and graph links
- `motion` / `motion/react` for node movement, color transitions, pointer motion, fades, and layout animations
- native `ResizeObserver` for measured layouts where node dimensions affect positioning

### State and data modeling

- pure TypeScript modules for lesson definitions, tracing, projection, and verification
- `Zustand` for player state, shell state, and author-mode inspection state
- `Zod` for lesson schema validation, preset parsing, and custom input parsing

### Code rendering and narration

- `Shiki` for syntax highlighting of learner-facing code templates
- syntax highlighting should be loaded through a fine-grained lazy bundle instead of the default all-language client bundle
- if a client language is not explicitly bundled for the current lesson set, code should fall back to readable plain text instead of bloating the runtime
- custom line metadata for active line, waiting line, and returned-line emphasis
- narration generated from frame-bound payloads, not ad hoc prose

### Testing and QA

- `Vitest` for trace, projection, and verification tests
- `React Testing Library` for player and primitive integration tests
- `Playwright` for end-to-end playback, custom input, and author-mode flows
- structured JSON goldens for flagship lesson traces and frames
- optional screenshot diffs later for visual hardening, but not as the primary correctness layer

### Persistence and local-only features

- `localStorage` for recent inputs, selected approach, selected mode, and lightweight user preferences
- no backend in MVP

### Linting and formatting

- `ESLint`
- `Prettier`

## User Requirements

### Primary workflow

- open the app only when confused on a hard concept or problem
- jump directly to the visualization
- use step narration heavily
- sometimes load custom input from a failed whiteboard attempt
- often compare multiple approaches because interviews may ask for them

### What makes a visualization useful

- exact state is unambiguous
- hidden execution becomes visible
- waiting relationships are visible
- the step follows the One Visual Change rule
- narration explains why the change happened
- the right synchronized views are present for the problem
- the visualization has no visual lies, no missing state, and no ambiguous transitions
- the same important execution object is recognizable across views

### Confusion types the system must support

1. local-step confusion
2. execution-flow confusion
3. state-meaning confusion
4. whole-picture confusion
5. code-construction confusion

## Success Criteria

The product is succeeding when a flagship lesson can do all of the following:

- each learner-visible step maps to one semantic event and one real code line
- each learner-visible step performs exactly one visual change category
- the active state is obvious in under one second
- the learner can track what is waiting for what
- important state never disappears without an explicit visual representation of where it went
- the learner can switch between focused and broader understanding modes without losing context
- custom input can be replayed without breaking the mental model
- the default desktop experience avoids unnecessary scrolling during normal playback
- author mode can explain why the visualization is both correct and pedagogically safe

## Scope And Non-Goals

### MVP scope

- visualization runtime
- primitive library
- lesson schema
- AI authoring workflow
- verification and author mode
- visualization-first shell
- 8 flagship lessons across the main confusion types

### Explicit non-goals for MVP

- long prose-heavy teaching pages
- account system
- collaboration
- SaaS billing
- generic CMS
- broad gamification
- compare mode in the first MVP cut

## System Overview

The app is built from 6 systems.

### 1. Lesson System

Owns typed lesson definitions.
A lesson declares:

- learning objective
- confusion type
- approaches
- input parser
- presets
- required synchronized views
- code template
- narration strategy
- verification expectations

### 2. Trace Engine

Owns semantic algorithm execution.
It converts parsed input and approach code into typed events.

Responsibilities:

- deterministic event generation
- event invariants
- variable snapshots
- scope and frame transitions
- mutation events
- return and result events

### 3. Projection Engine

Owns translation from semantic events to learner-visible frames.

Responsibilities:

- enforce One Visual Change
- bind frames to code lines
- produce primitive states
- produce narration payloads
- preserve state continuity between adjacent frames
- make hidden state transitions explicit instead of silently dropping them
- support mode-specific projections such as `focus`, `full`, and `code`

### 4. Visualization Runtime

Owns playback and synchronized rendering.

Responsibilities:

- play, pause, step, reset, scrub
- render all synchronized primitives from a frame
- preserve pointer continuity
- support custom input replay
- support approach switching
- keep transitions fast and deterministic

### 5. Primitive System

Owns the reusable data-structure and code views.
Primitives are stateless renderers with strict contracts.

Core primitives:

- `ArrayView`
- `SequenceView`
- `StackView`
- `QueueView`
- `HashMapView`
- `TreeView`
- `CallTreeView`
- `GraphView`
- `CodeTraceView`
- `StateView`
- `NarrationView`

Critical distinctions:

- `TreeView` is for structural trees
- `CallTreeView` is for recursive execution
- `GraphView` is for arbitrary graph and DAG relationships
- `shadcn/ui` components should wrap and compose these primitives, not replace them

### 6. AI Authoring And Verification System

This is a first-class product system, not a tooling afterthought.

Responsibilities:

- scaffold lessons from the lesson schema
- enforce required views for each confusion type
- generate trace and projection skeletons
- generate state-bound narration templates where possible
- run self-audits
- expose author mode
- block or warn on unverifiable lessons
- block lessons that are semantically correct but pedagogically unsafe

## Visualization Rendering Strategy

This is how the app should actually create animated algorithm visuals.

### Rendering model

- render data nodes, cells, panels, and frames as normal React components in the DOM
- render edges and connectors in an SVG layer positioned behind or above the node layer
- keep all positions in explicit coordinates owned by the layout engine or projector
- animate between frame states using `motion`, not imperative DOM mutation

### Why this model

- DOM components are better for text-heavy nodes, tables, stacks, badges, and accessible labels
- SVG is better for arrows, paths, graph edges, and highlighted connectors
- this split gives precise control without forcing the entire system into canvas or an off-the-shelf graph library

### Layout strategy by primitive family

- arrays, stacks, queues, and hash maps: manual deterministic layout using CSS grid or flex plus explicit measurement where needed
- structural trees: `d3-hierarchy` for deterministic hierarchical layout
- execution trees: custom layered layout tuned for focus-path teaching, not generic graph prettiness
- arbitrary graph lessons: custom positioned presets first; `dagre` or `elkjs` only if generic graph layout becomes necessary later

### Animation strategy

- each frame is declarative and complete
- `motion` animates node position, opacity, color, scale, and pointer movement between frames
- edges animate stroke color, opacity, and path changes between frames
- no hidden implicit transitions; every visible change must correspond to the frame diff and the declared visual change type

## End-To-End Flow

1. Define lesson and approach metadata.
2. Parse preset or custom input.
3. Generate typed semantic events in the trace engine.
4. Validate event invariants.
5. Project events into learner-visible frames.
6. Validate frame-to-code mapping, One Visual Change, and state continuity.
7. Generate narration from frame-bound state.
8. Review the lesson in author mode.
9. Expose the verified lesson in learner mode.

## Canonical Contracts

These are the minimum contracts the implementation must honor.

```ts
interface LessonDefinition {
  id: string
  slug: string
  title: string
  confusionType: ConfusionType
  shortPatternNote: string
  approaches: ApproachDefinition[]
  defaultApproachId: string
  defaultMode: VisualizationMode
  viewportContract: ViewportContract
}

interface ApproachDefinition {
  id: string
  label: string
  codeTemplate: CodeTemplate
  parseInput: (raw: string) => ParsedInput
  presets: PresetDefinition[]
  requiredViews: RequiredView[]
  trace: (input: ParsedInput) => TraceEvent[]
  project: (events: TraceEvent[], mode: VisualizationMode) => Frame[]
  verify?: (events: TraceEvent[], frames: Frame[]) => VerificationReport
}

interface TraceEvent {
  id: string
  type: TraceEventType
  codeLine: string
  scopeId?: string
  payload: Record<string, unknown>
  snapshot: VariableSnapshot
}

interface Frame {
  id: string
  sourceEventId: string
  codeLine: string
  visualChangeType: VisualChangeType
  narration: NarrationPayload
  primitives: PrimitiveFrameState[]
  checks: FrameCheck[]
}

interface VerificationReport {
  isValid: boolean
  errors: VerificationIssue[]
  warnings: VerificationIssue[]
}
```

Key rules:

- pages do not own lesson logic
- pages compose a lesson player around lesson definitions
- trace is semantic
- projection is visual
- primitives render state only
- verification runs on semantic and projected outputs

## Primitive Contract Rules

Every primitive must support the subset of capabilities it actually needs, but the system-wide model is:

- stable ids
- pointers
- highlights
- annotations
- edge highlights where relevant
- compact and default variants where relevant
- empty state handling
- deterministic layout inputs

Global rules:

- a primitive must never infer semantic meaning from styling alone
- layout must be derived from actual rendered dimensions or declared dimensions, not hidden assumptions
- repeated states should support compact representation when full-size rendering harms comprehension
- pointer continuity beats ornamental animation

Execution-token identity is a separate layer from primitive-local tone.
That means:

- token identity answers which execution object the learner is tracking
- primitive-local highlight tone answers what local state that visual element is in
- multiple views should be able to project the same token identity without becoming visually identical widgets

## Application UI Rules

For app-level UI, follow `shadcn/ui` conventions:

- use `shadcn/ui` components before custom markup for controls and shell UI
- use semantic tokens and variants, not ad hoc color classes
- use composition, not one-off wrappers for standard controls
- keep forms, tabs, dialogs, drawers, alerts, empty states, and loading states inside the `shadcn/ui` system where possible

This rule applies to the shell and utility UI, not to the algorithm primitives themselves.

## Visualization Mode

The current product ships one projection mode only: `full`.

The runtime still projects semantic traces into learner-visible frames,
but mode switching is no longer part of the learner shell, command palette,
or persisted preferences.

## Required Synchronized Views By Lesson Type

### Pointer-state lessons

Must emphasize:

- exact pointer positions
- movement legality
- comparisons
- invariant text

### Stack-execution lessons

Must emphasize:

- current frame
- waiting frames
- current code line
- return flow

When the lesson is about recursive flow, aggregation, or return propagation, the execution tree should usually be the primary teaching surface.
The original structural tree may stay visible as supporting context, but it should not outrank the execution model unless the structure itself is the learner's main confusion.

### Memoization-reuse lessons

Must emphasize:

- execution tree or focused call tree
- recursion stack
- memo table
- code line
- current return value or candidate value

### Structural-mutation lessons

Must emphasize:

- before and after structure state
- mutation target
- affected links or edges
- result state

## Content And Verification Decisions

These decisions are fixed for MVP so implementation does not drift.

- lessons are authored as TypeScript modules, not MDX
- short notes stay close to lesson files as data, not as long markdown pages
- golden verification uses structured JSON first
- screenshot-based visual regression is a hardening layer later, not the source of truth
- the MVP flagship set is fixed at 8 lessons before expansion
- verification must check pedagogical integrity, not only algorithmic output

## MVP Flagship Lessons

1. binary search
2. sliding window maximum
3. tree DFS traversal with call stack
4. subtree depth-style recursion problem
5. coin change memo DFS
6. house robber state transition
7. graph BFS frontier
8. heap-based top-k

## Visualization-Only Shell

The shell must be designed for high-intensity study, not editorial reading.

Default desktop composition:

- compact top utility bar
- dominant central visualization stage that holds both primary and secondary synchronized primitives
- a narrower support column for narration, code trace, compact code-state panels, and lightweight runtime status
- short narration near the active flow
- code trace docked beside, not inside, the main stage
- almost no decorative whitespace that pushes meaning off-screen

Shell rules:

- horizontal space is an asset and should be used aggressively
- vertical sprawl is a product bug
- the active state should stay near the visual center
- archived or low-importance states should be compacted
- structural and execution-oriented secondary views belong inside the stage composition, not the support column
- compact code-state panels may stay beside narration and code when that keeps variable state tightly coupled to the active line
- dense stage-side secondary stacks must be compacted before they can starve the narration or code/reference column
- the learner should rarely need to scroll during normal preset playback on desktop

## Cross-View Execution Objects

The product should treat important execution objects as shared semantic tokens.

Examples:

- `lo`
- `hi`
- `mid`
- `i`
- `front`
- `curr`

These tokens are not owned by the stage.
They may appear in:

- pointer overlays in the stage
- state or code-status rows
- narration text
- later, code trace and audit tooling

The user should recognize them as the same object across these views.

This is the architectural reason pointer work should not remain a pointer-only refactor.

## Pointer Projection Architecture

Pointers are one spatial projection of shared execution tokens.

The chosen rendering direction is:

- execution token identity is shared across synchronized views
- pointers are overlay-rendered against primitive-owned anchors
- primitive renderers own geometry
- the pointer layer owns spatial pointer rendering and motion
- pointer overlays must not perturb layout

The first rollout should be compatibility-based:

- keep current `PointerSpec` authoring
- derive token identity from that contract internally
- migrate array and sequence views first
- use Binary Search as the first cross-view token pilot

This is intentionally more grounded than the older iterative app:

- no lesson-owned geometry hacks
- no pointer rows as the architectural model
- no view-local color meanings pretending to be shared semantics
- no undocumented coupling between pointer rendering and content layout

## Motion Contract

Motion is explanatory, not decorative.
It exists to make the adjacent-frame change legible when the learner is already confused.

Global motion rules:

- every animation must answer "what changed?"
- each frame gets one dominant motion event; supporting fades and color transitions may exist, but they must not compete with it
- motion is adjacent-frame only; the runtime does not invent catch-up movement across hidden state
- autoplay does not skip motion-important intermediate frames
- no ambient looping, bouncing, or theatrical spring motion on learner-facing primitives

Motion layers:

- shell motion: dialogs, drawers, tooltips, and command surfaces use short standard transitions
- stage motion: primitives explain movement, promotion, commitment, and return flow
- emphasis motion: a brief pulse, settle, or highlight shift may confirm a change, but should not become a second primary animation

Default timing scale:

- shell micro transitions: `120-200ms`
- highlight and color transitions: `160-220ms`
- pointer travel: `220-320ms`
- layout and node moves: `260-360ms`

Accessibility rule:

- `prefers-reduced-motion` disables travel-heavy motion and keeps only low-travel fades and color changes needed to preserve state continuity

Initial flagship interpretation:

- Binary Search should animate pointer travel, candidate-cell emphasis, code-line handoff, and code-state value commits
- recursion, memoization, and aggregation lessons should later animate stack push/pop, active call promotion, and return-value commitment using the same timing scale

### Viewport hint contract

Each primitive declares `PrimitiveViewportSpec` in its lesson `project.ts`:

- `role`: routes the primitive to a region — `"primary"` → stage center, `"secondary"`/`"tertiary"` → stage sidebar, `kind === "state"` → left support column.
- `preferredWidth`: ideal width in px (900–980 primary, 280–420 secondary). Declared for every primitive in lesson data. Not yet consumed for dynamic column sizing but available for future use.
- `minHeight`: minimum height constraint.

The `splitPrimitives()` function in `lesson-player.tsx` reads `role` and `kind` to route primitives to regions.

Lesson authors should not hand-duplicate view roles across lesson metadata and projector code.
Each approach should define one shared view-spec list that contains:

- required-view metadata (`id`, `primitive`, `role`, `title`)
- viewport metadata (`preferredWidth`, `minHeight`, and runtime `role`)

The lesson definition derives `requiredViews` from that list, and the projector reads the same list when assigning primitive viewport roles.
This avoids drift where a lesson claims one primary teaching surface in metadata but renders another one as the primary stage surface at runtime.

### View rendering categories

Views fall into two categories that affect layout behavior:

**Canvas views** (tree, call-tree, graph) — use absolute positioning on a computed-size div. They have intrinsic minimum widths (300–360px). They handle horizontal overflow internally via `overflow-x-auto`. These are listed in the `CANVAS_KINDS` set in `lesson-player.tsx`. Adding a new canvas-based kind requires adding it to this set.

**Flow views** (array, sequence, stack, queue, hash-map) — use CSS flex/grid with content-driven sizing. They compress naturally into narrow columns without breaking.

When a canvas view appears in the secondary column, the stage switches from a narrow sidebar (`16–22rem`) to a proportional split (`1.2fr : 1fr`) so the canvas gets enough width.

### Extending the system

Adding a new primitive kind:

1. Define the view in `src/shared/visualization/views/` — own its cell sizing and internal overflow.
2. Register in `PrimitiveRenderer` — add a case to the switch.
3. Declare viewport hints in lesson `project.ts` — set `role`, `preferredWidth`, `minHeight`.
4. If the view is canvas-based (absolute positioning, intrinsic min width) → add the kind to `CANVAS_KINDS` in `lesson-player.tsx`.
5. No other layout changes needed. The stage composition adapts automatically.

## Workspace Structure

```txt
README.md
AGENTS.md
CODEX.md
PROJECT_CONTEXT.md
index.html
package.json
vite.config.ts
tsconfig.json
src/
  main.tsx
  app/
    providers/
    router/
    layouts/
  domains/
    lessons/
    tracing/
    projection/
    verification/
  entities/
    visualization/
    lesson/
  features/
    player/
    author-mode/
    custom-input/
    approach-switching/
  widgets/
    lesson-player/
    author-review/
  shared/
    ui/
    lib/
    config/
components.json
content/
  lessons/
    <slug>/
      lesson.ts
      presets.ts
      approaches/
        <approach>/
          code.ts
          trace.ts
          project.ts
          verify.ts
          notes.ts
      goldens/
        trace.json
        frames.json
docs/
  VISUALIZATION_FIRST_ARCHITECTURE.md
  VISUALIZATION_CREATION_PROTOCOL.md
plans/
  IMPLEMENTATION_PLAN.md
```

Notes:

- use Vite as the app runtime and bundler
- keep route wiring thin inside `src/app/router`
- `components.json` is part of the workspace contract because `shadcn/ui` is a chosen system dependency
- lesson definitions, tracing, projection, and verification live below `src/`
- goldens live with the lesson so authoring, verification, and maintenance stay local

## Non-Functional Requirements

### Correctness

- trace generation must be deterministic
- every frame must point back to a source event
- every learner-visible step must map to a code line
- verification failures must be visible in author mode

### Pedagogical integrity

- a frame may express only one visual change category at a time
- important state may not disappear without an explicit archived, completed, or transferred representation
- waiting, active, and returned state must remain visually legible across adjacent frames
- narration must describe the same change the frame is showing, not a larger combined operation
- projection must prefer extra small steps over compressed multi-change steps

### Performance

- step transitions must feel instant on normal flagship presets
- projection and verification should run fast enough for interactive custom input
- primitives should avoid layout jank between adjacent steps
- lesson playback should stay smooth on a common laptop without relying on canvas rendering
- code highlighting must stay off the initial hot path when possible; the visualization runtime should still render usable plain code before async highlighting resolves

### Viewport behavior

- flagship lessons must be optimized for desktop first
- normal presets should avoid scrolling on common desktop widths
- tall primary renderer canvases must fit within their primitive shells on flagship desktop presets, not only within the page viewport
- narrow screens may switch to simplified stacked layouts, but without losing step correctness

### Maintainability

- one canonical contract per subsystem
- no lesson-specific logic hidden inside primitives
- no page-specific layout hacks as the main rendering strategy
- shell-level UI should stay composable through `shadcn/ui` instead of custom one-off controls

## Author Mode And Quality Gates

Author mode, surfaced in the UI as lesson audit, exists because the learner often cannot tell whether the AI is wrong.

Author mode should show:

- source semantic event
- current code line
- full frame-backed event timeline
- previous frame to next frame diff
- invariant checks
- pointer continuity checks
- narration-bound values
- issue filtering across active and global runtime failures
- primitive focus controls that highlight the same live stage primitives the learner sees
- direct navigation back to referenced or adjacent frames and events on the same runtime state
- warning if more than one visual change occurred
- warning if a material state element disappeared without an explicit visual handoff
- warning if narration and visual change classify different learner-visible actions

The shell should not treat hotkeys as component-local callbacks.
Commands should be defined once, then exposed through:

- keyboard shortcuts
- the command palette
- visible footer or shell controls

A lesson is not ready until it passes:

- semantic trace verification
- frame verification
- code-line sync verification
- pedagogical integrity verification
- viewport sanity check
- custom input sanity check
- final-state verification
- golden JSON verification for flagship lessons

## Delivery Phases

### Phase 1: Foundation

- finalize schema and contracts
- scaffold the Vite React workspace
- bootstrap `shadcn/ui` in the workspace
- install the core stack libraries
- establish verification-first development rules

### Phase 2: Runtime Core

- build typed lesson loader
- build trace and projection core
- build playback engine
- build frame verification pipeline
- build pedagogical integrity verification into the same pipeline
- build code tokenization and line metadata pipeline

### Phase 3: Primitive Layer

- build core primitives
- build the SVG edge layer utilities
- build tree and call-tree layout engines
- build code trace and narration views
- build compact and focus-mode capabilities

### Phase 4: Learner Shell

- build the visualization-first desktop shell with `shadcn/ui`
- build input and preset workflow
- build approach and mode switching
- build local persistence for recent inputs and view preferences

### Phase 5: Author System

- build author mode
- build self-audit surfaces
- add golden-step verification for flagship lessons
- add pedagogical failure surfacing for skipped or overloaded steps
- build verification failure surfacing in the UI

### Phase 6: Flagship Lessons

- ship the 8 MVP lessons
- review and refine based on trust, pedagogical integrity, clarity, and speed of understanding

## Final Definition

The correct architecture for this product is:

- visualization-first
- confusion-first
- AI-authored but verification-gated
- pedagogically verified, not only algorithmically verified
- runtime-driven
- primitive-contract-driven
- code-synced
- narration-heavy
- prose-light
- desktop-study-optimized
- Vite React plus `shadcn/ui` for shell and controls
- DOM plus SVG plus Motion for the visualization layer

One-sentence definition:

**A verification-gated visualization system for when normal explanations fail.**
