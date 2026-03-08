import type {
  AnyLessonDefinition,
  ApproachDefinition,
  ParsedInput,
  VisualizationMode,
} from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type { VerificationReport } from "@/domains/verification/types"

export type InputSource = "preset" | "custom"
export type PlaybackStatus = "idle" | "playing" | "paused" | "ended" | "error"
export type PlaybackSpeed = "0.5x" | "1x" | "1.5x" | "2x"

export type RuntimeFailureKind =
  | "input-parse"
  | "trace-generation"
  | "projection"
  | "verification"
  | "registry"

export interface RuntimeFailure {
  kind: RuntimeFailureKind
  message: string
}

export interface LessonPlayerState {
  lessonId: string
  lesson?: AnyLessonDefinition
  approachId: string
  approach?: ApproachDefinition
  mode: VisualizationMode
  inputSource: InputSource
  selectedPresetId?: string
  rawInput: string
  parsedInput?: ParsedInput
  trace: TraceEvent[]
  frames: Frame[]
  currentFrameIndex: number
  playbackStatus: PlaybackStatus
  playbackSpeed: PlaybackSpeed
  verification?: VerificationReport
  authorMode: boolean
  selectedEventId?: string
  failure?: RuntimeFailure
}

export interface LessonPlayerActions {
  initialize: (lessonIdOrSlug?: string) => void
  setLessonId: (lessonIdOrSlug: string) => void
  setApproachId: (approachId: string) => void
  selectPreset: (presetId: string) => void
  setRawInput: (rawInput: string) => void
  applyCustomInput: () => void
  play: () => void
  pause: () => void
  nextFrame: () => void
  previousFrame: () => void
  jumpToFirst: () => void
  jumpToLast: () => void
  scrubTo: (frameIndex: number) => void
  reset: () => void
  setPlaybackSpeed: (speed: PlaybackSpeed) => void
  toggleAuthorMode: () => void
  setSelectedEventId: (eventId?: string) => void
}

export type LessonPlayerStoreState = LessonPlayerState & LessonPlayerActions
