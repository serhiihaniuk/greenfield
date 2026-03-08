# Runtime And Player Specification

## Purpose

This document defines the runtime contract for lesson playback, synchronization, and author inspection.

The runtime is not just transport between steps.
It is the system that guarantees the learner sees one coherent state at a time.

## Runtime Responsibilities

The runtime must:

- load a lesson and chosen approach
- parse preset or custom input
- generate the semantic trace
- project trace events into frames
- hold the active frame index
- synchronize all primitives to the same frame
- support playback controls
- expose author-mode inspection state
- preserve determinism across replay and reset
- surface pedagogical integrity failures before learner trust is asked

The current product ships one projection mode only: `full`.
Mode switching is no longer a learner-facing feature.

## Runtime State Model

Use a dedicated runtime store for the lesson player.

```ts
interface LessonPlayerState {
  lessonId: string
  approachId: string
  mode: VisualizationMode
  inputSource: "preset" | "custom"
  selectedPresetId?: string
  rawInput: string
  parsedInput?: ParsedInput
  trace: TraceEvent[]
  frames: Frame[]
  currentFrameIndex: number
  playbackStatus: "idle" | "playing" | "paused" | "ended" | "error"
  playbackSpeed: PlaybackSpeed
  verification?: VerificationReport
  authorMode: boolean
  selectedEventId?: string
}
```

## Playback Controls

The player must support:

- play
- pause
- next step
- previous step
- jump to first step
- jump to last step
- scrub to exact frame index
- playback speed selection
- reset to current preset or current custom input

## Playback Rules

- frame index is the only source of truth for learner-visible state
- all primitives render from the same frame index
- playback never skips intermediate frames
- runtime playback must not synthesize combined learner-visible changes that were not present in the projected frames
- replay after reset must produce identical frames
- changing approach invalidates current trace and frames and rebuilds them
- changing input rebuilds parsed input, trace, frames, and verification

## Motion Synchronization Rules

Runtime motion must still obey frame determinism.

Rules:

- motion is derived only from the previous visible frame and the current visible frame
- the runtime may not synthesize extra intermediate algorithm states for animation purposes
- when autoplay advances, primitive motion should complete within the selected frame dwell time instead of spilling into the next frame
- reduced-motion mode keeps synchronization but removes travel-heavy animation
- motion must never hide verification failures or make blocked learner mode feel playable
- tracked explanatory signals such as pointers should persist and move between adjacent frames when the underlying tracked object still exists; dropping and recreating them should be treated as a continuity bug

## Frame-Level Execution Token Continuity

The runtime should increasingly treat important execution objects as shared tokens,
not as view-local decorations.

Rules:

- token identity persists across adjacent frames even when its visual projection changes
- the same execution token may appear in stage, state, narration, and later code trace
- pointer continuity is one visible symptom of token continuity, not the whole contract
- view changes must not imply token death unless the semantic model explicitly ends the token

The current runtime may derive token identity from existing pointer specs as a
compatibility bridge, but the architectural direction is a frame-level token system.

## Projection Synchronization

The runtime is synchronizing semantic objects across views, not just synchronizing widgets.

That means:

- narration, state, stage, and code may reference the same execution token
- those projections may differ visually, but should preserve recognizable identity
- synchronized views should feel like different projections of the same execution state

Binary Search is the intended first pilot for this token-aware synchronization:

- stage pointer for `lo`, `hi`, `mid`
- matching state-row identity
- inline narration token rendering

## Speed Model

Use a small fixed speed set for MVP:

- `0.5x`
- `1x`
- `1.5x`
- `2x`

Autoplay should be paused automatically when:

- the last frame is reached
- trace or projection fails
- input validation fails

## Pedagogical Integrity Contract

The runtime must preserve teaching integrity, not just state transport.

Hard rules:

- only one visual change type may be active per frame
- the runtime may not merge adjacent frames for convenience during autoplay
- if a frame enters or exits a scope, related waiting or completed state must remain visible according to the frame payload
- narration, code highlight, and primitive diff must describe the same learner-visible action
- if the projector flags hidden-state loss or overloaded change sets, learner mode must stay blocked

## Frame Synchronization Contract

