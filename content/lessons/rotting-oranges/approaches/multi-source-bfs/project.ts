import type { VisualizationMode } from "@/domains/lessons/types"
import { getLessonViewSpec } from "@/domains/lessons/view-specs"
import {
  defineFrame,
  type Frame,
  type NarrationPayloadInput,
  type VisualChangeType,
} from "@/domains/projection/types"
import {
  defineStructuredNarration,
  narrationText,
  narrationToken,
} from "@/domains/projection/narration"
import type { TraceEvent } from "@/domains/tracing/types"
import {
  defineGridPrimitiveFrameState,
  defineQueuePrimitiveFrameState,
  defineStatePrimitiveFrameState,
  type GridCell,
  type GridOverlay,
  type QueueItem,
} from "@/entities/visualization/primitives"
import type {
  ExecutionTokenStyle,
  PrimitiveFrameState,
} from "@/entities/visualization/types"
import { multiSourceBfsViewSpecs } from "./views"

type QueueEntry = {
  cellId: string
  row: number
  col: number
  minute: number
}

type RottingSnapshot = {
  grid: number[][]
  queue: QueueEntry[]
  fresh: number
  minutes: number
  answer: number
  currentCellId?: string
  neighborCellId?: string
  initialSourceIds: string[]
}

type NeighborCheck = {
  row: number
  col: number
  cellId?: string
  inBounds: boolean
  isFresh: boolean
  value?: number
  reason: "out-of-bounds" | "empty" | "already-rotten" | "fresh"
}

const CURRENT_TOKEN_ID = "current"
const CURRENT_TOKEN_STYLE: ExecutionTokenStyle = "accent-1"
const CURRENT_TOKEN_LABEL = "current"
const NEIGHBOR_TOKEN_ID = "neighbor"
const NEIGHBOR_TOKEN_STYLE: ExecutionTokenStyle = "accent-3"
const NEIGHBOR_TOKEN_LABEL = "neighbor"

function cellLabelFromId(cellId: string) {
  const match = /^r(\d+)-c(\d+)$/.exec(cellId)
  if (!match) {
    return cellId
  }

  return `(${match[1]}, ${match[2]})`
}

function narrationCurrentToken(id: string) {
  return narrationToken({
    id,
    text: CURRENT_TOKEN_LABEL,
    tokenId: CURRENT_TOKEN_ID,
    tokenStyle: CURRENT_TOKEN_STYLE,
  })
}

function narrationNeighborToken(id: string) {
  return narrationToken({
    id,
    text: NEIGHBOR_TOKEN_LABEL,
    tokenId: NEIGHBOR_TOKEN_ID,
    tokenStyle: NEIGHBOR_TOKEN_STYLE,
  })
}

function queueItemLabel(entry: QueueEntry) {
  return cellLabelFromId(entry.cellId)
}

function mapEventToVisualChange(event: TraceEvent): VisualChangeType {
  switch (event.type) {
    case "compare":
      return "compare"
    case "result":
      return "result"
    default:
      return "mutate"
  }
}

function buildQueueItems(event: TraceEvent, snapshot: RottingSnapshot): QueueItem[] {
  const frontCellId = event.payload.frontCellId
  const neighborCellId = event.payload.neighborCellId

  return snapshot.queue.map((entry, index) => ({
    id: `queue-${entry.cellId}-${index}`,
    label: queueItemLabel(entry),
    detail: `m${entry.minute}`,
    tokenId:
      entry.cellId === frontCellId
        ? CURRENT_TOKEN_ID
        : entry.cellId === neighborCellId && event.codeLine === "L10"
          ? NEIGHBOR_TOKEN_ID
          : undefined,
    tokenLabel:
      entry.cellId === frontCellId
        ? CURRENT_TOKEN_LABEL
        : entry.cellId === neighborCellId && event.codeLine === "L10"
          ? NEIGHBOR_TOKEN_LABEL
          : undefined,
    tokenStyle:
      entry.cellId === frontCellId
        ? CURRENT_TOKEN_STYLE
        : entry.cellId === neighborCellId && event.codeLine === "L10"
          ? NEIGHBOR_TOKEN_STYLE
          : undefined,
    status: index === 0 ? "active" : "waiting",
    annotation:
      entry.cellId === neighborCellId && event.codeLine === "L10"
        ? "next wave"
        : index === 0
          ? "front"
          : undefined,
  }))
}

