import type { CodeTemplate } from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type { StatePrimitiveFrameState } from "@/entities/visualization/primitives"
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
  const statePrimitive = findPrimitive(frame, "state")
  if (!statePrimitive || statePrimitive.kind !== "state") {
    return undefined
  }

  return (statePrimitive as StatePrimitiveFrameState).data.values.find(
    (entry) => entry.label === label
  )?.value
}

function verifyBinarySearchTraceShape(
  events: TraceEvent[],
  frames: Frame[],
  codeTemplate: CodeTemplate
): VerificationReport {
  const issues: VerificationIssue[] = []
  const codeLines = new Set(codeTemplate.lines.map((line) => line.id))
  const visibleEvents = events.filter((event) => event.type !== "complete")
  const completionEvent = events.at(-1)

  if (frames.length !== visibleEvents.length) {
    issues.push({
      code: "BINARY_SEARCH_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `Binary search should produce one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "BINARY_SEARCH_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Binary search trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "BINARY_SEARCH_FRAME_CODE_LINE_MISSING",
        kind: "code-line-sync",
        severity: "error",
        message: `Frame "${frame.id}" points to unknown code line "${frame.codeLine}".`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyFinalResult(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const finalFrame = frames.at(-1)

  if (!finalFrame) {
    issues.push({
      code: "FRAMES_EMPTY",
      kind: "frame",
      severity: "error",
      message: "Binary search produced no frames.",
    })
  } else if (finalFrame.visualChangeType !== "result") {
    issues.push({
      code: "FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "warning",
      message: "The last learner-visible frame should communicate the returned result.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  } else {
    const answerValue = findStateValue(finalFrame, "answer")

    if (answerValue === undefined || answerValue === "—") {
      issues.push({
        code: "FINAL_ANSWER_NOT_VISIBLE",
        kind: "pedagogical-integrity",
        severity: "error",
        message: "The final result frame should expose the answer in visible state.",
        frameId: finalFrame.id,
        pedagogicalCheck: "hidden-state-loss",
      })
    }

    if (finalFrame.codeLine === "L7") {
      const arrayPrimitive = findPrimitive(finalFrame, "array")
      const hasFoundHighlight =
        arrayPrimitive?.highlights?.some((highlight) => highlight.tone === "found") ??
        false

      if (!hasFoundHighlight) {
        issues.push({
          code: "FOUND_RESULT_HIGHLIGHT_MISSING",
          kind: "pedagogical-integrity",
          severity: "error",
          message: "A successful binary search result frame should visibly mark the found cell.",
          frameId: finalFrame.id,
          pedagogicalCheck: "one-visual-change",
        })
      }
    }
  }

  return createVerificationReport(issues)
}

function verifyDecisionFrames(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (frame.codeLine !== "L9") {
      continue
    }

    const arrayPrimitive = findPrimitive(frame, "array")
    const hasDecisionAnnotation =
      arrayPrimitive?.annotations?.some((annotation) => annotation.kind === "badge") ??
      false

    if (!hasDecisionAnnotation) {
      issues.push({
        code: "DECISION_FRAME_ANNOTATION_MISSING",
        kind: "pedagogical-integrity",
        severity: "warning",
        message: `Frame "${frame.id}" should visually explain which half binary search discards next.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }
  }

  return createVerificationReport(issues)
}

export function verifyIterativeBinarySearch(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyBinarySearchTraceShape(events, frames, codeTemplate),
    verifyFinalResult(frames),
    verifyDecisionFrames(frames)
  )
}
