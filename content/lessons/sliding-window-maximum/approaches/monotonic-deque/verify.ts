import type { CodeTemplate } from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  ArrayPrimitiveFrameState,
  SequencePrimitiveFrameState,
  StatePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import {
  createVerificationReport,
  mergeVerificationReports,
  type VerificationIssue,
  type VerificationReport,
} from "@/domains/verification/types"

function findPrimitive(frame: Frame, primitiveId: string) {
  return frame.primitives.find((primitive) => primitive.id === primitiveId)
}

function findStateValue(frame: Frame, label: string) {
  const statePrimitive = findPrimitive(frame, "window-state")
  if (!statePrimitive || statePrimitive.kind !== "state") {
    return undefined
  }

  return (statePrimitive as StatePrimitiveFrameState).data.values.find(
    (entry) => entry.label === label
  )?.value
}

function verifyTraceShape(
  events: TraceEvent[],
  frames: Frame[],
  codeTemplate: CodeTemplate
): VerificationReport {
  const issues: VerificationIssue[] = []
  const visibleEvents = events.filter((event) => event.type !== "complete")
  const completionEvent = events.at(-1)
  const codeLines = new Set(codeTemplate.lines.map((line) => line.id))

  if (frames.length !== visibleEvents.length) {
    issues.push({
      code: "SLIDING_WINDOW_MAXIMUM_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `Sliding Window Maximum should project one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "SLIDING_WINDOW_MAXIMUM_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Sliding Window Maximum trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_FRAME_CODE_LINE_MISSING",
        kind: "code-line-sync",
        severity: "error",
        message: `Frame "${frame.id}" points to unknown code line "${frame.codeLine}".`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyRequiredViews(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const array = findPrimitive(frame, "window-array")
    const deque = findPrimitive(frame, "monotonic-deque")
    const state = findPrimitive(frame, "window-state")

    if (!array || array.kind !== "array") {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_ARRAY_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the array as the primary surface.`,
        frameId: frame.id,
      })
    }

    if (!deque || deque.kind !== "sequence") {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_SEQUENCE_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the monotonic deque view.`,
        frameId: frame.id,
      })
    }

    if (frame.primitives.length > 2 && (!state || state.kind !== "state")) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_STATE_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the window state panel outside code mode.`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyCompareSignals(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (frame.codeLine !== "L5" && frame.codeLine !== "L8") {
      continue
    }

    const deque = findPrimitive(frame, "monotonic-deque")
    if (!deque || deque.kind !== "sequence") {
      continue
    }

    const hasCompareSignal =
      (deque as SequencePrimitiveFrameState).highlights?.some(
        (highlight) => highlight.tone === "compare"
      ) ?? false

    if (
      frame.codeLine === "L8" &&
      frame.narration.sourceValues.hasBack &&
      !hasCompareSignal
    ) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_BACK_COMPARE_SIGNAL_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should visibly compare the deque back against the current value.`,
        frameId: frame.id,
        pedagogicalCheck: "one-visual-change",
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyDequeMutations(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (
      frame.codeLine !== "L6" &&
      frame.codeLine !== "L9" &&
      frame.codeLine !== "L11"
    ) {
      continue
    }

    const array = findPrimitive(frame, "window-array")
    if (!array || array.kind !== "array") {
      continue
    }

    const texts = new Set(
      ((array as ArrayPrimitiveFrameState).annotations ?? []).map(
        (annotation) => annotation.text
      )
    )

    if (frame.codeLine === "L6" && !texts.has("stale")) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_STALE_MARKER_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should mark which index was removed as stale.`,
        frameId: frame.id,
        pedagogicalCheck: "hidden-state-loss",
      })
    }

    if (frame.codeLine === "L9" && !texts.has("pop back")) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_POP_BACK_MARKER_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should mark which dominated index was popped from the deque back.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    if (frame.codeLine === "L11" && !texts.has("push")) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_PUSH_MARKER_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should show which index was pushed into the deque.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyOutputFrames(
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  const issues: VerificationIssue[] = []
  const finalFrame = frames.at(-1)
  const finalEvent = events.at(-1)

  for (const frame of frames) {
    if (frame.codeLine !== "L13") {
      continue
    }

    const array = findPrimitive(frame, "window-array")
    const hasOutputBadge =
      array?.kind === "array" &&
      ((array as ArrayPrimitiveFrameState).annotations ?? []).some(
        (annotation) => annotation.text.startsWith("max ")
      )

    if (!hasOutputBadge) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_OUTPUT_BADGE_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should visibly mark which value was emitted as the window maximum.`,
        frameId: frame.id,
        pedagogicalCheck: "one-visual-change",
      })
    }
  }

  if (!finalFrame || finalFrame.visualChangeType !== "result") {
    issues.push({
      code: "SLIDING_WINDOW_MAXIMUM_FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final learner-visible frame should communicate the returned maxima list.",
      frameId: finalFrame?.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  const finalResultValue = finalFrame
    ? findStateValue(finalFrame, "result")
    : undefined
  const expectedResult = Array.isArray(finalEvent?.payload.result)
    ? finalEvent?.payload.result.join(", ")
    : undefined

  if (finalResultValue === undefined || finalResultValue === "-") {
    issues.push({
      code: "SLIDING_WINDOW_MAXIMUM_FINAL_RESULT_MISSING",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The result frame must expose the returned maxima list in visible state.",
      frameId: finalFrame?.id,
      pedagogicalCheck: "hidden-state-loss",
    })
  }

  if (expectedResult !== undefined && finalResultValue !== expectedResult) {
    issues.push({
      code: "SLIDING_WINDOW_MAXIMUM_FINAL_RESULT_MISMATCH",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final visible result should match the list returned by the semantic trace.",
      frameId: finalFrame?.id,
      pedagogicalCheck: "code-line-mismatch",
    })
  }

  return createVerificationReport(issues)
}

function verifyStructuredNarration(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const { narration } = frame

    if (
      (frame.codeLine === "L5" ||
        frame.codeLine === "L8" ||
        frame.codeLine === "L11" ||
        frame.codeLine === "L13") &&
      (!narration.headline || !narration.reason || !narration.implication)
    ) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_STRUCTURED_NARRATION_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should expose a full explanation block with headline, reason, and implication.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    const tokenIds = new Set(
      narration.segments
        .map((segment) => segment.tokenId)
        .filter((tokenId): tokenId is string => Boolean(tokenId))
    )

    if (
      frame.codeLine === "L5" &&
      frame.narration.sourceValues.hasFront &&
      !tokenIds.has("deque-front")
    ) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_FRONT_TOKEN_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should explain the front-window check using the shared front token.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    if (
      frame.codeLine === "L8" &&
      frame.narration.sourceValues.hasBack &&
      !tokenIds.has("deque-back")
    ) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_BACK_TOKEN_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should explain the back comparison using the shared back token.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    if (frame.codeLine === "L11" && !tokenIds.has("index")) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_INDEX_TOKEN_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should explain the deque push using the shared scan token.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    if (frame.codeLine === "L13" && !tokenIds.has("deque-front")) {
      issues.push({
        code: "SLIDING_WINDOW_MAXIMUM_COMMIT_TOKEN_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should explain the emitted maximum through the shared front token.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }
  }

  return createVerificationReport(issues)
}

export function verifyMonotonicDequeSlidingWindowMaximum(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyTraceShape(events, frames, codeTemplate),
    verifyRequiredViews(frames),
    verifyCompareSignals(frames),
    verifyDequeMutations(frames),
    verifyOutputFrames(events, frames),
    verifyStructuredNarration(frames)
  )
}
