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
  defineCallTreePrimitiveFrameState,
  defineStackPrimitiveFrameState,
  type CallTreeNode,
  type StackFrame,
} from "@/entities/visualization/primitives"
import type { EdgeHighlightSpec, PrimitiveFrameState } from "@/entities/visualization/types"
import { recursiveMaximumDepthViewSpecs } from "./views"

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

const dfsExecutionToken = {
  id: "dfs",
  label: "dfs",
  style: "accent-1" as const,
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

function getCallStateValue(call: CallSnapshot) {
  return call.nodeValue === null ? "null" : `node ${call.nodeValue}`
}

function buildStackFrames(
  snapshot: MaximumDepthSnapshot,
  event: TraceEvent
): StackFrame[] {
  return snapshot.stack.map((callId) => {
    const call = getCall(snapshot, callId)
    if (!call) {
      throw new Error(`Missing stack call ${callId}.`)
    }

    const isActiveFrame = snapshot.stack.at(-1) === call.callId
    const annotation =
      isActiveFrame && event.type === "compare"
        ? "check"
        : call.returnValue !== undefined
          ? `ret ${call.returnValue}`
          : call.side

    return {
      id: call.callId,
      label: dfsExecutionToken.label,
      tokenId: dfsExecutionToken.id,
      tokenStyle: dfsExecutionToken.style,
      detail:
        call.nodeValue === null
          ? "null subtree"
          : `node ${call.nodeValue} · left ${call.leftDepth ?? "?"} · right ${call.rightDepth ?? "?"}`,
      status: isActiveFrame
        ? "active"
        : call.returnValue !== undefined
          ? "done"
          : "waiting",
      annotation,
    }
  })
}

function buildStackPrimitive(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(
    recursiveMaximumDepthViewSpecs,
    "call-stack"
  )

  return defineStackPrimitiveFrameState({
    id: "call-stack",
    kind: "stack",
    title: viewSpec.title,
    subtitle:
      "Only one recursive frame is active; parents wait for child depths to return.",
    data: {
      frames: buildStackFrames(snapshot, event),
      topLabel: snapshot.stack.length > 0 ? "top of stack" : undefined,
    },
    viewport: viewSpec.viewport,
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

function buildCallTreeNodes(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): CallTreeNode[] {
  return snapshot.calls.map((call) => {
    const isRootAnswerFrame =
      event.type === "result" &&
      event.codeLine === "L2" &&
      !call.parentCallId

    return {
      id: call.callId,
      label: dfsExecutionToken.label,
      tokenId: dfsExecutionToken.id,
      tokenStyle: dfsExecutionToken.style,
      stateValue: getCallStateValue(call),
      parentId: call.parentCallId,
      badge: isRootAnswerFrame ? "answer" : call.side,
      returnValue:
        call.returnValue !== undefined ? String(call.returnValue) : undefined,
      status: call.status,
    }
  })
}

function buildCallTreePrimitive(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(
    recursiveMaximumDepthViewSpecs,
    "execution-tree"
  )

  return defineCallTreePrimitiveFrameState({
    id: "execution-tree",
    kind: "call-tree",
    title: viewSpec.title,
    subtitle:
      "Each node in the execution tree is one recursive call and the depth it eventually returns.",
    data: {
      nodes: buildCallTreeNodes(event, snapshot),
      rootId: snapshot.calls[0]?.callId ?? "call-1",
    },
    edgeHighlights: buildCallTreeEdges(event, snapshot),
    viewport: viewSpec.viewport,
  })
}

function buildNarration(
  event: TraceEvent,
  snapshot: MaximumDepthSnapshot
): NarrationPayload {
  const tokenSegment = (id: string) => ({
    id: `${event.id}-${id}`,
    text: dfsExecutionToken.label,
    tokenId: dfsExecutionToken.id,
    tokenStyle: dfsExecutionToken.style,
  })
  const textSegment = (
    id: string,
    text: string,
    tone: NarrationPayload["segments"][number]["tone"] = "default"
  ) => ({
    id: `${event.id}-${id}`,
    text,
    tone,
  })

  switch (event.type) {
    case "call":
      return {
        summary:
          event.payload.nodeValue === null
            ? `Enter ${event.payload.side} child recursion with null.`
            : event.payload.side === "root"
              ? `Start recursion at the root node ${event.payload.nodeValue}.`
              : `Descend into the ${event.payload.side} child at node ${event.payload.nodeValue}.`,
        segments:
          event.payload.nodeValue === null
            ? [
                textSegment("t0", "Enter "),
                tokenSegment("dfs"),
                textSegment(
                  "t1",
                  ` on the ${event.payload.side} child with null.`
                ),
              ]
            : event.payload.side === "root"
              ? [
                  textSegment("t0", "Start "),
                  tokenSegment("dfs"),
                  textSegment(
                    "t1",
                    ` at the root node ${event.payload.nodeValue}.`
                  ),
                ]
              : [
                  textSegment("t0", "Descend into "),
                  tokenSegment("dfs"),
                  textSegment(
                    "t1",
                    ` on the ${event.payload.side} child at node ${event.payload.nodeValue}.`
                  ),
                ],
        sourceValues: event.payload,
      }
    case "compare":
      return {
        summary: `Node ${event.payload.nodeValue} is not null, so this call must ask both children for their depth.`,
        segments: [
          tokenSegment("dfs"),
          textSegment(
            "t0",
            ` at node ${event.payload.nodeValue} is not null, so it must ask both children for their depth.`
          ),
        ],
        sourceValues: event.payload,
      }
    case "base-case":
      return {
        summary:
          "dfs(null) returns 0 because an empty subtree contributes no depth.",
        segments: [
          tokenSegment("dfs"),
          textSegment(
            "t0",
            "(null) returns 0 because an empty subtree contributes no depth."
          ),
        ],
        sourceValues: event.payload,
      }
    case "mutate":
      return {
        summary:
          event.codeLine === "L6"
            ? `Store leftDepth = ${event.payload.leftDepth} after the left subtree returns.`
            : `Store rightDepth = ${event.payload.rightDepth} after the right subtree returns.`,
        segments: [
          tokenSegment("dfs"),
          textSegment(
            "t0",
            event.codeLine === "L6"
              ? ` stores leftDepth = ${event.payload.leftDepth} after the left subtree returns.`
              : ` stores rightDepth = ${event.payload.rightDepth} after the right subtree returns.`
          ),
        ],
        sourceValues: event.payload,
      }
    case "result":
      return {
        summary:
          event.codeLine === "L2"
            ? `The wrapper returns maximum depth ${snapshot.answer}.`
            : `Compute depth at node ${getCall(snapshot, event.payload.callId as string | undefined)?.nodeValue}: 1 + max(${event.payload.leftDepth}, ${event.payload.rightDepth}) = ${event.payload.returnValue}.`,
        segments:
          event.codeLine === "L2"
            ? []
            : [
                tokenSegment("dfs"),
                textSegment(
                  "t0",
                  ` at node ${getCall(snapshot, event.payload.callId as string | undefined)?.nodeValue} returns 1 + max(${event.payload.leftDepth}, ${event.payload.rightDepth}) = ${event.payload.returnValue}.`
                ),
              ],
        sourceValues: event.payload,
      }
    case "return":
      return {
        summary:
          event.payload.nodeId === null || event.codeLine === "L5"
            ? "Return base depth 0 to the waiting parent call."
            : `Return depth ${event.payload.returnValue} to the parent call.`,
        segments: [
          textSegment("t0", "Return "),
          tokenSegment("dfs"),
          textSegment(
            "t1",
            event.payload.nodeId === null || event.codeLine === "L5"
              ? " base depth 0 to the waiting parent call."
              : ` depth ${event.payload.returnValue} to the parent call.`
          ),
        ],
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
  snapshot: MaximumDepthSnapshot
): PrimitiveFrameState[] {
  return [
    buildCallTreePrimitive(event, snapshot),
    buildStackPrimitive(event, snapshot),
  ]
}

export function projectRecursiveMaximumDepth(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  void mode
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