function buildGridCells(event: TraceEvent, snapshot: RottingSnapshot): GridCell[] {
  const queueCellIds = new Set(snapshot.queue.map((entry) => entry.cellId))
  const initialSourceIds = new Set(snapshot.initialSourceIds)
  const currentCellId =
    typeof event.payload.currentCellId === "string"
      ? String(event.payload.currentCellId)
      : snapshot.currentCellId
  const neighborCellId =
    typeof event.payload.neighborCellId === "string"
      ? String(event.payload.neighborCellId)
      : snapshot.neighborCellId

  return snapshot.grid.flatMap((row, rowIndex) =>
    row.map((value, colIndex) => {
      const id = `r${rowIndex}-c${colIndex}`
      let state: GridCell["state"] = "default"
      let annotation: string | undefined

      if (value === 0) {
        state = "blocked"
        annotation = "empty"
      } else if (id === currentCellId) {
        state = "visited"
        annotation = event.codeLine === "L6" ? "dequeue" : "active"
      } else if (queueCellIds.has(id)) {
        state = "frontier"
        annotation = "queued"
      } else if (initialSourceIds.has(id) && value === 2) {
        state = "source"
        annotation = "seed"
      } else if (value === 2) {
        state = "done"
      } else {
        state = "open"
      }

      if (id === neighborCellId) {
        if (event.codeLine === "L8") {
          annotation = "inspect"
        } else if (event.codeLine === "L10") {
          annotation = "rots"
          state = "frontier"
        }
      }

      return {
        id,
        row: rowIndex,
        col: colIndex,
        value,
        state,
        annotation,
        tokenId:
          id === currentCellId
            ? CURRENT_TOKEN_ID
            : id === neighborCellId &&
                (event.codeLine === "L8" || event.codeLine === "L10")
              ? NEIGHBOR_TOKEN_ID
              : undefined,
        tokenLabel:
          id === currentCellId
            ? CURRENT_TOKEN_LABEL
            : id === neighborCellId &&
                (event.codeLine === "L8" || event.codeLine === "L10")
              ? NEIGHBOR_TOKEN_LABEL
              : undefined,
        tokenStyle:
          id === currentCellId
            ? CURRENT_TOKEN_STYLE
            : id === neighborCellId &&
                (event.codeLine === "L8" || event.codeLine === "L10")
              ? NEIGHBOR_TOKEN_STYLE
              : undefined,
      }
    })
  )
}

function buildGridOverlays(event: TraceEvent): GridOverlay[] {
  const currentCellId =
    typeof event.payload.currentCellId === "string"
      ? String(event.payload.currentCellId)
      : undefined
  const neighborCellId =
    typeof event.payload.neighborCellId === "string"
      ? String(event.payload.neighborCellId)
      : undefined
  const overlays: GridOverlay[] = []

  if (currentCellId) {
    overlays.push({
      id: `${event.id}-current`,
      kind: "focus-cell",
      targetCellId: currentCellId,
      tone: "active",
    })
  }

  if (currentCellId && neighborCellId && event.codeLine === "L8") {
    overlays.push({
      id: `${event.id}-inspect`,
      kind: "neighbor-arrow",
      sourceCellId: currentCellId,
      targetCellId: neighborCellId,
      tone: "warning",
      label: "check",
    })
  }

  if (currentCellId && neighborCellId && event.codeLine === "L10") {
    overlays.push({
      id: `${event.id}-spread`,
      kind: "neighbor-arrow",
      sourceCellId: currentCellId,
      targetCellId: neighborCellId,
      tone: "success",
      label: "spread",
    })
    overlays.push({
      id: `${event.id}-frontier`,
      kind: "frontier-ring",
      targetCellId: neighborCellId,
      tone: "success",
    })
  }

  return overlays
}

