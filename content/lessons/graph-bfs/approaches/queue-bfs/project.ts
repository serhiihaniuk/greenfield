import type { VisualizationMode } from "@/domains/lessons/types"
import { getLessonViewSpec } from "@/domains/lessons/view-specs"
import {
  defineFrame,
  type Frame,
  type NarrationPayload,
  type VisualChangeType,
} from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import {
  defineGraphPrimitiveFrameState,
  defineQueuePrimitiveFrameState,
  defineStatePrimitiveFrameState,
  type GraphNode,
  type QueueItem,
} from "@/entities/visualization/primitives"
import type {
  ExecutionTokenStyle,
  EdgeHighlightSpec,
  PrimitiveFrameState,
} from "@/entities/visualization/types"
import { queueBfsViewSpecs } from "./views"

type GraphSnapshotNode = {
  id: string
  x: number
  y: number
}

type GraphSnapshotEdge = {
  id: string
  sourceId: string
  targetId: string
}

type GraphBfsSnapshot = {
  nodes: GraphSnapshotNode[]
  edges: GraphSnapshotEdge[]
  startId: string
  targetId: string
  queue: string[]
  visited: string[]
  order: string[]
  currentId?: string
  inspectingNeighborId?: string
  answer?: string | null
}

const CURRENT_TOKEN_ID = "current"
const CURRENT_TOKEN_STYLE: ExecutionTokenStyle = "accent-1"
const CURRENT_TOKEN_LABEL = "current"
const NEIGHBOR_TOKEN_ID = "neighbor"
const NEIGHBOR_TOKEN_STYLE: ExecutionTokenStyle = "accent-3"
const NEIGHBOR_TOKEN_LABEL = "neighbor"

function textSegment(id: string, text: string): NarrationPayload["segments"][number] {
  return {
    id,
    text,
  }
}

function tokenSegment(
  id: string,
  text: string,
  tokenId: string,
  tokenStyle: ExecutionTokenStyle
): NarrationPayload["segments"][number] {
  return {
    id,
    text,
    tokenId,
    tokenStyle,
  }
}