A frame is complete and self-sufficient.
At any frame index, the runtime must be able to render the lesson from frame data only.

Every frame must include:

- source event id
- code line reference
- declared visual change type
- primitive states
- narration payload
- frame checks
- enough explicit state to explain handoff, waiting, and completion without hidden runtime inference

The runtime should not infer hidden state outside the frame.

## Lesson Loading Flow

1. Resolve lesson from registry.
2. Resolve default or requested approach.
3. Resolve preset or custom input.
4. Parse input.
5. Generate semantic trace.
6. Verify semantic trace.
7. Project frames.
8. Verify frames.
9. Mount player at frame `0`.

## Custom Input Flow

When custom input changes:

1. parse raw input
2. if parse fails, show input error and do not build trace
3. if parse succeeds, rebuild trace
4. rebuild frames
5. rerun verification
6. reset current frame index to `0`

Preset selection and custom input should share one shell surface.
The player should expose a dedicated preset studio dialog where the learner can:

- inspect what makes each verified preset special before running it
- compare lightweight input snapshots without leaving the player
- jump from a verified preset into editable custom input
- keep the primary action reachable through a sticky in-dialog action bar even when preset details are long

## Author Mode Contract

Author mode, presented in-product as lesson audit, is a runtime QA view over the same lesson state.
It must expose:

- current frame index
- current semantic event
- full frame-backed event timeline
- previous frame to next frame diff summary
- verification errors and warnings
- issue filtering over the active frame, active event, and global runtime report
- frame checks
- narration payload source values
- direct primitive focus on the live rendered stage
- pedagogical warnings such as skipped micro-steps, hidden state loss, or overloaded frames

Author mode must not have a separate lesson state machine.
It inspects the normal player state.

## Pointer Overlay Runtime

Pointer overlays should be driven by token-aware pointer projections against
renderer-owned anchors.

Rules:

- pointer geometry belongs to primitive renderers, not lesson data
- pointer overlays should resolve semantic targets against primitive-owned anchors
- pointer overlays must not perturb primitive layout or stage composition
- pointer enter, travel, stacking, and exit must not introduce scrollbars or reflow

The first rollout should use a compatibility bridge from current `PointerSpec`
data into the future execution-token model rather than forcing an immediate lesson rewrite.

## Author And Audit Expectations

Audit should eventually be able to inspect shared execution tokens, not only
pointers, highlights, and primitive-local diffs.

Direction:

- author tooling should explain which execution object is being tracked
- it should be possible to relate stage pointers, state rows, and narration references back to the same token identity
- future audit workflows should surface token continuity issues as a first-class diagnostic

## Command And Shortcut Contract

The runtime shell should treat buttons, hotkeys, and the command palette as different inputs for the same command layer.

That command layer should:

- define shared action ids, labels, shortcuts, and enablement rules
- gate shortcut execution with the same learner-mode and dialog-state rules as pointer controls
- provide the same actions to the command palette and hotkey help surface
- keep lesson, approach, and preset switching reachable through the command palette instead of only through footer-local controls
- keep preset selection reachable through the preset studio as well as direct command actions
- store shortcut display data in a structured form so combinations and alternatives are rendered consistently by one shared `Kbd` component

## Runtime Error States

The runtime must distinguish these failure classes:

- input parse error
- trace generation error
- semantic verification error
- projection error
- frame verification error
- pedagogical integrity verification error

Each should render a clear developer-facing message in author mode.
Only input parse errors should be exposed in learner mode in a user-facing way.
When learner mode is blocked by verification failure, that blocker should use the shared shell dialog contract rather than page-local custom overlay chrome.

## Persistence Rules

Persist locally:

- last used approach per lesson
- last used mode per lesson
- recent custom input per lesson
- playback speed preference

Do not persist:

- current frame index across sessions for MVP
- author mode enabled state

## Runtime Done Criteria

The runtime is not done until:

- one lesson can load end to end from registry to playback
- frame synchronization is deterministic
- custom input rebuild works without page reload
- author mode inspects the same underlying state as learner mode
- runtime failures are surfaced clearly
- author mode exposes pedagogical integrity failures clearly
- all controls work from keyboard and pointer input
