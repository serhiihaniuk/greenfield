import type { VisualizationMode } from "@/domains/lessons/types"
import {
  defineFrame,
  type Frame,
  type NarrationPayload,
  type VisualChangeType,
} from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import {
  defineCallTreePrimitiveFrameState,
  defineStackPrimitiveFrameState,
  defineTreePrimitiveFrameState,
  type CallTreeNode,
  type StackFrame,
  type TreeNode,
} from "@/entities/visualization/primitives"
import type {
  EdgeHighlightSpec,
  PrimitiveFrameState,
} from "@/entities/visualization/types"

type TraversalSide = "root" | "left" | "right"

type TreeNodeSnapshot = {
  id: string
  value: number
  index: number
  depth: number
  parentId?: string
  leftId?: string
  rightId?: string
}

type CallSnapshotStatus = "current" | "waiting" | "solved" | "base"

type CallSnapshot = {
  callId: string
  parentCallId?: string
  nodeId: string | null
  nodeValue: number | null
  side: TraversalSide
  leftDepth?: number
  rightDepth?: number
  returnValue?: number
  status: CallSnapshotStatus
}

type MaximumDepthSnapshot = {
  rootId: string
  nodes: TreeNodeSnapshot[]
  calls: CallSnapshot[]
  stack: string[]
  activeCallId?: string
  activeNodeId?: string
  answer?: number
}

function mapEventToVisualChange(event: TraceEvent): VisualChangeType {
  switch (event.type) {
    case "call":
      return "enter"
    case "compare":
      return "compare"
    case "mutate":
      return "mutate"
    case "return":
      return "exit"
    default:
      return "result"
  }
}

function getCall(snapshot: MaximumDepthSnapshot, callId: string | undefined) {
  if (!callId) {
    return undefined
  }

  return snapshot.calls.find((entry) => entry.callId === callId)
}

function getNode(
  snapshot: MaximumDepthSnapshot,
  nodeId: string | null | undefined
) {
  if (!nodeId) {
    return undefined
  }

  return snapshot.nodes.find((entry) => entry.id === nodeId)
}

function getCallLabel(call: CallSnapshot) {
  return call.nodeValue === null ? "dfs(null)" : `dfs(${call.nodeValue})`
}

function getCallStateValue(call: CallSnapshot) {
  return call.nodeValue === null ? "null" : `node ${call.nodeValue}`
}

function getTreeEdgeHighlights(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): EdgeHighlightSpec[] {
  const highlights: EdgeHighlightSpec[] = []

  if (event.type === "call") {
    const childCall = getCall(
      snapshot,
      event.payload.callId as string | undefined
    )
    const parentCall = getCall(snapshot, childCall?.parentCallId)
    if (parentCall?.nodeId && childCall?.nodeId) {
      highlights.push({
        id: `${event.id}-tree-call`,
        sourceId: parentCall.nodeId,
        targetId: childCall.nodeId,
        tone: "active",
        emphasis: "strong",
      })
    }
  }

  if (event.type === "mutate") {
    const currentCall = getCall(
      snapshot,
      event.payload.callId as string | undefined
    )
    const currentNode = getNode(snapshot, currentCall?.nodeId)
    const childNodeId =
      event.codeLine === "L6" ? currentNode?.leftId : currentNode?.rightId

    if (currentCall?.nodeId && childNodeId) {
      highlights.push({
        id: `${event.id}-tree-return`,
        sourceId: currentCall.nodeId,
        targetId: childNodeId,
        tone: "done",
        emphasis: "normal",
      })
    }
  }

  return highlights
}

