# Primitive System Specification

## Purpose

This document defines the canonical design contract for visualization primitives.

The primitive layer is not only a list of components.
It is the system that makes lessons readable, consistent, and trustworthy.

If this document is missing or ignored, the product will drift into one-off visualizations again.

## Primitive System Goals

Every primitive must:
- communicate semantic state clearly
- compose predictably with the lesson shell
- support step-by-step animation without hidden behavior
- expose enough structure for verification and author mode
- stay reusable across many lessons without becoming generic mush

## Primitive Taxonomy

### Structural primitives

- `ArrayView`
- `SequenceView`
- `StackView`
- `QueueView`
- `HashMapView`
- `TreeView`
- `GraphView`

### Execution primitives

- `CallTreeView`
- `CodeTraceView`
- `StateView`
- `NarrationView`

### Shared support layers

- pointer system
- highlight system
- annotation system
- edge layer
- semantic token system
- layout utilities

## Primitive Anatomy

Every primitive should be designed from these conceptual parts.

1. base surface
- the visual shell of the primitive panel
- title, optional subtitle, optional compact legend

2. content layer
- the actual nodes, cells, rows, edges, or lines

3. semantic overlays
- pointers
- highlights
- badges
- annotations
- edge emphasis

4. motion layer
- transitions between adjacent frame states only

5. empty or boundary state
- visually valid output when the primitive has no elements or is in a special boundary condition

## Shared Primitive API Shape

Not every primitive will use every field, but the family contract should be consistent.

```ts
interface PrimitiveFrameState<TData = unknown> {
  id: string
  kind: PrimitiveKind
  title?: string
  subtitle?: string
  data: TData
  pointers?: PointerSpec[]
  highlights?: HighlightSpec[]
  edgeHighlights?: EdgeHighlightSpec[]
  annotations?: AnnotationSpec[]
  layout?: LayoutSpec
  viewport?: PrimitiveViewportSpec
  meta?: Record<string, unknown>
}
```

## Pointer System

Pointers are not the root semantic object.
They are one visual projection of a deeper execution-token system.

### Pointer contract

```ts
interface PointerSpec {
  id: string
  targetId: string
  label: string
  tone: PointerTone
  placement?: PointerPlacement
  priority?: number
  status?: 'active' | 'waiting' | 'done'
}
```

### Pointer rules

- pointer specs are the current compatibility contract for lesson authors
- pointers have stable ids across adjacent frames
- pointers move; they do not disappear unless the semantic model explicitly ends them
- multiple pointers may target the same element
- pointer tone is a compatibility bridge into the shared execution-token visual system
- pointer labels must stay short and algorithm-real when possible: `i`, `j`, `lo`, `hi`, `mid`, `curr`
- pointer placement must be deterministic so the same state renders the same way every time

### Pointer tones

- `primary`
- `secondary`
- `compare`
- `success`
- `error`
- `done`
- `special`

## Execution Token System

Execution tokens are the shared semantic execution objects that the learner should
recognize across synchronized views.

They answer:

- which execution object is this?
- where does it appear in the current frame?
- how should the learner recognize it across stage, state, narration, and code?

Examples:

- `lo`
- `hi`
- `mid`
- `i`
- `j`
- `front`
- `back`
- `curr`
- `best`

An execution token may project into different views as:

- a stage pointer
- a state-row accent
- a narration inline token chip
- a code-trace variable emphasis
- a compact annotation or badge in a structural or execution view

### Token contract

The long-term runtime model should treat tokens as first-class frame-level objects.
The current system may derive them from `PointerSpec` as a compatibility bridge,
but the target architecture is:

```ts
interface ExecutionTokenSpec {
  id: string
  label: string
  role: 'cursor' | 'bound' | 'candidate' | 'active' | 'result' | 'frontier' | 'state-variable'
  style: 'accent-1' | 'accent-2' | 'accent-3' | 'accent-4' | 'success' | 'warning' | 'error' | 'muted'
  status?: 'active' | 'waiting' | 'done'
}
```

### Token rules

- execution token identity is shared across synchronized views
- token identity is not owned by any one primitive
- if the same execution object appears in multiple views, those views should render the same token identity
- token continuity across adjacent frames matters even when its view projection changes
- token style is shared across views; representation is view-specific

## Pointer As Token Projection

A pointer is one spatial projection of an execution token onto a primitive target.

That means:

