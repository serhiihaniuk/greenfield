import type { CodeTemplate } from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  GraphPrimitiveFrameState,
  QueuePrimitiveFrameState,
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
  const statePrimitive = findPrimitive(frame, "frontier-state")
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
      code: "GRAPH_BFS_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `Graph BFS should project one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "GRAPH_BFS_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Graph BFS trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "GRAPH_BFS_FRAME_CODE_LINE_MISSING",
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
    const graph = findPrimitive(frame, "graph")
    const queue = findPrimitive(frame, "frontier-queue")
    const state = findPrimitive(frame, "frontier-state")

    if (!graph || graph.kind !== "graph") {
      issues.push({
        code: "GRAPH_BFS_GRAPH_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the graph as the primary surface.`,
        frameId: frame.id,
      })
    }

    if (!queue || queue.kind !== "queue") {
      issues.push({
        code: "GRAPH_BFS_QUEUE_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the BFS frontier queue.`,
        frameId: frame.id,
      })
    }

    if (!state || state.kind !== "state") {
      issues.push({
        code: "GRAPH_BFS_STATE_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the traversal state panel.`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyNeighborChecks(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (frame.codeLine !== "L7") {
      continue
    }

    const graph = findPrimitive(frame, "graph")
    if (!graph || graph.kind !== "graph") {
      continue
    }

    const hasHighlightedEdge =
      (graph as GraphPrimitiveFrameState).edgeHighlights?.length ?? 0

    if (hasHighlightedEdge === 0) {
      issues.push({
        code: "GRAPH_BFS_NEIGHBOR_EDGE_HIGHLIGHT_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should visibly connect the current node to the inspected neighbor.`,
        frameId: frame.id,
        pedagogicalCheck: "one-visual-change",
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyQueueMutations(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (frame.codeLine !== "L9") {
      continue
    }

    const queue = findPrimitive(frame, "frontier-queue")
    if (!queue || queue.kind !== "queue") {
      continue
    }

    const queueItems = (queue as QueuePrimitiveFrameState).data.items
    const hasNewAnnotation = queueItems.some(
      (item) => item.annotation === "new"
    )

    if (!hasNewAnnotation) {
      issues.push({
        code: "GRAPH_BFS_ENQUEUE_MARKER_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should show which node was just enqueued.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
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
      code: "GRAPH_BFS_FRAMES_EMPTY",
      kind: "frame",
      severity: "error",
      message: "Graph BFS produced no frames.",
    })

    return createVerificationReport(issues)
  }

  if (finalFrame.visualChangeType !== "result") {
    issues.push({
      code: "GRAPH_BFS_FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final learner-visible frame should communicate the BFS result.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  const answerValue = findStateValue(finalFrame, "answer")
  if (answerValue === undefined || answerValue === "-") {
    issues.push({
      code: "GRAPH_BFS_FINAL_ANSWER_MISSING",
      kind: "pedagogical-integrity",
      severity: "error",
      message: "The result frame must expose the BFS answer in visible state.",
      frameId: finalFrame.id,
      pedagogicalCheck: "hidden-state-loss",
    })
  }

  const graph = findPrimitive(finalFrame, "graph")
  if (
    answerValue &&
    answerValue !== "null" &&
    graph &&
    graph.kind === "graph"
  ) {
    const foundNode = (graph as GraphPrimitiveFrameState).data.nodes.find(
      (node) => node.annotation === "found"
    )

    if (!foundNode) {
      issues.push({
        code: "GRAPH_BFS_FOUND_NODE_MARKER_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message:
          "A successful BFS result frame should visibly mark the found node.",
        frameId: finalFrame.id,
        pedagogicalCheck: "one-visual-change",
      })
    }
  }

  return createVerificationReport(issues)
}

export function verifyQueueBfs(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyTraceShape(events, frames, codeTemplate),
    verifyRequiredViews(frames),
    verifyNeighborChecks(frames),
    verifyQueueMutations(frames),
    verifyFinalFrame(frames)
  )
}
