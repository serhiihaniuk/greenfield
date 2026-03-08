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
  const statePrimitive = findPrimitive(frame, "rolling-state")
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
      code: "HOUSE_ROBBER_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `House robber should project one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "HOUSE_ROBBER_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "House robber trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "HOUSE_ROBBER_FRAME_CODE_LINE_MISSING",
        kind: "code-line-sync",
        severity: "error",
        message: `Frame "${frame.id}" points to unknown code line "${frame.codeLine}".`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyDecisionFrames(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (frame.codeLine !== "L6") {
      continue
    }

    const housesPrimitive = findPrimitive(frame, "houses")
    const hasDecisionAnnotation =
      housesPrimitive?.annotations?.some(
        (annotation) => annotation.kind === "badge"
      ) ?? false

    if (!hasDecisionAnnotation) {
      issues.push({
        code: "HOUSE_ROBBER_DECISION_ANNOTATION_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should visibly show whether taking or skipping wins.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    const bestValue = findStateValue(frame, "best")
    if (bestValue === undefined || bestValue === "-") {
      issues.push({
        code: "HOUSE_ROBBER_BEST_VALUE_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should expose the compared best value in state.`,
        frameId: frame.id,
        pedagogicalCheck: "one-visual-change",
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyIndexPointerContinuity(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (let index = 1; index < frames.length; index += 1) {
    const previousFrame = frames[index - 1]
    const frame = frames[index]
    if (!previousFrame || !frame) {
      continue
    }

    const previousHouses = findPrimitive(previousFrame, "houses")
    const currentHouses = findPrimitive(frame, "houses")
    const previousIndexPointer = previousHouses?.pointers?.find(
      (pointer) => pointer.id === "index"
    )
    const currentIndexPointer = currentHouses?.pointers?.find(
      (pointer) => pointer.id === "index"
    )

    if (
      previousIndexPointer &&
      !currentIndexPointer &&
      frame.visualChangeType !== "result"
    ) {
      issues.push({
        code: "HOUSE_ROBBER_INDEX_POINTER_DISAPPEARS",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should keep the house pointer visible and move it forward instead of dropping it between steps.`,
        frameId: frame.id,
        pedagogicalCheck: "hidden-state-loss",
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyFinalFrame(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const finalFrame = frames.at(-1)

  if (!finalFrame) {
    issues.push({
      code: "HOUSE_ROBBER_FRAMES_EMPTY",
      kind: "frame",
      severity: "error",
      message: "House robber produced no frames.",
    })

    return createVerificationReport(issues)
  }

  if (finalFrame.visualChangeType !== "result") {
    issues.push({
      code: "HOUSE_ROBBER_FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final learner-visible frame should communicate the returned result.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  const answerValue = findStateValue(finalFrame, "answer")
  const prevOneValue = findStateValue(finalFrame, "prevOne")

  if (answerValue === undefined || answerValue === "-") {
    issues.push({
      code: "HOUSE_ROBBER_FINAL_ANSWER_MISSING",
      kind: "pedagogical-integrity",
      severity: "error",
      message: "The result frame must expose the returned answer.",
      frameId: finalFrame.id,
      pedagogicalCheck: "hidden-state-loss",
    })
  }

  if (answerValue !== prevOneValue) {
    issues.push({
      code: "HOUSE_ROBBER_FINAL_ANSWER_MISMATCH",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final answer should match prevOne, which holds the rolling optimum.",
      frameId: finalFrame.id,
      pedagogicalCheck: "code-line-mismatch",
    })
  }

  return createVerificationReport(issues)
}

export function verifyRollingDpHouseRobber(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyTraceShape(events, frames, codeTemplate),
    verifyDecisionFrames(frames),
    verifyIndexPointerContinuity(frames),
    verifyFinalFrame(frames)
  )
}
