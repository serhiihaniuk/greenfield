import type { CodeTemplate } from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  StatePrimitiveFrameState,
  TreePrimitiveFrameState,
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
  const primitive = findPrimitive(frame, "heap-state")
  if (!primitive || primitive.kind !== "state") {
    return undefined
  }

  return (primitive as StatePrimitiveFrameState).data.values.find(
    (value) => value.label === label
  )
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
      code: "HEAP_TOP_K_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `Heap top-k should project one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "HEAP_TOP_K_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Heap top-k trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "HEAP_TOP_K_FRAME_CODE_LINE_MISSING",
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
    const heap = findPrimitive(frame, "min-heap")
    const input = findPrimitive(frame, "input-array")
    const state = findPrimitive(frame, "heap-state")

    if (!heap || heap.kind !== "tree") {
      issues.push({
        code: "HEAP_TOP_K_HEAP_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the min-heap as the primary surface.`,
        frameId: frame.id,
      })
    }

    if (!input || input.kind !== "array") {
      issues.push({
        code: "HEAP_TOP_K_INPUT_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the scanned input array.`,
        frameId: frame.id,
      })
    }

    if (!state || state.kind !== "state") {
      issues.push({
        code: "HEAP_TOP_K_STATE_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the heap threshold state.`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyThresholdVisibility(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const heap = findPrimitive(frame, "min-heap")
    if (!heap || heap.kind !== "tree") {
      continue
    }

    const rootNode = (heap as TreePrimitiveFrameState).data.nodes.find(
      (node) => node.id === "slot-0"
    )
    const thresholdValue = findStateValue(frame, "threshold")?.value

    if (rootNode && String(rootNode.label) !== String(thresholdValue)) {
      issues.push({
        code: "HEAP_TOP_K_THRESHOLD_MISMATCH",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should keep the heap root and threshold state in sync.`,
        frameId: frame.id,
        pedagogicalCheck: "code-line-mismatch",
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyPushAndReplaceFrames(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const hasPushFrame = frames.some((frame) => frame.codeLine === "L4")
  const hasReplaceFrame = frames.some((frame) => frame.codeLine === "L7")
  const hasSiftDownFrame = frames.some((frame) => frame.codeLine === "L8")

  if (!hasPushFrame) {
    issues.push({
      code: "HEAP_TOP_K_PUSH_FRAME_MISSING",
      kind: "semantic",
      severity: "error",
      message:
        "Heap top-k should visibly show the heap growing before replacement starts.",
    })
  }

  if (!hasReplaceFrame) {
    issues.push({
      code: "HEAP_TOP_K_REPLACE_FRAME_MISSING",
      kind: "semantic",
      severity: "error",
      message:
        "Heap top-k should visibly show at least one root replacement for the flagship preset.",
    })
  }

  if (!hasSiftDownFrame) {
    issues.push({
      code: "HEAP_TOP_K_SIFT_DOWN_FRAME_MISSING",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "Heap top-k should visibly show the replacement settling back into heap order.",
      pedagogicalCheck: "scope-handoff",
    })
  }

  return createVerificationReport(issues)
}

function verifyStructuredNarration(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const { narration } = frame
    const tokenIds = new Set(
      narration.segments
        .map((segment) => segment.tokenId)
        .filter((tokenId): tokenId is string => Boolean(tokenId))
    )

    if (
      ["L2", "L3", "L4", "L5", "L6", "L7", "L8", "L11"].includes(frame.codeLine) &&
      (!narration.headline || !narration.reason || !narration.implication)
    ) {
      issues.push({
        code: "HEAP_TOP_K_STRUCTURED_NARRATION_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should expose headline, reason, and implication for the active heap step.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    if (
      ["L2", "L3", "L4", "L6", "L7"].includes(frame.codeLine) &&
      !tokenIds.has("scan-index")
    ) {
      issues.push({
        code: "HEAP_TOP_K_SCAN_TOKEN_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should explain the scanned candidate through the shared scan token.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    if (frame.codeLine === "L3") {
      const reasonText = narration.reason?.segments.map((segment) => segment.text).join("")
      if (
        !reasonText?.includes("min-heap") &&
        !reasonText?.includes("root")
      ) {
        issues.push({
          code: "HEAP_TOP_K_THRESHOLD_REASON_WEAK",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" should explain why the heap root is the threshold once the heap is full.`,
          frameId: frame.id,
          pedagogicalCheck: "narration-mismatch",
        })
      }
    }

    if (frame.codeLine === "L6") {
      const implicationText = narration.implication?.segments
        .map((segment) => segment.text)
        .join("")

      if (
        !implicationText?.includes("replaces the root") &&
        !implicationText?.includes("heap stays unchanged")
      ) {
        issues.push({
          code: "HEAP_TOP_K_DECISION_IMPLICATION_WEAK",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" should make the threshold decision consequence explicit.`,
          frameId: frame.id,
          pedagogicalCheck: "narration-mismatch",
        })
      }
    }
  }

  return createVerificationReport(issues)
}

function verifyFinalAnswer(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const finalFrame = frames.at(-1)

  if (!finalFrame) {
    issues.push({
      code: "HEAP_TOP_K_FRAMES_EMPTY",
      kind: "frame",
      severity: "error",
      message: "Heap top-k produced no frames.",
    })

    return createVerificationReport(issues)
  }

  if (
    finalFrame.visualChangeType !== "result" ||
    finalFrame.codeLine !== "L11"
  ) {
    issues.push({
      code: "HEAP_TOP_K_FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final learner-visible frame should communicate the descending top-k result.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  const resultValue = findStateValue(finalFrame, "topK")?.value
  const narrationResult = finalFrame.narration.sourceValues.result

  if (
    !Array.isArray(narrationResult) ||
    String(resultValue) !== `[${narrationResult.join(", ")}]`
  ) {
    issues.push({
      code: "HEAP_TOP_K_FINAL_RESULT_MISMATCH",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final frame should expose the same sorted top-k result in narration and state.",
      frameId: finalFrame.id,
      pedagogicalCheck: "code-line-mismatch",
    })
  }

  return createVerificationReport(issues)
}

export function verifyMinHeapTopK(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyTraceShape(events, frames, codeTemplate),
    verifyRequiredViews(frames),
    verifyThresholdVisibility(frames),
    verifyPushAndReplaceFrames(frames),
    verifyStructuredNarration(frames),
    verifyFinalAnswer(frames)
  )
}
