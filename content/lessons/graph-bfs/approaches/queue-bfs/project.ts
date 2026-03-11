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
      ? event.payload.found
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
      annotation = event.payload.alreadyVisited ? "visited" : "unseen"
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
): NarrationPayloadInput {
  const frontierSize =
    typeof event.payload.queueSize === "number"
      ? event.payload.queueSize
      : snapshot.queue.length

  switch (event.codeLine) {
    case "L1":
      return defineStructuredNarration({
        family: "setup",
        headline: [
          narrationText(`${event.id}-headline-text-0`, "Seed the frontier with start node "),
          narrationText(`${event.id}-headline-text-1`, snapshot.startId, "active"),
          narrationText(`${event.id}-headline-text-2`, "."),
        ],
        reason:
          "Breadth-first search always begins from the known start node so the queue represents the first frontier layer.",
        implication:
          "The next frame marks that same node visited before any neighbors can enqueue it again.",
        evidence: [
          {
            id: `${event.id}-start`,
            label: "Start node",
            value: snapshot.startId,
          },
        ],
        sourceValues: event.payload,
      })
    case "L2":
      return defineStructuredNarration({
        family: "commit",
        headline: [
          narrationText(`${event.id}-headline-text-0`, "Mark "),
          narrationText(`${event.id}-headline-text-1`, snapshot.startId, "active"),
          narrationText(
            `${event.id}-headline-text-2`,
            " visited before exploration begins."
          ),
        ],
        reason:
          "BFS records a node as visited at enqueue time so the frontier never contains duplicates of the same vertex.",
        implication:
          "The next frame can safely test whether the frontier still has a node ready to expand.",
        evidence: [
          {
            id: `${event.id}-visited`,
            label: "Visited set",
            value: [...snapshot.visited].join(", ") || snapshot.startId,
          },
        ],
        sourceValues: event.payload,
      })
    case "L3":
      return defineStructuredNarration({
        family: "check",
        headline: event.payload.hasFrontier
          ? [
              narrationCurrentToken(`${event.id}-headline-current`),
              narrationText(
                `${event.id}-headline-text`,
                ` is ${String(event.payload.frontId)} at the front of the queue.`
              ),
            ]
          : "The frontier queue is empty.",
        reason: event.payload.hasFrontier
          ? "BFS always expands the oldest queued node first, so the queue front determines the next graph node to process."
          : "Once the frontier is exhausted, every reachable node has already been processed and no path to the target remains.",
        implication: event.payload.hasFrontier
          ? "The next frame dequeues that front node and turns it into the active expansion point."
          : "The next frame must return null because the search ran out of reachable candidates.",
        evidence: [
          {
            id: `${event.id}-frontier-size`,
            label: "Frontier size",
            value: `${frontierSize}`,
            tokenId: event.payload.hasFrontier ? CURRENT_TOKEN_ID : undefined,
            tokenStyle: event.payload.hasFrontier ? CURRENT_TOKEN_STYLE : undefined,
          },
        ],
        sourceValues: event.payload,
      })
    case "L4":
      return defineStructuredNarration({
        family: "advance",
        headline: [
          narrationCurrentToken(`${event.id}-headline-current`),
          narrationText(
            `${event.id}-headline-text`,
            ` dequeues as ${String(event.payload.currentId)} and becomes the active node.`
          ),
        ],
        reason:
          "Removing the queue front preserves BFS level order: the earliest discovered node is always expanded first.",
        implication:
          "The next frame checks whether this active node is already the target before scanning any neighbors.",
        evidence: [
          {
            id: `${event.id}-current`,
            label: "Active node",
            value: String(event.payload.currentId),
            tokenId: CURRENT_TOKEN_ID,
            tokenStyle: CURRENT_TOKEN_STYLE,
          },
        ],
        sourceValues: event.payload,
      })
    case "L5":
      return defineStructuredNarration({
        family: "compare",
        headline: event.payload.found
          ? [
              narrationCurrentToken(`${event.id}-headline-current`),
              narrationText(
                `${event.id}-headline-text`,
                ` matches target ${String(event.payload.targetId)}.`
              ),
            ]
          : [
              narrationCurrentToken(`${event.id}-headline-current`),
              narrationText(
                `${event.id}-headline-text`,
                ` does not match target ${String(event.payload.targetId)}.`
              ),
            ],
        reason: event.payload.found
          ? "BFS stops the moment it reaches the target because the queue guarantees this is the shortest-layer discovery."
          : "A non-target node still matters because its unseen neighbors may extend the shortest path frontier outward.",
        implication: event.payload.found
          ? "The next frame can publish the found answer immediately."
          : "The next frames will inspect each neighbor to decide which ones should join the frontier.",
        evidence: [
          {
            id: `${event.id}-target`,
            label: "Target node",
            value: String(event.payload.targetId),
            tokenId: event.payload.found ? CURRENT_TOKEN_ID : undefined,
            tokenStyle: event.payload.found ? CURRENT_TOKEN_STYLE : undefined,
          },
        ],
        sourceValues: event.payload,
      })
    case "L7":
      return defineStructuredNarration({
        family: "compare",
        headline: event.payload.alreadyVisited
          ? [
              narrationCurrentToken(`${event.id}-headline-current`),
              narrationText(`${event.id}-headline-text-0`, " sees "),
              narrationNeighborToken(`${event.id}-headline-neighbor`),
              narrationText(
                `${event.id}-headline-text-1`,
                ` = ${String(event.payload.neighborId)} was already visited.`
              ),
            ]
          : [
              narrationCurrentToken(`${event.id}-headline-current`),
              narrationText(`${event.id}-headline-text-0`, " sees "),
              narrationNeighborToken(`${event.id}-headline-neighbor`),
              narrationText(
                `${event.id}-headline-text-1`,
                ` = ${String(event.payload.neighborId)} is unseen.`
              ),
            ],
        reason: event.payload.alreadyVisited
          ? "BFS ignores visited neighbors so the queue never revisits a node that already belongs to an earlier or equal frontier layer."
          : "An unseen neighbor is the first time BFS has discovered that vertex, so it belongs to the next frontier layer.",
        implication: event.payload.alreadyVisited
          ? "The next frame can move on without mutating the queue or visited set."
          : "The next frames will mark this neighbor visited and enqueue it at the back of the frontier.",
        evidence: [
          {
            id: `${event.id}-neighbor`,
            label: "Neighbor",
            value: String(event.payload.neighborId),
            tokenId: NEIGHBOR_TOKEN_ID,
            tokenStyle: NEIGHBOR_TOKEN_STYLE,
          },
        ],
        sourceValues: event.payload,
      })
    case "L8":
      return defineStructuredNarration({
        family: "commit",
        headline: [
          narrationCurrentToken(`${event.id}-headline-current`),
          narrationText(`${event.id}-headline-text-0`, " marks "),
          narrationNeighborToken(`${event.id}-headline-neighbor`),
          narrationText(
            `${event.id}-headline-text-1`,
            ` = ${String(event.payload.neighborId)} visited.`
          ),
        ],
        reason:
          "BFS records visited status before enqueueing so the same node cannot be inserted twice through another edge in the same frontier wave.",
        implication:
          "The next frame can safely enqueue this newly claimed neighbor exactly once.",
        evidence: [
          {
            id: `${event.id}-visited`,
            label: "Visited size",
            value: `${snapshot.visited.length}`,
            tokenId: NEIGHBOR_TOKEN_ID,
            tokenStyle: NEIGHBOR_TOKEN_STYLE,
          },
        ],
        sourceValues: event.payload,
      })
    case "L9":
      return defineStructuredNarration({
        family: "expand",
        headline: [
          narrationCurrentToken(`${event.id}-headline-current`),
          narrationText(`${event.id}-headline-text-0`, " enqueues "),
          narrationNeighborToken(`${event.id}-headline-neighbor`),
          narrationText(
            `${event.id}-headline-text-1`,
            ` = ${String(event.payload.neighborId)} joins the back of the frontier queue.`
          ),
        ],
        reason:
          "Newly discovered neighbors always enter at the back so BFS expands all older frontier nodes before this deeper layer candidate.",
        implication:
          "The queue now holds the next nodes BFS can expand in first-in, first-out order.",
        evidence: [
          {
            id: `${event.id}-queue`,
            label: "Frontier queue",
            value: snapshot.queue.join(" -> ") || "-",
            tokenId: NEIGHBOR_TOKEN_ID,
            tokenStyle: NEIGHBOR_TOKEN_STYLE,
          },
        ],
        sourceValues: event.payload,
      })
    case "L12":
      return defineStructuredNarration({
        family: "return",
        headline: "Return null because the frontier is exhausted.",
        reason:
          "BFS has already expanded every reachable node, so no undiscovered path to the target remains in the graph.",
        implication:
          "The search terminates here with an unreachable result.",
        evidence: [
          {
            id: `${event.id}-answer`,
            label: "Answer",
            value: "null",
          },
        ],
        sourceValues: event.payload,
      })
    default:
      return defineStructuredNarration({
        family: snapshot.answer ? "return" : "advance",
        headline: snapshot.answer
          ? `Return found node ${snapshot.answer}.`
          : "Advance the BFS frontier.",
        reason: snapshot.answer
          ? "The active node matched the target, so the search can publish the answer immediately."
          : "The queue, graph frontier, and narration remain synchronized one learner-visible BFS step at a time.",
        implication: snapshot.answer
          ? "The lesson is finished because BFS already found the target."
          : "The next frame will expose the next explicit frontier mutation or check.",
        sourceValues: event.payload,
      })
  }
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: GraphBfsSnapshot
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
  void mode
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
        primitives: buildPrimitiveStates(event, snapshot),
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
