import type { CodeTemplate } from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  CallTreePrimitiveFrameState,
  StackPrimitiveFrameState,
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
      code: "MAX_DEPTH_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `Maximum depth should project one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "MAX_DEPTH_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Maximum depth trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "MAX_DEPTH_FRAME_CODE_LINE_MISSING",
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
    const stack = findPrimitive(frame, "call-stack")
    const executionTree = findPrimitive(frame, "execution-tree")

    if (!stack || stack.kind !== "stack") {
      issues.push({
        code: "MAX_DEPTH_STACK_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the recursion call stack as optional secondary aid.`,
        frameId: frame.id,
      })
    }

    if (!executionTree || executionTree.kind !== "call-tree") {
      issues.push({
        code: "MAX_DEPTH_CALL_TREE_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should keep the recursive execution tree visible as the primary teaching surface.`,
        frameId: frame.id,
        pedagogicalCheck: "hidden-state-loss",
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyBaseCases(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const baseCaseFrames = frames.filter((frame) => frame.codeLine === "L5")

  if (baseCaseFrames.length === 0) {
    issues.push({
      code: "MAX_DEPTH_BASE_CASE_FRAMES_MISSING",
      kind: "semantic",
      severity: "error",
      message:
        "Maximum depth should visibly show at least one base-case frame.",
    })

    return createVerificationReport(issues)
  }

  const hasVisibleBaseReturn = baseCaseFrames.some((frame) => {
    const callTree = findPrimitive(frame, "execution-tree")
    if (!callTree || callTree.kind !== "call-tree") {
      return false
    }

    return (callTree as CallTreePrimitiveFrameState).data.nodes.some(
      (node) => node.stateValue === "null" && node.returnValue === "0"
    )
  })

  if (!hasVisibleBaseReturn) {
    issues.push({
      code: "MAX_DEPTH_BASE_RETURN_NOT_VISIBLE",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "A base-case frame should visibly return depth 0 from dfs(null).",
      pedagogicalCheck: "scope-handoff",
    })
  }

  return createVerificationReport(issues)
}

function verifyFinalAnswer(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const finalFrame = frames.at(-1)

  if (!finalFrame) {
    issues.push({
      code: "MAX_DEPTH_FRAMES_EMPTY",
      kind: "frame",
      severity: "error",
      message: "Maximum depth produced no frames.",
    })

    return createVerificationReport(issues)
  }

  if (
    finalFrame.visualChangeType !== "result" ||
    finalFrame.codeLine !== "L2"
  ) {
    issues.push({
      code: "MAX_DEPTH_FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final learner-visible frame should communicate the wrapper return value.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  const executionTree = findPrimitive(finalFrame, "execution-tree")
  const stack = findPrimitive(finalFrame, "call-stack")

  const rootCallReturnValue =
    executionTree && executionTree.kind === "call-tree"
      ? (executionTree as CallTreePrimitiveFrameState).data.nodes.find(
          (node) => !node.parentId
        )?.returnValue
      : undefined

  if (!rootCallReturnValue) {
    issues.push({
      code: "MAX_DEPTH_ROOT_RETURN_VALUE_MISSING",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The execution tree should expose the root call's returned depth as the learner-facing answer.",
      frameId: finalFrame.id,
      pedagogicalCheck: "code-line-mismatch",
    })
  }

  const stackDepth =
    stack && stack.kind === "stack"
      ? (stack as StackPrimitiveFrameState).data.frames.length
      : undefined

  if (stackDepth !== 0) {
    issues.push({
      code: "MAX_DEPTH_STACK_NOT_UNWOUND",
      kind: "pedagogical-integrity",
      severity: "warning",
      message:
        "The final wrapper result should appear after the recursive stack has fully unwound.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  return createVerificationReport(issues)
}

export function verifyRecursiveMaximumDepth(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyTraceShape(events, frames, codeTemplate),
    verifyRequiredViews(frames),
    verifyBaseCases(frames),
    verifyFinalAnswer(frames)
  )
}
