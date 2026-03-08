import { resolveApproach, resolveLesson, resolvePreset } from "@/domains/lessons/loaders"
import type {
  AnyLessonDefinition,
  ApproachDefinition,
  ParsedInput,
  VisualizationMode,
} from "@/domains/lessons/types"
import { verifyRuntimeOutputs } from "@/domains/verification/runtime"
import type {
  InputSource,
  LessonPlayerState,
  PlaybackSpeed,
  RuntimeFailure,
} from "@/features/player/types"

export const DEFAULT_PLAYBACK_SPEED: PlaybackSpeed = "1x"

export const PLAYBACK_SPEED_MS: Record<PlaybackSpeed, number> = {
  "0.5x": 1800,
  "1x": 1100,
  "1.5x": 800,
  "2x": 550,
}

export interface PersistedLessonPreference {
  approachId?: string
  selectedPresetId?: string
  rawInput?: string
  inputSource?: InputSource
  playbackSpeed?: PlaybackSpeed
}

export interface BuildLessonRuntimeOptions {
  lesson: AnyLessonDefinition
  approach: ApproachDefinition
  mode: VisualizationMode
  rawInput: string
}

export interface BuildLessonRuntimeResult {
  parsedInput?: ParsedInput
  trace: LessonPlayerState["trace"]
  frames: LessonPlayerState["frames"]
  verification?: LessonPlayerState["verification"]
  failure?: RuntimeFailure
}

function buildRuntimeFailure(
  kind: RuntimeFailure["kind"],
  message: string
): BuildLessonRuntimeResult {
  return {
    trace: [],
    frames: [],
    failure: { kind, message },
  }
}

function resolveVisualizationMode(): VisualizationMode {
  return "full"
}

export function buildLessonRuntime({
  lesson,
  approach,
  mode,
  rawInput,
}: BuildLessonRuntimeOptions): BuildLessonRuntimeResult {
  let parsedInput: ParsedInput

  try {
    parsedInput = approach.parseInput(rawInput)
  } catch (error) {
    return buildRuntimeFailure(
      "input-parse",
      error instanceof Error ? error.message : "Input parsing failed."
    )
  }

  let trace
  try {
    trace = approach.trace(parsedInput)
  } catch (error) {
    return buildRuntimeFailure(
      "trace-generation",
      error instanceof Error ? error.message : "Trace generation failed."
    )
  }

  let frames
  try {
    frames = approach.project(trace, mode)
  } catch (error) {
    return buildRuntimeFailure(
      "projection",
      error instanceof Error ? error.message : "Projection failed."
    )
  }

  try {
    const verification = verifyRuntimeOutputs(lesson, approach, trace, frames)

    return {
      parsedInput,
      trace,
      frames,
      verification,
      failure: verification.isValid
        ? undefined
        : {
            kind: "verification",
            message: `Lesson "${lesson.id}" is blocked by verification issues.`,
          },
    }
  } catch (error) {
    return buildRuntimeFailure(
      "verification",
      error instanceof Error ? error.message : "Verification failed."
    )
  }
}

export function resolvePlayerSelection(
  lessonIdOrSlug?: string,
  preference?: PersistedLessonPreference
) {
  const lesson = resolveLesson(lessonIdOrSlug)
  const approach = resolveApproach(lesson, preference?.approachId)
  const preset = resolvePreset(approach, preference?.selectedPresetId)

  return {
    lesson,
    approach,
    preset,
    mode: resolveVisualizationMode(),
    selectedPresetId: preset?.id,
    inputSource: preference?.inputSource ?? "preset",
    rawInput: preference?.inputSource === "custom"
      ? preference.rawInput ?? preset?.rawInput ?? ""
      : preset?.rawInput ?? preference?.rawInput ?? "",
    playbackSpeed: preference?.playbackSpeed ?? DEFAULT_PLAYBACK_SPEED,
  }
}
