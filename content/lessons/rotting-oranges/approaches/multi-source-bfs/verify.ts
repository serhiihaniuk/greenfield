import type { CodeTemplate } from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  GridPrimitiveFrameState,
  QueuePrimitiveFrameState,
  StatePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import { areGridNeighbors, buildGridCellCoordinateMap } from "@/domains/verification/grid"
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
  const visibleEvents = events.filter((event) => {
    if (event.type === "complete") {
      return false
    }

    if (event.codeLine === "L4") {
      return false
    }

    if (event.codeLine === "L5" && event.payload.hasFrontier === false) {
      return false
    }

    return true
  })
  const completionEvent = events.at(-1)
  const codeLines = new Set(codeTemplate.lines.map((line) => line.id))

  if (frames.length !== visibleEvents.length) {
    issues.push({
      code: "ROTTING_ORANGES_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `Rotting Oranges should project one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "ROTTING_ORANGES_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Rotting Oranges trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "ROTTING_ORANGES_FRAME_CODE_LINE_MISSING",
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
    const grid = findPrimitive(frame, "grid")
    const queue = findPrimitive(frame, "frontier-queue")
    const state = findPrimitive(frame, "rotting-state")

    if (!grid || grid.kind !== "grid") {
      issues.push({
        code: "ROTTING_ORANGES_GRID_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the orange grid as the primary surface.`,
        frameId: frame.id,
      })
    }

    if (!queue || queue.kind !== "queue") {
      issues.push({
        code: "ROTTING_ORANGES_QUEUE_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the frontier queue beside the grid.`,
        frameId: frame.id,
      })
    }

    if (!state || state.kind !== "state") {
      issues.push({
        code: "ROTTING_ORANGES_STATE_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the compact rotting state panel.`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyGridFrontierConsistency(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const grid = findPrimitive(frame, "grid")
    const queue = findPrimitive(frame, "frontier-queue")
    if (!grid || grid.kind !== "grid" || !queue || queue.kind !== "queue") {
      continue
    }

    const gridPrimitive = grid as GridPrimitiveFrameState
    const queuePrimitive = queue as QueuePrimitiveFrameState
    const queuedCoordinates = new Set(
      queuePrimitive.data.items.map((item) => item.label)
    )
    const frontierCells = gridPrimitive.data.cells
      .filter((cell) => cell.state === "frontier")
      .map((cell) => `(${cell.row}, ${cell.col})`)

    for (const coordinate of queuedCoordinates) {
      if (!frontierCells.includes(coordinate)) {
        issues.push({
          code: "ROTTING_ORANGES_FRONTIER_QUEUE_MISMATCH",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" queues ${coordinate} without showing it as frontier in the grid.`,
          frameId: frame.id,
          pedagogicalCheck: "hidden-state-loss",
        })
      }
    }
  }

  return createVerificationReport(issues)
}

function verifyGridNeighborLegality(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (!["L8", "L10"].includes(frame.codeLine)) {
      continue
    }

    const grid = findPrimitive(frame, "grid")
    if (!grid || grid.kind !== "grid") {
      continue
    }

    const gridPrimitive = grid as GridPrimitiveFrameState
    const cellMap = buildGridCellCoordinateMap(gridPrimitive)
    const currentCellId = frame.narration.sourceValues.currentCellId
    const neighborCellId =
      frame.narration.sourceValues.neighborCellId ??
      (frame.narration.sourceValues.neighbor as { cellId?: string } | undefined)?.cellId

    if (typeof currentCellId !== "string" || typeof neighborCellId !== "string") {
      continue
    }

    const current = cellMap.get(currentCellId)
    const neighbor = cellMap.get(neighborCellId)

    if (!current || !neighbor) {
      continue
    }

    if (!areGridNeighbors(current, neighbor, gridPrimitive.data.adjacencyMode)) {
      issues.push({
        code: "ROTTING_ORANGES_ILLEGAL_NEIGHBOR_HOP",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" implies an illegal grid hop from ${currentCellId} to ${neighborCellId}.`,
        frameId: frame.id,
        pedagogicalCheck: "one-visual-change",
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyVisitedStateContinuity(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const seenRotten = new Set<string>()

  for (const frame of frames) {
    const grid = findPrimitive(frame, "grid")
    if (!grid || grid.kind !== "grid") {
      continue
    }

    const gridPrimitive = grid as GridPrimitiveFrameState
    const rottenNow = new Set(
      gridPrimitive.data.cells
        .filter((cell) =>
          ["frontier", "visited", "source", "done"].includes(cell.state)
        )
        .map((cell) => cell.id)
    )

    for (const cellId of seenRotten) {
      if (!rottenNow.has(cellId)) {
        issues.push({
          code: "ROTTING_ORANGES_ROTTEN_CELL_REVERTED",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" loses rotten cell "${cellId}" even though rotting should be irreversible.`,
          frameId: frame.id,
          pedagogicalCheck: "hidden-state-loss",
        })
      }
    }

    rottenNow.forEach((cellId) => seenRotten.add(cellId))
  }

  return createVerificationReport(issues)
}

function verifyStructuredNarration(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const narration = frame.narration

    if (
      ["L3", "L5", "L6", "L8", "L10", "L13"].includes(frame.codeLine) &&
      (!narration.headline || !narration.reason || !narration.implication)
    ) {
      issues.push({
        code: "ROTTING_ORANGES_STRUCTURED_NARRATION_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should expose headline, reason, and implication for the active grid-traversal step.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    const tokenIds = new Set(
      (narration.segments ?? [])
        .map((segment) => segment.tokenId)
        .filter((tokenId): tokenId is string => Boolean(tokenId))
    )
    for (const clause of [narration.headline, narration.reason, narration.implication]) {
      for (const segment of clause?.segments ?? []) {
        if (segment.tokenId) {
          tokenIds.add(segment.tokenId)
        }
      }
    }

    if (["L6", "L8", "L10"].includes(frame.codeLine) && !tokenIds.has("current")) {
      issues.push({
        code: "ROTTING_ORANGES_CURRENT_TOKEN_MISSING",
        kind: "pedagogical-integrity",
        severity: "error",
        message: `Frame "${frame.id}" should explain the step through the shared current token.`,
        frameId: frame.id,
        pedagogicalCheck: "narration-mismatch",
      })
    }

    if (["L8", "L10"].includes(frame.codeLine)) {
      const neighbor = frame.narration.sourceValues.neighbor as
        | { inBounds?: boolean; cellId?: string; isFresh?: boolean }
        | undefined
      const neighborIsReal = neighbor?.inBounds && typeof neighbor?.cellId === "string"
      if (neighborIsReal && !tokenIds.has("neighbor")) {
        issues.push({
          code: "ROTTING_ORANGES_NEIGHBOR_TOKEN_MISSING",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" should explain the inspected matrix neighbor through the shared neighbor token.`,
          frameId: frame.id,
          pedagogicalCheck: "narration-mismatch",
        })
      }
    }
  }

  return createVerificationReport(issues)
}

function verifyResultFrame(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const finalFrame = frames.at(-1)
  if (!finalFrame) {
    return createVerificationReport([
      {
        code: "ROTTING_ORANGES_FRAMES_EMPTY",
        kind: "frame",
        severity: "error",
        message: "Rotting Oranges produced no frames.",
      },
    ])
  }

  const state = findPrimitive(finalFrame, "rotting-state")
  const typedState = state && state.kind === "state" ? (state as StatePrimitiveFrameState) : undefined
  const answerValue = typedState?.data.values.find((entry) => entry.label === "answer")?.value

  if (finalFrame.visualChangeType !== "result") {
    issues.push({
      code: "ROTTING_ORANGES_FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "error",
      message: `Final frame "${finalFrame.id}" should be a result frame.`,
      frameId: finalFrame.id,
      pedagogicalCheck: "one-visual-change",
    })
  }

  if (answerValue === undefined) {
    issues.push({
      code: "ROTTING_ORANGES_FINAL_ANSWER_MISSING",
      kind: "pedagogical-integrity",
      severity: "error",
      message: `Final frame "${finalFrame.id}" should make the answer explicit in state.`,
      frameId: finalFrame.id,
      pedagogicalCheck: "hidden-state-loss",
    })
  }

  return createVerificationReport(issues)
}

export function verifyMultiSourceBfs(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyTraceShape(events, frames, codeTemplate),
    verifyRequiredViews(frames),
    verifyGridFrontierConsistency(frames),
    verifyGridNeighborLegality(frames),
    verifyVisitedStateContinuity(frames),
    verifyStructuredNarration(frames),
    verifyResultFrame(frames)
  )
}