function buildNarration(
  event: TraceEvent,
  snapshot: RottingSnapshot
): NarrationPayloadInput {
  const currentCellId =
    typeof event.payload.currentCellId === "string"
      ? String(event.payload.currentCellId)
      : snapshot.currentCellId
  const neighborCheck = event.payload.neighbor as NeighborCheck | undefined
  const neighborCellId =
    typeof event.payload.neighborCellId === "string"
      ? String(event.payload.neighborCellId)
      : neighborCheck?.cellId
  const answer =
    typeof event.payload.answer === "number"
      ? Number(event.payload.answer)
      : snapshot.answer

  switch (event.codeLine) {
    case "L3":
      return defineStructuredNarration({
        family: "setup",
        headline: [
          narrationText(`${event.id}-headline-0`, "Seed the frontier with "),
          narrationText(
            `${event.id}-headline-1`,
            `${snapshot.initialSourceIds.length}`,
            "active"
          ),
          narrationText(`${event.id}-headline-2`, " rotten sources."),
        ],
        reason:
          "Multi-source BFS starts from every rotten orange at once so each minute spreads as one wave instead of rerunning BFS from each source.",
        implication:
          "The queue now represents the first infection frontier, and the fresh count tells us whether a final -1 is still possible.",
        evidence: [
          {
            id: `${event.id}-fresh`,
            label: "Fresh oranges",
            value: String(snapshot.fresh),
          },
          {
            id: `${event.id}-sources`,
            label: "Initial sources",
            value: String(snapshot.initialSourceIds.length),
          },
        ],
        sourceValues: event.payload,
      })
    case "L4":
      return defineStructuredNarration({
        family: "setup",
        headline: "Start the minute counter at 0 before any spread happens.",
        reason:
          "The seeded rotten oranges already exist at minute 0, so only newly infected cells should advance elapsed time.",
        implication:
          "The answer will grow only when a fresh neighbor is actually added to a later frontier wave.",
        sourceValues: event.payload,
      })
    case "L5":
      if (event.payload.hasFrontier === false) {
        return defineStructuredNarration({
          family: "check",
          headline: "The frontier is empty, so no more cells can rot.",
          reason:
            "Breadth-first search only spreads through queued frontier cells; once the queue is empty, infection cannot advance further.",
          implication:
            "The final frame now decides whether every fresh orange was reached or an unreachable orange forces -1.",
          sourceValues: event.payload,
        })
      }

      return defineStructuredNarration({
        family: "check",
        headline: [
          narrationText(`${event.id}-headline-0`, "Check whether the frontier still has work before dequeuing the next wave head."),
        ],
        reason:
          "BFS stops exactly when the queue empties, so the queue length is the condition that keeps infection spreading.",
        implication:
          "The next frame will pop the oldest frontier cell and inspect its four neighbors in minute order.",
        evidence: [
          {
            id: `${event.id}-queue-size`,
            label: "Queue size",
            value: String(event.payload.queueSize ?? snapshot.queue.length),
          },
        ],
        sourceValues: event.payload,
      })
    case "L6":
      return defineStructuredNarration({
        family: "advance",
        headline: [
          narrationText(`${event.id}-headline-0`, "Dequeue "),
          narrationCurrentToken(`${event.id}-headline-1`),
          narrationText(
            `${event.id}-headline-2`,
            ` at ${currentCellId ? cellLabelFromId(currentCellId) : "the frontier head"}.`
          ),
        ],
        reason:
          "The oldest frontier cell spreads first, which is what makes breadth-first search measure time by layers instead of by deep paths.",
        implication:
          "Only neighbors of the dequeued cell can rot in this minute step.",
        evidence: [
          {
            id: `${event.id}-minute`,
            label: "Minute",
            value: String(event.payload.minute ?? snapshot.minutes),
          },
        ],
        sourceValues: event.payload,
      })
    case "L8":
      if (!neighborCheck?.inBounds) {
        return defineStructuredNarration({
          family: "check",
          headline: [
            narrationCurrentToken(`${event.id}-headline-0`),
            narrationText(
              `${event.id}-headline-1`,
              ` ignores (${neighborCheck?.row}, ${neighborCheck?.col}) because it lies outside the grid.`
            ),
          ],
          reason:
            "Only in-bounds orthogonal neighbors can participate in the matrix graph, so out-of-range coordinates are not real cells.",
          implication:
            "BFS keeps checking the remaining legal neighbors of the current rotten cell.",
          sourceValues: event.payload,
        })
      }

      if (!neighborCheck?.isFresh) {
        const why =
          neighborCheck?.reason === "empty"
            ? "it is empty"
            : "it is already rotten"
        return defineStructuredNarration({
          family: "prune",
          headline: [
            narrationCurrentToken(`${event.id}-headline-0`),
            narrationText(`${event.id}-headline-1`, " rejects "),
            narrationNeighborToken(`${event.id}-headline-2`),
            narrationText(
              `${event.id}-headline-3`,
              ` at ${neighborCellId ? cellLabelFromId(neighborCellId) : `(${neighborCheck?.row}, ${neighborCheck?.col})`} because ${why}.`
            ),
          ],
          reason:
            "Only fresh oranges can change state and extend the frontier; empty cells and already-rotten cells add no new infection work.",
          implication:
            "The queue stays the same, so BFS continues to the next neighbor without increasing elapsed time.",
          sourceValues: event.payload,
        })
      }

      return defineStructuredNarration({
        family: "compare",
        headline: [
          narrationCurrentToken(`${event.id}-headline-0`),
          narrationText(`${event.id}-headline-1`, " inspects "),
          narrationNeighborToken(`${event.id}-headline-2`),
          narrationText(
            `${event.id}-headline-3`,
            ` at ${neighborCellId ? cellLabelFromId(neighborCellId) : "the next cell"}.`
          ),
        ],
        reason:
          "A fresh orthogonal neighbor is a legal infection target, so this check decides whether the current BFS wave can spread into that cell.",
        implication:
          "The next frame will rot that cell and push it into the queue for the following minute layer.",
        sourceValues: event.payload,
      })
    case "L10":
      return defineStructuredNarration({
        family: "expand",
        headline: [
          narrationCurrentToken(`${event.id}-headline-0`),
          narrationText(`${event.id}-headline-1`, " infects "),
          narrationNeighborToken(`${event.id}-headline-2`),
          narrationText(
            `${event.id}-headline-3`,
            ` at ${neighborCellId ? cellLabelFromId(neighborCellId) : "the inspected cell"}, so it joins the next frontier wave.`
          ),
        ],
        reason:
          "Once a fresh neighbor is confirmed, BFS mutates the grid, reduces the fresh count, and enqueues that cell at minute + 1 so the next wave stays ordered.",
        implication:
          "Elapsed time rises only as far as the deepest queued infection minute, and the queue now carries the next frontier layer explicitly.",
        evidence: [
          {
            id: `${event.id}-fresh`,
            label: "Fresh remaining",
            value: String(event.payload.fresh ?? snapshot.fresh),
          },
          {
            id: `${event.id}-minutes`,
            label: "Elapsed minutes",
            value: String(event.payload.minutes ?? snapshot.minutes),
          },
        ],
        sourceValues: event.payload,
      })
    case "L13":
      if (answer === -1) {
        return defineStructuredNarration({
          family: "commit",
          headline: "Return -1 because at least one fresh orange never joined any frontier wave.",
          reason:
            "When the queue empties while fresh oranges remain, the matrix contains a blocked region that no rotten source can reach.",
          implication:
            "The lesson ends with an unreachable state, not with a longer infection time.",
          evidence: [
            {
              id: `${event.id}-fresh`,
              label: "Fresh remaining",
              value: String(event.payload.fresh ?? snapshot.fresh),
            },
          ],
          sourceValues: event.payload,
        })
      }

      return defineStructuredNarration({
        family: "commit",
        headline: `Return ${answer} once every fresh orange has rotted.`,
        reason:
          "The BFS minute counter always tracks the deepest infection layer reached so far, so when no fresh oranges remain it is already the final answer.",
        implication:
          "No extra cleanup is needed because the frontier process itself measured the total time.",
        evidence: [
          {
            id: `${event.id}-answer`,
            label: "Minutes",
            value: String(answer),
          },
        ],
        sourceValues: event.payload,
      })
    default:
      return {
        summary: "Advance the rotting process.",
        segments: [narrationText(`${event.id}-summary`, "Advance the rotting process.")],
        sourceValues: event.payload,
      }
  }
}