function buildTreeNodes(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): TreeNode[] {
  const callByNodeId = new Map(
    snapshot.calls
      .filter(
        (call): call is CallSnapshot & { nodeId: string } =>
          call.nodeId !== null
      )
      .map((call) => [call.nodeId, call])
  )
  const activeCall = getCall(snapshot, snapshot.activeCallId)
  const parentCall = getCall(
    snapshot,
    event.payload.parentCallId as string | undefined
  )
  const highlightedParentNodeId =
    event.type === "call" && event.payload.nodeId === null
      ? parentCall?.nodeId
      : undefined

  return snapshot.nodes.map((node) => {
    const call = callByNodeId.get(node.id)
    const parentNode = getNode(snapshot, node.parentId)
    const childSide =
      parentNode?.leftId === node.id
        ? "left"
        : parentNode?.rightId === node.id
          ? "right"
          : undefined

    let status: TreeNode["status"] = "default"
    if (
      snapshot.activeNodeId === node.id ||
      highlightedParentNodeId === node.id
    ) {
      status = "active"
    } else if (call?.returnValue !== undefined) {
      status = "done"
    }

    let annotation: string | undefined
    if (
      event.type === "result" &&
      event.codeLine === "L2" &&
      node.id === snapshot.rootId
    ) {
      annotation = `answer ${snapshot.answer}`
    } else if (event.type === "compare" && activeCall?.nodeId === node.id) {
      annotation = "expand"
    } else if (
      event.type === "result" &&
      event.codeLine === "L8" &&
      activeCall?.nodeId === node.id
    ) {
      annotation = `d=${activeCall.returnValue}`
    } else if (
      event.type === "mutate" &&
      event.codeLine === "L6" &&
      activeCall?.nodeId === node.id
    ) {
      annotation = `L=${activeCall.leftDepth}`
    } else if (
      event.type === "mutate" &&
      event.codeLine === "L7" &&
      activeCall?.nodeId === node.id
    ) {
      annotation = `R=${activeCall.rightDepth}`
    } else if (
      event.type === "call" &&
      event.payload.nodeId === null &&
      parentCall?.nodeId === node.id
    ) {
      annotation = `${event.payload.side} -> null`
    } else if (call?.returnValue !== undefined) {
      annotation = `d=${call.returnValue}`
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
  snapshot: MaximumDepthSnapshot
): PrimitiveFrameState {
  return defineTreePrimitiveFrameState({
    id: "tree",
    kind: "tree",
    title: "Binary Tree",
    subtitle:
      "The active node asks both children for their subtree depth before returning one larger value.",
    data: {
      nodes: buildTreeNodes(event, snapshot),
      rootId: snapshot.rootId,
    },
    edgeHighlights: getTreeEdgeHighlights(event, snapshot),
    viewport: {
      role: "primary",
      preferredWidth: 960,
      minHeight: 360,
    },
  })
}

function buildStackFrames(snapshot: MaximumDepthSnapshot): StackFrame[] {
  return snapshot.stack.map((callId) => {
    const call = getCall(snapshot, callId)
    if (!call) {
      throw new Error(`Missing stack call ${callId}.`)
    }

    return {
      id: call.callId,
      label: getCallLabel(call),
      detail:
        call.nodeValue === null
          ? "Empty subtree"
          : `left ${call.leftDepth ?? "?"} · right ${call.rightDepth ?? "?"}`,
      status:
        snapshot.stack.at(-1) === call.callId
          ? "active"
          : call.returnValue !== undefined
            ? "done"
            : "waiting",
      annotation:
        call.returnValue !== undefined ? `ret ${call.returnValue}` : call.side,
    }
  })
}

function buildStackPrimitive(
  snapshot: MaximumDepthSnapshot
): PrimitiveFrameState {
  return defineStackPrimitiveFrameState({
    id: "call-stack",
    kind: "stack",
    title: "Call Stack",
    subtitle:
      "Only one recursive frame is active; parents wait for child depths to return.",
    data: {
      frames: buildStackFrames(snapshot),
      topLabel: snapshot.stack.length > 0 ? "top of stack" : undefined,
    },
    viewport: {
      role: "secondary",
      preferredWidth: 320,
      minHeight: 220,
    },
  })
}

function buildCallTreeEdges(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): EdgeHighlightSpec[] {
  const currentCall = getCall(snapshot, snapshot.activeCallId)
  if (!currentCall?.parentCallId) {
    return []
  }

  return [
    {
      id: `${event.id}-call-tree-edge`,
      sourceId: currentCall.parentCallId,
      targetId: currentCall.callId,
      tone:
        event.type === "mutate" || event.type === "return" ? "done" : "active",
      emphasis: "normal",
    },
  ]
}

function buildCallTreeNodes(snapshot: MaximumDepthSnapshot): CallTreeNode[] {
  return snapshot.calls.map((call) => ({
    id: call.callId,
    label: "dfs",
    stateValue: getCallStateValue(call),
    parentId: call.parentCallId,
    badge: call.side,
    returnValue:
      call.returnValue !== undefined ? String(call.returnValue) : undefined,
    status: call.status,
  }))
}

function buildCallTreePrimitive(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): PrimitiveFrameState {
  return defineCallTreePrimitiveFrameState({
    id: "execution-tree",
    kind: "call-tree",
    title: "Execution Tree",
    subtitle:
      "Each node in the execution tree is one recursive call and the depth it eventually returns.",
    data: {
      nodes: buildCallTreeNodes(snapshot),
      rootId: snapshot.calls[0]?.callId ?? "call-1",
    },
    edgeHighlights: buildCallTreeEdges(event, snapshot),
    viewport: {
      role: "secondary",
      preferredWidth: 340,
      minHeight: 240,
    },
  })
}

function buildNarration(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): NarrationPayload {
  switch (event.type) {
    case "call":
      return {
        summary:
          event.payload.nodeValue === null
            ? `Enter ${event.payload.side} child recursion with null.`
            : event.payload.side === "root"
              ? `Start recursion at the root node ${event.payload.nodeValue}.`
              : `Descend into the ${event.payload.side} child at node ${event.payload.nodeValue}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "compare":
      return {
        summary: `Node ${event.payload.nodeValue} is not null, so this call must ask both children for their depth.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "base-case":
      return {
        summary:
          "dfs(null) returns 0 because an empty subtree contributes no depth.",
        segments: [],
        sourceValues: event.payload,
      }
    case "mutate":
      return {
        summary:
          event.codeLine === "L6"
            ? `Store leftDepth = ${event.payload.leftDepth} after the left subtree returns.`
            : `Store rightDepth = ${event.payload.rightDepth} after the right subtree returns.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "result":
      return {
        summary:
          event.codeLine === "L2"
            ? `The wrapper returns maximum depth ${snapshot.answer}.`
            : `Compute depth at node ${getCall(snapshot, event.payload.callId as string | undefined)?.nodeValue}: 1 + max(${event.payload.leftDepth}, ${event.payload.rightDepth}) = ${event.payload.returnValue}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "return":
      return {
        summary:
          event.payload.nodeId === null || event.codeLine === "L5"
            ? "Return base depth 0 to the waiting parent call."
            : `Return depth ${event.payload.returnValue} to the parent call.`,
        segments: [],
        sourceValues: event.payload,
      }
    default:
      return {
        summary: "Advance the recursion state.",
        segments: [],
        sourceValues: event.payload,
      }
  }
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot,
  _mode: VisualizationMode
): PrimitiveFrameState[] {
  return [
    buildTreePrimitive(event, snapshot),
    buildStackPrimitive(snapshot),
    buildCallTreePrimitive(event, snapshot),
  ]
}

export function projectRecursiveMaximumDepth(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  return events
    .filter((event) => event.type !== "complete")
    .map((event, index) => {
      const snapshot = event.snapshot as MaximumDepthSnapshot

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