- token identity is the semantic source of truth
- pointer overlay is the spatial rendering of that token
- pointer continuity is token continuity expressed through motion

The system should eventually model this as:

```ts
interface PointerProjection {
  tokenId: string
  targetId: string
  placement?: PointerPlacement
  priority?: number
}
```

The current `PointerSpec` remains the authored compatibility contract until the
token registry is promoted into runtime frame data.

## Token Identity Vs Primitive Semantic Tone

These two concepts solve different problems and must stay separate.

### Token identity answers

- which execution object is this?
- how should the learner recognize it in other views?

### Primitive semantic tone answers

- what state is this visual element in right now?
- is it active, compared, found, memoized, done, base, or dim?

Example:

- token `mid` may use a shared token style such as `accent-2`
- the array cell under `mid` may use highlight tone `compare`
- the state row for `mid` may use token-aware emphasis plus local active styling
- narration may render `mid` as an inline token chip with the same shared identity

Do not collapse these two systems into one color-only abstraction.

## Anchor Contract

Pointer geometry belongs to the renderer layer, not to lesson data.

Primitives should expose renderer-only anchors for pointer-capable targets.
The pointer layer resolves pointer projections against those anchors.

Target architecture:

```ts
interface PointerAnchor {
  targetId: string
  placement: PointerPlacement
  x: number
  y: number
}
```

Rules:

- anchors are internal renderer geometry, not authored lesson data
- primitives own target geometry
- pointer overlays resolve against anchors
- pointer overlays must not perturb layout
- pointer mount, movement, stacking, and exit may not change primitive width or height

## Cross-View Projection Rule

This system should behave like technical drawings:

- multiple projections
- one underlying execution object
- stable recognizable identity across views

So:

- synchronized views are not independent decorations
- they are different projections of the same execution state
- if narration, state, stage, and code all mention the same execution object, they should do so through one shared token identity

This is a hard architectural direction, not an optional polish layer.

## Highlight System

Highlights represent semantic element state independent of pointer presence.

```ts
interface HighlightSpec {
  targetId: string
  tone: HighlightTone
  emphasis?: 'soft' | 'normal' | 'strong'
}
```

### Highlight tones

- `default`
- `active`
- `compare`
- `candidate`
- `done`
- `found`
- `error`
- `memo`
- `base`
- `mutated`
- `dim`

### Highlight rules

- highlight meaning must be stable across primitives
- the same tone must not mean different things in different lessons without documentation
- highlight alone must not carry critical meaning if the learner would need a label or annotation to understand it

## Annotation System

Annotations are how primitives expose details without overloading node text.

```ts
interface AnnotationSpec {
  id: string
  targetId: string
  kind: 'badge' | 'subtext' | 'footnote' | 'inline-label'
  text: string
  tone?: AnnotationTone
}
```

Use annotations for:
- return values
- memo status
- current candidate value
- subtree result
- node metadata
- compact explanatory labels like `BASE`, `MEMO`, `INF`

## Edge Layer

Edges are not decorative lines.
They are semantic relationships.

```ts
interface EdgeHighlightSpec {
  id: string
  sourceId: string
  targetId: string
  tone: EdgeTone
  emphasis?: 'soft' | 'normal' | 'strong'
}
```

### Edge rules

- edges must have deterministic anchors
- edge emphasis must reflect semantic state such as current path, compared branch, or completed branch
- edge motion must be subtle and readable, never flashy
- edge labels are optional and should be rare

## Semantic Tokens

The primitive system needs a global semantic token layer.

### Required token groups

- execution token styles
- surfaces
- text
- node tones
- pointer tones
- edge tones
- badge tones
- panel borders
- panel muted states

### Required semantic states

At minimum the token system must support:
- `default`
- `active`
- `compare`
- `candidate`
- `done`
- `found`
- `error`
- `memo`
- `base`
- `special`
- `dim`

### Token rule

Raw colors are not the contract.
Semantic names are the contract.

Execution token styles should also use semantic or indexed names such as:

- `accent-1`
- `accent-2`
- `accent-3`
- `accent-4`
- `success`
- `warning`
- `error`
- `muted`

Those styles are shared across views.
The same token style may render differently in a pointer, state row, narration chip,
or code-trace emphasis, but it should still be recognized as the same execution object.

## Primitive Sizing And Density

The primitive system must explicitly support density modes.

### Density modes

- `comfortable`
- `compact`
- `micro`

