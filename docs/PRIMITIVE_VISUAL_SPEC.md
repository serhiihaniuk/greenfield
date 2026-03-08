# Primitive Visual Specification

## Purpose

This document defines how primitives should look.

The primitive system is not complete with data contracts alone.
A fresh implementation chat also needs the visual grammar:
- orientation
- sizing
- spacing
- node anatomy
- pointer rendering
- panel shell
- typography
- semantic color usage

Without this, two correct implementations can still look incompatible and reduce learning quality.

This spec also defines how state remains visually continuous across steps so a learner does not lose track of what just happened.

## Global Visual Direction

The product should look like a dense, deliberate study instrument.
Not like a dashboard kit and not like a playful toy.

Visual character:
- dark base
- strong semantic contrast
- low decoration
- mono-friendly information density
- clear primary vs secondary hierarchy
- compact but not cramped

## Panel Shell

Every primitive sits inside a panel shell unless it is the single full-canvas surface.

### Panel anatomy

- 1 panel title row
- optional short subtitle row
- content region
- optional micro legend or annotation strip

### Panel style

- dark neutral background
- thin low-contrast border
- slightly rounded corners
- subtle inner spacing
- no heavy shadows
- no glassmorphism

### Panel spacing

- title to content: tight
- primitive-to-primitive gap: medium
- primary canvas gets more breathing room than secondary panels

## Typography

### Fonts

- shell UI: sans
- visualization labels, state, code, and node internals: mono

### Text hierarchy

- panel titles: medium emphasis
- node primary values: strong emphasis
- node subtitles / annotations: muted but readable
- tertiary labels: dim but still legible

### Rules

- never let typography look editorial
- numbers and algorithm state should feel precise
- avoid oversized headings inside primitives

## Sizing Scale

Use a consistent size scale across primitives.

### Cell and node sizes

- `xs`: tiny support markers only
- `sm`: compact repeated states
- `md`: default cell or node size
- `lg`: primary active node size when lesson requires emphasis

### Recommended defaults

- array cell: `48 x 48`
- compact array cell: `36 x 36`
- tree node default: `48 x 48`
- call-tree node default: `128 x auto`
- compact call-tree node: `96 x auto`
- hash-map row height: `44`
- tree level spacing: `88`
- tree sibling spacing: `96`
- call-tree level spacing: `116`
- call-tree sibling spacing: `152`
- code line height: stable mono line height, not browser default drift

These are starting contracts, not random values.
If changed globally, update this spec.

## Pointer Visual Grammar

Pointers must be visually consistent across all primitives.

### Pointer anatomy

- short label chip or text label
- thin connector or anchor relationship to target when needed
- semantic tone color
- stable placement around the target

### Pointer placement rules

- arrays and sequences: above or below cells, not floating randomly
- stacks and queues: beside the relevant edge (`top`, `front`, `back`)
- trees and call trees: near node perimeter, biased upward or sideways to avoid covering node value
- code trace: left gutter marker or inline line chip, never both unless in author mode

### Pointer style

- compact label
- high-contrast text
- subtle filled or outlined chip depending on density
- no cartoon arrows
- if a line is needed, keep it thin and precise

### Pointer stacking

When multiple pointers target the same element:
- stack them deterministically
- preserve a stable order by priority then id
- do not let them overlap unreadably

## State Continuity Rules

Visual correctness is not enough.
State must also remain trackable across adjacent frames.

Global rules:
- a materially important state object may not vanish without an explicit done, archived, transferred, or returned representation
- if a frame exits a scope, the learner must still be able to see what completed and where control returned
- compacting archived state is allowed, but silent disappearance is not
- the active object, waiting object, and result object must not visually swap roles without a clear handoff

## Semantic Color Usage

Color is semantic, not decorative.

### Required semantic meanings

- `active`: current focus of execution
- `compare`: currently being checked against something
- `candidate`: possible next choice or best-so-far contender
- `done`: completed and no longer active
- `found`: successful result or confirmed answer
- `error`: invalid, dead, overshoot, or impossible state
- `memo`: cached / reused state
- `base`: base-case or terminal valid state
- `dim`: inactive background state

### Color rules

- text remains readable in every state
- borders and fills should work together, not fight each other
- active states get the strongest contrast, not the brightest arbitrary color
- dim states must still be readable enough to preserve context

## ArrayView / SequenceView Visual Rules

### Orientation

- horizontal by default
- wrap only if the lesson explicitly requires multi-row layout

### Cell anatomy

- primary value centered
- optional index row below
- optional small annotation slot

### Visual behavior

- indices are muted, never stronger than the values
- range highlights should feel continuous when possible
- compared cells should be visually distinct from active pointer placement

## StackView Visual Rules

### Orientation

- vertical by default
- newest / top item at the top unless the lesson explicitly declares otherwise

### Anatomy

- one card or row per frame/item
- optional frame details inside the row
- clear `top` marker near the active edge

### Visual behavior

- active frame is strongly emphasized
- waiting frames are visible but secondary
- completed frames may shift to a done tone instead of disappearing instantly
- popping a frame must leave a visible handoff to the returned caller when that relationship matters

## QueueView Visual Rules

