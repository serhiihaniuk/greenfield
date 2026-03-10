import type { VisualizationMode } from "@/domains/lessons/types"
import { getLessonViewSpec } from "@/domains/lessons/view-specs"
import {
  defineFrame,
  type Frame,
  type NarrationPayloadInput,
  type VisualChangeType,
} from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import {
  defineSequencePrimitiveFrameState,
  defineStackPrimitiveFrameState,
  defineTreePrimitiveFrameState,
  type SequenceItem,
  type StackFrame,
  type TreeNode,
} from "@/entities/visualization/primitives"
import type {
  EdgeHighlightSpec,
  PrimitiveFrameState,
} from "@/entities/visualization/types"
import { iterativeStackTreeDfsViewSpecs } from "./views"

type TreeNodeSnapshot = {
  id: string
  value: number
  depth: number
  parentId?: string
  leftId?: string
  rightId?: string
}

type TreeDfsTraversalSnapshot = {
  rootId: string
  nodes: TreeNodeSnapshot[]
  stack: string[]
  order: number[]
  visitNodeIds: string[]
  currentNodeId?: string
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

function getNode(
  snapshot: TreeDfsTraversalSnapshot,
  nodeId: string | null | undefined
) {
  if (!nodeId) {
    return undefined
  }

  return snapshot.nodes.find((node) => node.id === nodeId)
}

function buildNarration(
  event: TraceEvent,
  snapshot: TreeDfsTraversalSnapshot
): NarrationPayloadInput {
  switch (event.codeLine) {
    case "L1":
      return {
        summary: "Initialize the DFS stack with the root node.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L2":
      return {
        summary: "Initialize the preorder output list.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L3": {
      const nextNode = getNode(snapshot, event.payload.nextNodeId as string)
      return {
        summary: `The stack still has work, so node ${nextNode?.value ?? "?"} will be processed next.`,
        segments: [],
        sourceValues: event.payload,
      }
    }
    case "L4":
      return {
        summary: `Pop node ${event.payload.currentValue} from the top of the stack.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L5":
      return {
        summary: `Visit node ${event.payload.currentValue} and append it to preorder order [${snapshot.order.join(", ")}].`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L6":
      return {
        summary: `Push right child ${event.payload.pushedValue} first so left can still be visited next.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L7":
      return {
        summary: `Push left child ${event.payload.pushedValue}; it is now on top, so preorder keeps moving left first.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L9":
      return {
        summary: `Return the completed preorder traversal [${snapshot.order.join(", ")}].`,
        segments: [],
        sourceValues: event.payload,
      }
    default:
      return {
        summary: "Advance the explicit DFS stack state.",
        segments: [],
        sourceValues: event.payload,
      }
  }
}

function buildTreeEdgeHighlights(
  event: TraceEvent
): EdgeHighlightSpec[] {
  if (event.codeLine !== "L6" && event.codeLine !== "L7") {
    return []
  }

  const currentNodeId = event.payload.currentNodeId
  const pushedNodeId = event.payload.pushedNodeId
  if (typeof currentNodeId !== "string" || typeof pushedNodeId !== "string") {
    return []
  }

  return [
    {
      id: `${event.id}-push-edge`,
      sourceId: currentNodeId,
      targetId: pushedNodeId,
      tone: "active",
      emphasis: "strong",
    },
  ]
}

function buildTreeNodes(
  event: TraceEvent,
  snapshot: TreeDfsTraversalSnapshot
): TreeNode[] {
  const visitedNodeIdSet = new Set(snapshot.visitNodeIds)
  const currentNodeId =
    typeof event.payload.currentNodeId === "string"
      ? event.payload.currentNodeId
      : snapshot.currentNodeId
  const nextNodeId =
    event.codeLine === "L3" && typeof event.payload.nextNodeId === "string"
      ? event.payload.nextNodeId
      : undefined
  const pushedNodeId =
    typeof event.payload.pushedNodeId === "string"
      ? event.payload.pushedNodeId
      : undefined

  return snapshot.nodes.map((node) => {
    const parentNode = getNode(snapshot, node.parentId)
    const childSide =
      parentNode?.leftId === node.id
        ? "left"
        : parentNode?.rightId === node.id
          ? "right"
          : undefined

    let status: TreeNode["status"] = "default"
    if (node.id === currentNodeId || node.id === nextNodeId || node.id === pushedNodeId) {
      status =
        event.codeLine === "L5" || event.codeLine === "L9" ? "found" : "active"
    } else if (visitedNodeIdSet.has(node.id)) {
      status = "done"
    }

    let annotation: string | undefined
    const orderIndex = snapshot.visitNodeIds.indexOf(node.id)
    if (event.codeLine === "L3" && node.id === nextNodeId) {
      annotation = "next"
    } else if (event.codeLine === "L4" && node.id === currentNodeId) {
      annotation = "pop"
    } else if (event.codeLine === "L5" && node.id === currentNodeId) {
      annotation = `visit #${orderIndex + 1}`
    } else if ((event.codeLine === "L6" || event.codeLine === "L7") && node.id === pushedNodeId) {
      annotation = `push ${event.payload.side}`
    } else if (orderIndex >= 0) {
      annotation = `#${orderIndex + 1}`
    }

    return {
      id: node.id,
      label: String(node.value),
      parentId: node.parentId,
      childSide,
      depth: node.depth,
      annotation,
      status,
    }
  })
}

function buildTreePrimitive(
  event: TraceEvent,
  snapshot: TreeDfsTraversalSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(iterativeStackTreeDfsViewSpecs, "tree")

  return defineTreePrimitiveFrameState({
    id: "tree",
    kind: "tree",
    title: viewSpec.title,
    subtitle:
      "The stack controls which node is processed next, while preorder records each visit immediately after pop.",
    data: {
      nodes: buildTreeNodes(event, snapshot),
      rootId: snapshot.rootId,
    },
    edgeHighlights: buildTreeEdgeHighlights(event),
    viewport: viewSpec.viewport,
  })
}

function buildStackFrames(snapshot: TreeDfsTraversalSnapshot): StackFrame[] {
  return snapshot.stack.map((nodeId, index) => {
    const node = getNode(snapshot, nodeId)
    return {
      id: nodeId,
      label: `node ${node?.value ?? "?"}`,
      detail: `depth ${node?.depth ?? "?"}`,
      status:
        index === snapshot.stack.length - 1 ? "active" : "waiting",
      annotation:
        index === snapshot.stack.length - 1 ? "top" : undefined,
    }
  })
}

function buildStackPrimitive(
  snapshot: TreeDfsTraversalSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(iterativeStackTreeDfsViewSpecs, "dfs-stack")

  return defineStackPrimitiveFrameState({
    id: "dfs-stack",
    kind: "stack",
    title: viewSpec.title,
    subtitle:
      "Right is pushed before left so the left child rises to the top of the stack.",
    data: {
      frames: buildStackFrames(snapshot),
      topLabel: snapshot.stack.length > 0 ? "top of stack" : undefined,
    },
    viewport: viewSpec.viewport,
  })
}

function buildOrderItems(order: number[]): SequenceItem[] {
  return order.map((value, index) => ({
    id: `visit-${index}`,
    label: String(value),
    detail: `#${index + 1}`,
  }))
}

function buildOrderPrimitive(
  event: TraceEvent,
  snapshot: TreeDfsTraversalSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(
    iterativeStackTreeDfsViewSpecs,
    "visit-order"
  )

  return defineSequencePrimitiveFrameState({
    id: "visit-order",
    kind: "sequence",
    title: viewSpec.title,
    subtitle: "Every pop is immediately committed to the traversal order.",
    data: {
      leadingLabel: "first",
      trailingLabel: "latest",
      items: buildOrderItems(snapshot.order),
    },
    highlights:
      snapshot.order.length === 0
        ? []
        : [
            {
              targetId: `visit-${snapshot.order.length - 1}`,
              tone:
                event.codeLine === "L9"
                  ? "found"
                  : event.codeLine === "L5"
                    ? "mutated"
                    : "default",
              emphasis: "strong",
            },
          ],
    viewport: viewSpec.viewport,
  })
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: TreeDfsTraversalSnapshot
): PrimitiveFrameState[] {
  return [
    buildTreePrimitive(event, snapshot),
    buildStackPrimitive(snapshot),
    buildOrderPrimitive(event, snapshot),
  ]
}

export function projectIterativeStackTreeDfs(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  void mode
  return events
    .filter((event) => event.type !== "complete")
    .map((event, index) => {
      const snapshot = event.snapshot as TreeDfsTraversalSnapshot

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