### Rules

- the default lesson surface should use `comfortable` for primary content
- secondary or archived states may switch to `compact`
- `micro` is only for repeated low-importance states like dead branches or archived memo rows
- text must stay legible in all supported density modes

## Primitive Composition Rules

Primitives do not appear alone. They appear as part of the lesson surface.

### Main lesson composition

- one primary primitive or composite canvas owns the central attention
- secondary primitives explain supporting state
- tertiary primitives are compact and should not compete visually with the primary one

### Priority examples

- binary search: array is primary, state and code are secondary
- tree DFS: tree is primary, stack and code are secondary
- memo DFS: call tree is primary, stack and memo table are secondary

### Composition rules

- never let three equally heavy panels compete at the same visual weight unless the lesson truly requires it
- if the learner must compare two panels, align the related state spatially
- if a primitive is not adding meaning for the current lesson, do not render it just because it exists

### Viewport hint contract

Each primitive declares `PrimitiveViewportSpec` with:

- `role`: `"primary"` | `"secondary"` | `"tertiary"` — determines routing.
- `preferredWidth`: ideal width in px — declared for every primitive in lesson data.
- `minHeight`: minimum height constraint.

### splitPrimitives() routing

The `splitPrimitives()` function in `lesson-player.tsx` routes each primitive:

- `kind === "state"` → support column (left panel)
- `role === "primary"` or undefined non-state → stage primary (center, large area, flex centering)
- `role === "secondary"` or `"tertiary"` → stage sidebar (compact or proportional column)

### Independent scroll regions

Primary and secondary regions scroll independently. The outer stage container uses `overflow-hidden` so no scroll leaks. Each region owns its own overflow:

- Primary: `overflow-auto` with `m-auto` centering — content centers when smaller than viewport, scrolls normally when overflowing.
- Secondary: `overflow-y-auto` — multiple secondaries stack vertically via `grid auto-rows-max`.

## Primitive-Specific Requirements

### ArrayView / SequenceView

Must support:
- stable cell ids
- renderer-owned anchors for pointer targets
- pointer stacking without layout reflow
- range highlights
- compared cells
- mutated cells
- result markers
- compact row mode

### StackView / QueueView

Must support:
- top/front markers
- push/pop or enqueue/dequeue emphasis
- frame detail rows for recursion when needed
- waiting versus active frame styling

### HashMapView

Must support:
- key/value rendering
- memo or cache status tones
- read versus write emphasis
- unknown or pending value state
- compact table mode

### TreeView

Must support:
- stable node ids
- structural edges
- subtree highlight
- return-value annotations
- configurable node renderer

### CallTreeView

Must support:
- execution-path emphasis
- current frame versus waiting frame distinction
- solved, memoized, dead, and base-state annotations
- compact repeated-state rendering
- focus mode and full mode

### GraphView

Must support:
- node and edge highlights
- frontier emphasis
- visited versus current distinction
- queue or stack coordination when used with traversal lessons

### CodeTraceView

Must support:
- active line
- waiting line or suspended frame line
- returned line
- optional inline variable chips
- line numbers and stable code layout

### StateView

Must support:
- real algorithm variables only
- before/after values when useful
- invariant text
- compact key/value layout

### NarrationView

Must support:
- one-step explanation only
- colored semantic segments matching on-screen state
- short, high-signal copy
- no paragraph dumps

## Motion Rules

- motion should clarify state transition, not decorate it
- primitives animate only between adjacent frames
- no looping motion in the steady state except where meaningfully justified
- color transitions must preserve semantic identity
- pointer motion should be smoother than node mutation motion
- layout jumps must be minimized through measured layout or stable anchors

## Accessibility And Debuggability

- text must remain selectable where practical
- critical labels must be real text, not only drawn shapes
- author mode must be able to inspect primitive state without reading rendered pixels
- primitives should expose test ids or inspectable ids in development and author mode

## Definition Of Done For A Primitive

A primitive is not done until:
- it has a documented data contract
- it has documented semantic states
- it has documented pointer behavior
- it has documented density behavior
- it has at least one representative integration lesson
- it has verification-friendly ids and predictable output
- it composes cleanly with the lesson shell

## Relationship To The Architecture

`VISUALIZATION_FIRST_ARCHITECTURE.md` defines the system.
This document defines how the primitive layer actually behaves.

If there is a conflict, update both documents so the primitive system and product architecture stay aligned.