function getCurrentProjectedNodeId(
  event: TraceEvent,
  snapshot: GraphBfsSnapshot
) {
  if (typeof event.payload.currentId === "string") {
    return event.payload.currentId
  }

  if (event.codeLine === "L3" && typeof event.payload.frontId === "string") {
    return event.payload.frontId
  }

  return snapshot.currentId
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

function findEdgeId(
  snapshot: GraphBfsSnapshot,
  sourceId: string | undefined,
  targetId: string | undefined
) {
  if (!sourceId || !targetId) {
    return undefined
  }

  return snapshot.edges.find(
    (edge) =>
      (edge.sourceId === sourceId && edge.targetId === targetId) ||
      (edge.sourceId === targetId && edge.targetId === sourceId)
  )?.id
}

function buildEdgeHighlights(
  event: TraceEvent,
  snapshot: GraphBfsSnapshot
): EdgeHighlightSpec[] {
  const currentId =
    "currentId" in event.payload
      ? String(event.payload.currentId)
      : snapshot.currentId
  const neighborId =
    "neighborId" in event.payload
      ? String(event.payload.neighborId)
      : snapshot.inspectingNeighborId
  const edgeId = findEdgeId(snapshot, currentId, neighborId)

  if (!edgeId || !currentId || !neighborId) {
    return []
  }

  return [
    {
      id: edgeId,
      sourceId: currentId,
      targetId: neighborId,
      tone:
        event.codeLine === "L7"
          ? "compare"
          : event.codeLine === "L8" || event.codeLine === "L9"
            ? "active"
            : "default",
      emphasis: event.codeLine === "L7" ? "strong" : "normal",
    },
  ]
}

function buildGraphNodes(
  event: TraceEvent,
  snapshot: GraphBfsSnapshot
): GraphNode[] {
  const currentId = getCurrentProjectedNodeId(event, snapshot)
  const inspectingNeighborId =
    "neighborId" in event.payload
      ? String(event.payload.neighborId)
      : snapshot.inspectingNeighborId
  const found =
    event.codeLine === "L5" && "found" in event.payload
      ? Boolean(event.payload.found)
      : false

  return snapshot.nodes.map((node) => {
    let status: GraphNode["status"] = "default"
    if (snapshot.answer && snapshot.answer === node.id) {
      status = "found"
    } else if (currentId === node.id) {
      status = "active"
    } else if (snapshot.queue.includes(node.id)) {
      status = "frontier"
    } else if (snapshot.visited.includes(node.id)) {
      status = "visited"
    }

    let annotation: string | undefined
    if (
      node.id === snapshot.targetId &&
      snapshot.answer === null &&
      event.codeLine === "L12"
    ) {
      annotation = "unreached"
    } else if (node.id === snapshot.targetId && snapshot.answer === node.id) {
      annotation = "found"
    } else if (event.codeLine === "L5" && currentId === node.id) {
      annotation = found ? "target" : "not target"
    } else if (event.codeLine === "L7" && inspectingNeighborId === node.id) {
      annotation = Boolean(event.payload.alreadyVisited) ? "visited" : "unseen"
    } else if (event.codeLine === "L8" && inspectingNeighborId === node.id) {
      annotation = "mark visited"
    } else if (event.codeLine === "L9" && inspectingNeighborId === node.id) {
      annotation = "enqueue"
    } else if (event.codeLine === "L3" && event.payload.frontId === node.id) {
      annotation = "front"
    } else if (node.id === snapshot.targetId) {
      annotation = "goal"
    }

    return {
      id: node.id,
      label: node.id,
      tokenId:
        node.id === currentId
          ? CURRENT_TOKEN_ID
          : node.id === inspectingNeighborId
            ? NEIGHBOR_TOKEN_ID
            : undefined,
      tokenLabel:
        node.id === currentId
          ? CURRENT_TOKEN_LABEL
          : node.id === inspectingNeighborId
            ? NEIGHBOR_TOKEN_LABEL
            : undefined,
      tokenStyle:
        node.id === currentId
          ? CURRENT_TOKEN_STYLE
          : node.id === inspectingNeighborId
            ? NEIGHBOR_TOKEN_STYLE
            : undefined,
      x: node.x,
      y: node.y,
      annotation,
      status,
    }
  })
}

function buildQueueItems(
  event: TraceEvent,
  snapshot: GraphBfsSnapshot
): QueueItem[] {
  return snapshot.queue.map((nodeId, index) => ({
    id: `queue-${nodeId}-${index}`,
    label: nodeId,
    tokenId:
      event.codeLine === "L3" && index === 0
        ? CURRENT_TOKEN_ID
        : event.codeLine === "L9" &&
            event.payload.neighborId === nodeId &&
            index === snapshot.queue.length - 1
          ? NEIGHBOR_TOKEN_ID
          : undefined,
    tokenLabel:
      event.codeLine === "L3" && index === 0
        ? CURRENT_TOKEN_LABEL
        : event.codeLine === "L9" &&
            event.payload.neighborId === nodeId &&
            index === snapshot.queue.length - 1
          ? NEIGHBOR_TOKEN_LABEL
          : undefined,
    tokenStyle:
      event.codeLine === "L3" && index === 0
        ? CURRENT_TOKEN_STYLE
        : event.codeLine === "L9" &&
            event.payload.neighborId === nodeId &&
            index === snapshot.queue.length - 1
          ? NEIGHBOR_TOKEN_STYLE
          : undefined,
    status: index === 0 ? "active" : "waiting",
    annotation:
      event.codeLine === "L3" && index === 0
        ? "check"
        : event.codeLine === "L9" &&
            event.payload.neighborId === nodeId &&
            index === snapshot.queue.length - 1
          ? "new"
          : undefined,
  }))
}

function buildNarration(
  event: TraceEvent,
  snapshot: GraphBfsSnapshot
): NarrationPayload {
  switch (event.codeLine) {
    case "L1":
      return {
        summary: `Seed the frontier queue with start node ${snapshot.startId}.`,
        segments: [
          textSegment("text-0", "Seed the frontier queue with start node "),
          textSegment("text-1", snapshot.startId),
          textSegment("text-2", "."),
        ],
        sourceValues: event.payload,
      }
    case "L2":
      return {
        summary: `Mark ${snapshot.startId} visited immediately so BFS never enqueues it again.`,
        segments: [
          textSegment("text-0", "Mark "),
          textSegment("text-1", snapshot.startId),
          textSegment("text-2", " visited immediately so BFS never enqueues it again."),
        ],
        sourceValues: event.payload,
      }
    case "L3":
      return {
        summary: Boolean(event.payload.hasFrontier)
          ? `The frontier is not empty, so BFS can expand ${event.payload.frontId} next.`
          : "The frontier is empty, so the target cannot be reached from the start node.",
        segments: Boolean(event.payload.hasFrontier)
          ? [
              textSegment("text-0", "The frontier is not empty, so "),
              tokenSegment(
                "token-current",
                CURRENT_TOKEN_LABEL,
                CURRENT_TOKEN_ID,
                CURRENT_TOKEN_STYLE
              ),
              textSegment("text-1", " is "),
              textSegment("text-2", String(event.payload.frontId)),
              textSegment("text-3", " and will be expanded next."),
            ]
          : [
              textSegment(
                "text-0",
                "The frontier is empty, so the target cannot be reached from the start node."
              ),
            ],
        sourceValues: event.payload,
      }
    case "L4":
      return {
        summary: `Dequeue ${event.payload.currentId}; it is now the node BFS expands.`,
        segments: [
          textSegment("text-0", "Dequeue "),
          tokenSegment(
            "token-current",
            CURRENT_TOKEN_LABEL,
            CURRENT_TOKEN_ID,
            CURRENT_TOKEN_STYLE
          ),
          textSegment("text-1", " = "),
          textSegment("text-2", String(event.payload.currentId)),
          textSegment("text-3", "; it is now the node BFS expands."),
        ],
        sourceValues: event.payload,
      }
    case "L5":
      return {
        summary: Boolean(event.payload.found)
          ? `${event.payload.currentId} matches the target, so BFS stops.`
          : `${event.payload.currentId} is not the target, so inspect its neighbors.`,
        segments: Boolean(event.payload.found)
          ? [
              tokenSegment(
                "token-current",
                CURRENT_TOKEN_LABEL,
                CURRENT_TOKEN_ID,
                CURRENT_TOKEN_STYLE
              ),
              textSegment("text-0", " = "),
              textSegment("text-1", String(event.payload.currentId)),
              textSegment("text-2", " matches the target, so BFS stops."),
            ]
          : [
              tokenSegment(
                "token-current",
                CURRENT_TOKEN_LABEL,
                CURRENT_TOKEN_ID,
                CURRENT_TOKEN_STYLE
              ),
              textSegment("text-0", " = "),
              textSegment("text-1", String(event.payload.currentId)),
              textSegment(
                "text-2",
                " is not the target, so inspect its neighbors."
              ),
            ],
        sourceValues: event.payload,
      }
    case "L7":
      return {
        summary: Boolean(event.payload.alreadyVisited)
          ? `Neighbor ${event.payload.neighborId} was already visited, so BFS skips it.`
          : `Neighbor ${event.payload.neighborId} is unseen and should join the frontier.`,
        segments: Boolean(event.payload.alreadyVisited)
          ? [
              tokenSegment(
                "token-current",
                CURRENT_TOKEN_LABEL,
                CURRENT_TOKEN_ID,
                CURRENT_TOKEN_STYLE
              ),
              textSegment("text-current-0", " checks "),
              tokenSegment(
                "token-neighbor",
                NEIGHBOR_TOKEN_LABEL,
                NEIGHBOR_TOKEN_ID,
                NEIGHBOR_TOKEN_STYLE
              ),
              textSegment("text-neighbor-0", " = "),
              textSegment("text-neighbor-1", String(event.payload.neighborId)),
              textSegment(
                "text-neighbor-2",
                " and finds it was already visited, so BFS skips it."
              ),
            ]
          : [
              tokenSegment(
                "token-current",
                CURRENT_TOKEN_LABEL,
                CURRENT_TOKEN_ID,
                CURRENT_TOKEN_STYLE
              ),
              textSegment("text-current-0", " checks "),
              tokenSegment(
                "token-neighbor",
                NEIGHBOR_TOKEN_LABEL,
                NEIGHBOR_TOKEN_ID,
                NEIGHBOR_TOKEN_STYLE
              ),
              textSegment("text-neighbor-0", " = "),
              textSegment("text-neighbor-1", String(event.payload.neighborId)),
              textSegment(
                "text-neighbor-2",
                " and sees it is unseen, so it should join the frontier."
              ),
            ],
        sourceValues: event.payload,
      }
    case "L8":
      return {
        summary: `Add ${event.payload.neighborId} to the visited set before enqueuing it.`,
        segments: [
          tokenSegment(
            "token-current",
            CURRENT_TOKEN_LABEL,
            CURRENT_TOKEN_ID,
            CURRENT_TOKEN_STYLE
          ),
          textSegment("text-0", " marks "),
          tokenSegment(
            "token-neighbor",
            NEIGHBOR_TOKEN_LABEL,
            NEIGHBOR_TOKEN_ID,
            NEIGHBOR_TOKEN_STYLE
          ),
          textSegment("text-1", " = "),
          textSegment("text-2", String(event.payload.neighborId)),
          textSegment("text-3", " visited before enqueuing it."),
        ],
        sourceValues: event.payload,
      }
    case "L9":
      return {
        summary: `Enqueue ${event.payload.neighborId} at the back of the frontier queue.`,
        segments: [
          tokenSegment(
            "token-current",
            CURRENT_TOKEN_LABEL,
            CURRENT_TOKEN_ID,
            CURRENT_TOKEN_STYLE
          ),
          textSegment("text-0", " enqueues "),
          tokenSegment(
            "token-neighbor",
            NEIGHBOR_TOKEN_LABEL,
            NEIGHBOR_TOKEN_ID,
            NEIGHBOR_TOKEN_STYLE
          ),
          textSegment("text-1", " = "),
          textSegment("text-2", String(event.payload.neighborId)),
          textSegment("text-3", " at the back of the frontier queue."),
        ],
        sourceValues: event.payload,
      }
    case "L12":
      return {
        summary:
          "Return null because BFS exhausted the frontier without finding the target.",
        segments: [
          textSegment(
            "text-0",
            "Return null because BFS exhausted the frontier without finding the target."
          ),
        ],
        sourceValues: event.payload,
      }
    default:
      return {
        summary: snapshot.answer
          ? `Return found node ${snapshot.answer}.`
          : "Advance the BFS frontier.",
        segments: snapshot.answer
          ? [
              textSegment("text-0", "Return found node "),
              textSegment("text-1", snapshot.answer),
              textSegment("text-2", "."),
            ]
          : [textSegment("text-0", "Advance the BFS frontier.")],
        sourceValues: event.payload,
      }
  }
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: GraphBfsSnapshot,
  _mode: VisualizationMode
): PrimitiveFrameState[] {
  const graphView = getLessonViewSpec(queueBfsViewSpecs, "graph")
  const graphPrimitive = defineGraphPrimitiveFrameState({
    id: "graph",
    kind: "graph",
    title: graphView.title,
    subtitle:
      "Visited nodes stay behind the frontier while BFS expands the oldest queued node first.",
    data: {
      nodes: buildGraphNodes(event, snapshot),
      edges: snapshot.edges,
    },
    edgeHighlights: buildEdgeHighlights(event, snapshot),
    viewport: graphView.viewport,
  })

  const queueView = getLessonViewSpec(queueBfsViewSpecs, "frontier-queue")
  const queuePrimitive = defineQueuePrimitiveFrameState({
    id: "frontier-queue",
    kind: "queue",
    title: queueView.title,
    subtitle:
      "The front dequeues first and newly discovered nodes enter at the back.",
    data: {
      items: buildQueueItems(event, snapshot),
      frontLabel: "front",
      backLabel: "back",
    },
    viewport: queueView.viewport,
  })

  const stateView = getLessonViewSpec(queueBfsViewSpecs, "frontier-state")
  const statePrimitive = defineStatePrimitiveFrameState({
    id: "frontier-state",
    kind: "state",
    title: stateView.title,
    data: {
      values: [
        { label: "start", value: snapshot.startId },
        { label: "target", value: snapshot.targetId },
        {
          label: "current",
          value: getCurrentProjectedNodeId(event, snapshot) ?? "-",
          tokenId:
            getCurrentProjectedNodeId(event, snapshot) !== undefined
              ? CURRENT_TOKEN_ID
              : undefined,
          tokenStyle:
            getCurrentProjectedNodeId(event, snapshot) !== undefined
              ? CURRENT_TOKEN_STYLE
              : undefined,
        },
        {
          label: "neighbor",
          value: snapshot.inspectingNeighborId ?? "-",
          tokenId: snapshot.inspectingNeighborId
            ? NEIGHBOR_TOKEN_ID
            : undefined,
          tokenStyle: snapshot.inspectingNeighborId
            ? NEIGHBOR_TOKEN_STYLE
            : undefined,
        },
        { label: "frontier", value: snapshot.queue.join(" -> ") || "-" },
        { label: "visited", value: snapshot.visited.join(", ") || "-" },
        { label: "order", value: snapshot.order.join(", ") || "-" },
        {
          label: "answer",
          value:
            snapshot.answer === undefined
              ? "-"
              : snapshot.answer === null
                ? "null"
                : snapshot.answer,
        },
      ],
    },
    viewport: stateView.viewport,
  })

  return [graphPrimitive, queuePrimitive, statePrimitive]
}

export function projectQueueBfs(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  return events
    .filter((event) => event.type !== "complete")
    .map((event, index) => {
      const snapshot = event.snapshot as GraphBfsSnapshot

      return defineFrame({
        id: `frame-${index + 1}`,
        sourceEventId: event.id,
        codeLine: event.codeLine,
        visualChangeType: mapEventToVisualChange(event),
        narration: buildNarration(event, snapshot),
        primitives: buildPrimitiveStates(event, snapshot, mode),
        checks: [
          {
            id: `frame-${index + 1}-sync`,
            kind: "code-line-sync",
            status: "pass",
            message: "Frame is aligned to a single code line.",
          },
          {
            id: `frame-${index + 1}-single-change`,
            kind: "one-visual-change",
            status: "pass",
            message: "Frame declares a single learner-visible change category.",
          },
          {
            id: `frame-${index + 1}-viewport`,
            kind: "viewport",
            status: "pass",
            message:
              "Frame stays inside the desktop playback viewport contract.",
          },
        ],
      })
    })
}