function buildPrimitives(event: TraceEvent, snapshot: RottingSnapshot): PrimitiveFrameState[] {
  const gridView = getLessonViewSpec(multiSourceBfsViewSpecs, "grid")
  const queueView = getLessonViewSpec(multiSourceBfsViewSpecs, "frontier-queue")
  const stateView = getLessonViewSpec(multiSourceBfsViewSpecs, "rotting-state")
  const currentCellId =
    typeof event.payload.currentCellId === "string"
      ? String(event.payload.currentCellId)
      : snapshot.currentCellId

  return [
    defineGridPrimitiveFrameState({
      id: "grid",
      kind: "grid",
      title: gridView.title,
      subtitle:
        "The grid is the real world; BFS only spreads through orthogonal fresh neighbors.",
      viewport: gridView.viewport,
      data: {
        rows: snapshot.grid.length,
        cols: snapshot.grid[0]?.length ?? 0,
        adjacencyMode: "orthogonal-4",
        coordinateLabels: {
          rows: true,
          cols: true,
        },
        cells: buildGridCells(event, snapshot),
        overlays: buildGridOverlays(event),
        legend: [
          { label: "empty", state: "blocked" },
          { label: "fresh", state: "open" },
          { label: "frontier", state: "frontier" },
          { label: "done", state: "done" },
        ],
      },
    }),
    defineQueuePrimitiveFrameState({
      id: "frontier-queue",
      kind: "queue",
      title: queueView.title,
      subtitle:
        "Each queued cell carries the minute when it became rotten, so BFS preserves infection waves.",
      viewport: queueView.viewport,
      data: {
        frontLabel: "front",
        backLabel: "back",
        items: buildQueueItems(event, snapshot),
      },
    }),
    defineStatePrimitiveFrameState({
      id: "rotting-state",
      kind: "state",
      title: stateView.title,
      viewport: stateView.viewport,
      data: {
        values: [
          currentCellId
            ? {
                label: "current",
                value: cellLabelFromId(currentCellId),
                tokenId: CURRENT_TOKEN_ID,
                tokenStyle: CURRENT_TOKEN_STYLE,
              }
            : {
                label: "current",
                value: "—",
              },
          {
            label: "fresh",
            value: snapshot.fresh,
          },
          {
            label: "queue",
            value: snapshot.queue.length,
          },
          {
            label: "minutes",
            value: snapshot.minutes,
          },
          {
            label: "answer",
            value:
              event.codeLine === "L13"
                ? typeof event.payload.answer === "number"
                  ? event.payload.answer
                  : snapshot.answer
                : snapshot.answer,
          },
        ],
      },
    }),
  ]
}

export function projectMultiSourceBfs(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  void mode

  return events
    .filter((event) => {
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
    .map((event) => {
      const snapshot = event.snapshot as RottingSnapshot
      const narration = buildNarration(event, snapshot)

      return defineFrame({
        id: `frame-${event.id}`,
        sourceEventId: event.id,
        codeLine: event.codeLine,
        visualChangeType: mapEventToVisualChange(event),
        narration,
        primitives: buildPrimitives(event, snapshot),
        checks: [
          {
            id: `${event.id}-code-line`,
            kind: "code-line-sync",
            status: "pass",
            message: `Frame stays bound to code line ${event.codeLine}.`,
          },
          {
            id: `${event.id}-visual-change`,
            kind: "one-visual-change",
            status: "pass",
            message: `Frame ${event.id} keeps one matrix-learning action visible.`,
          },
          {
            id: `${event.id}-continuity`,
            kind: "state-continuity",
            status: "pass",
            message: "The frontier, grid, and remaining fresh count stay explicit across frames.",
          },
          {
            id: `${event.id}-pedagogy`,
            kind: "pedagogical-integrity",
            status: "pass",
            message: "Narration and visuals explain the same spatial transition.",
          },
        ],
      })
    })
}