### Orientation

- horizontal by default for small queues
- vertical allowed when item details are large

### Anatomy

- clear `front` and `back` markers
- items aligned in strict order

### Visual behavior

- dequeue target must be obvious
- enqueue insertion side must be obvious

## HashMapView Visual Rules

### Orientation

- table/list form by default

### Anatomy

- key column
- relationship marker or separator
- value column
- optional status annotation per row

### Visual behavior

- memo/read/write states should be visible without turning the table into a rainbow
- unknown values use a distinct but subdued placeholder state

## TreeView Visual Rules

### Orientation

- root at top
- children below
- vertical hierarchical flow by default

### Node anatomy

- default structural node: compact square or rounded square
- primary label centered
- optional sublabel or metadata chip only when the lesson requires it

### Edges

- thin SVG connectors
- neutral by default
- highlighted path edges use semantic edge tones

### Layout behavior

- sibling spacing must be even and deterministic
- trees should not feel stretched just because space exists
- subtree focus should use highlight and edge emphasis, not random scaling

## CallTreeView Visual Rules

### Orientation

- root at top
- execution expands downward
- current path remains visually central when possible

### Node anatomy

Call-tree nodes are richer than structural tree nodes.
They should have:
- function label or state label at top
- large primary state value
- optional badge such as `CURR`, `MEMO`, `BASE`, `DEAD`
- optional footer for return value or candidate summary

### Visual behavior

- current node is strongest state
- active path is clearly emphasized
- solved or archived branches are compacted
- repeated dead or overshoot states should prefer compact nodes
- branch completion and return flow must remain visually legible when a node leaves the active path
- focus mode is the default visual mode

## GraphView Visual Rules

### Orientation

- depends on lesson, but layout must be deterministic
- do not rely on force-directed random motion for teaching views

### Node anatomy

- compact circle or rounded square depending on lesson type
- short centered label

### Visual behavior

- frontier, visited, current, and target states must be distinct
- edges should stay secondary unless they are the active traversal path

## CodeTraceView Visual Rules

### Layout

- fixed-width code block
- stable line numbers
- one active line highlight at a time in learner mode
- optional waiting/return markers in secondary tones

### Visual behavior

- active line must be immediately visible
- syntax highlighting must not compete with semantic line highlighting
- inline variable chips should be compact and rare

## StateView Visual Rules

### Layout

- compact key/value list or small grid
- real variable names only

### Visual behavior

- changed values may show previous -> current when helpful
- invariants should appear as a separate line, not mixed into variable rows

## NarrationView Visual Rules

### Layout

- one compact block
- one-step explanation only
- close to the main visualization, not far below the fold

### Visual behavior

- semantic colored segments match the on-screen state
- narration must describe only the one learner-visible change in the current frame
- avoid large paragraphs
- keep line length compact for fast scanning

## Composition With Main Lesson Surface

### Stage structure

The stage (right panel, ~73% width) uses independently scrolling regions:

```
div (grid h-full overflow-hidden, dynamic columns)
  ├─ section (overflow-auto flex)          ← primary scrolls alone
  │   └─ div.m-auto (grid auto-rows-max)  ← centers when content is small
  └─ aside (overflow-y-auto border-l)     ← secondary scrolls alone
      └─ div (grid auto-rows-max)
```

Primary content centers via `m-auto` on a flex child — when content is smaller than the container, margins distribute excess space. When content overflows, margins collapse to 0 and normal scrolling applies with no top-clipping.

### Column strategy

The stage picks columns based on what the secondary region contains:

| Case | Condition | Columns |
|------|-----------|---------|
| No secondary | no secondary primitives | Single column |
| Compact secondary | secondary has only flow views | `1fr + clamp(16rem, 22rem)` |
| Expansive secondary | secondary has a canvas view | `1.2fr + 1fr` |

Canvas views (`tree`, `call-tree`, `graph` — listed in `CANVAS_KINDS` set in `lesson-player.tsx`) use absolute positioning and have intrinsic minimum widths (300–360px). Flow views (array, sequence, stack, queue, hash-map) use CSS flex/grid and compress naturally into narrow columns.

### Primary / secondary / tertiary weights

- primary primitive: largest area, strongest contrast, centered in stage
- secondary primitives: supportive sidebar, independently scrollable
- tertiary elements: compact and quiet, same sidebar as secondary

### Common compositions

- array problems: array primary centered, code + state in left panel
- recursion lessons: call tree or structural tree primary, stack + code secondary sidebar
- memoization lessons: call tree primary, stack + memo table secondary sidebar
- mixed canvas secondary: proportional 1.2fr:1fr split so canvas gets enough width

### Anti-rules

- do not give every panel the same weight
- do not leave large unused void areas that break the eye path
- do not place narration so far away that it feels disconnected from the active step
- do not couple scroll regions — primary and secondary scroll independently

## Visual Done Criteria

A primitive is not visually done until:
- orientation is defined
- default size is defined
- compact size is defined if needed
- pointer placement is defined
- annotation positions are defined
- semantic states are visually distinguishable
- important state continuity is preserved across adjacent frames
- composition role is defined
- it still reads clearly in the main lesson shell


