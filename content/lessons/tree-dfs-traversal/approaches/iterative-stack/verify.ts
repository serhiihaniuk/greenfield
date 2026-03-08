import type { CodeTemplate } from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  SequencePrimitiveFrameState,
  StackPrimitiveFrameState,
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
      code: "TREE_DFS_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `Tree DFS traversal should project one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "TREE_DFS_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Tree DFS traversal trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "TREE_DFS_FRAME_CODE_LINE_MISSING",
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
    const tree = findPrimitive(frame, "tree")
    const stack = findPrimitive(frame, "dfs-stack")
    const order = findPrimitive(frame, "visit-order")

    if (!tree || tree.kind !== "tree") {
      issues.push({
        code: "TREE_DFS_TREE_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the structural tree as the primary surface.`,
        frameId: frame.id,
      })
    }

    if (!stack || stack.kind !== "stack") {
      issues.push({
        code: "TREE_DFS_STACK_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the explicit DFS stack.`,
        frameId: frame.id,
      })
    }

    if (!order || order.kind !== "sequence") {
      issues.push({
        code: "TREE_DFS_ORDER_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the visit order sequence.`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyRootStartsOnStack(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const firstFrame = frames[0]

  if (!firstFrame) {
    issues.push({
      code: "TREE_DFS_FRAMES_EMPTY",
      kind: "frame",
      severity: "error",
      message: "Tree DFS traversal produced no frames.",
    })

    return createVerificationReport(issues)
  }

  const stack = findPrimitive(firstFrame, "dfs-stack")
  if (!stack || stack.kind !== "stack") {
    return createVerificationReport(issues)
  }

  const framesData = (stack as StackPrimitiveFrameState).data.frames
  if (framesData.length !== 1) {
    issues.push({
      code: "TREE_DFS_ROOT_STACK_SHAPE_INVALID",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The first frame should start with exactly one root node on the DFS stack.",
      frameId: firstFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  return createVerificationReport(issues)
}

function verifyTraversalProducesOrder(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const firstVisitFrame = frames.find((frame) => frame.codeLine === "L5")

  if (!firstVisitFrame) {
    issues.push({
      code: "TREE_DFS_VISIT_FRAME_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Tree DFS traversal should visibly visit at least one node.",
    })

    return createVerificationReport(issues)
  }

  const order = findPrimitive(firstVisitFrame, "visit-order")
  if (!order || order.kind !== "sequence") {
    return createVerificationReport(issues)
  }

  const firstLabel = (order as SequencePrimitiveFrameState).data.items[0]?.label
  const currentValue = firstVisitFrame.narration.sourceValues.currentValue
  if (String(firstLabel) !== String(currentValue)) {
    issues.push({
      code: "TREE_DFS_FIRST_VISIT_NOT_VISIBLE",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The first visit frame should visibly append the popped node to preorder output.",
      frameId: firstVisitFrame.id,
      pedagogicalCheck: "code-line-mismatch",
    })
  }

  return createVerificationReport(issues)
}

function verifyFinalAnswer(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const finalFrame = frames.at(-1)

  if (!finalFrame) {
    issues.push({
      code: "TREE_DFS_FINAL_FRAME_MISSING",
      kind: "frame",
      severity: "error",
      message: "Tree DFS traversal produced no final frame.",
    })

    return createVerificationReport(issues)
  }

  if (finalFrame.visualChangeType !== "result" || finalFrame.codeLine !== "L9") {
    issues.push({
      code: "TREE_DFS_FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final learner-visible frame should communicate the completed preorder traversal.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  const stack = findPrimitive(finalFrame, "dfs-stack")
  if (stack?.kind === "stack") {
    const stackFrames = (stack as StackPrimitiveFrameState).data.frames
    if (stackFrames.length !== 0) {
      issues.push({
        code: "TREE_DFS_STACK_NOT_EMPTY_AT_END",
        kind: "pedagogical-integrity",
        severity: "error",
        message:
          "The DFS stack should be empty before the final preorder result is returned.",
        frameId: finalFrame.id,
        pedagogicalCheck: "scope-handoff",
      })
    }
  }

  const order = findPrimitive(finalFrame, "visit-order")
  const expectedOrder = finalFrame.narration.sourceValues.order
  if (order?.kind === "sequence" && Array.isArray(expectedOrder)) {
    const sequenceLabels = (order as SequencePrimitiveFrameState).data.items.map(
      (item) => Number(item.label)
    )

    if (JSON.stringify(sequenceLabels) !== JSON.stringify(expectedOrder)) {
      issues.push({
        code: "TREE_DFS_FINAL_ORDER_MISMATCH",
        kind: "pedagogical-integrity",
        severity: "error",
        message:
          "The final order sequence should match the returned preorder traversal exactly.",
        frameId: finalFrame.id,
        pedagogicalCheck: "code-line-mismatch",
      })
    }
  }

  const tree = findPrimitive(finalFrame, "tree")
  if (tree?.kind === "tree") {
    const nodes = (tree as TreePrimitiveFrameState).data.nodes
    if (!nodes.some((node) => node.status === "done" || node.status === "found")) {
      issues.push({
        code: "TREE_DFS_VISITED_TREE_NOT_VISIBLE",
        kind: "pedagogical-integrity",
        severity: "error",
        message:
          "The final frame should keep the visited tree state visible instead of dropping traversal context.",
        frameId: finalFrame.id,
        pedagogicalCheck: "hidden-state-loss",
      })
    }
  }

  return createVerificationReport(issues)
}

export function verifyIterativeStackTreeDfs(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyTraceShape(events, frames, codeTemplate),
    verifyRequiredViews(frames),
    verifyRootStartsOnStack(frames),
    verifyTraversalProducesOrder(frames),
    verifyFinalAnswer(frames)
  )
}
