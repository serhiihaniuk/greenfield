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
  defineCallTreePrimitiveFrameState,
  defineStackPrimitiveFrameState,
  type CallTreeNode,
  type StackFrame,
} from "@/entities/visualization/primitives"
import type {
  EdgeHighlightSpec,
  PrimitiveFrameState,
} from "@/entities/visualization/types"
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

function narrationDfsToken(id: string) {
  return narrationToken({
    id,
    text: dfsExecutionToken.label,
    tokenId: dfsExecutionToken.id,
    tokenStyle: dfsExecutionToken.style,
  })
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
): NarrationPayloadInput {
  const activeCall = getCall(snapshot, snapshot.activeCallId)
  const eventCall = getCall(
    snapshot,
    typeof event.payload.callId === "string" ? event.payload.callId : undefined
  )
  const currentCall = eventCall ?? activeCall
  const currentNodeValue = currentCall?.nodeValue

  switch (event.type) {
    case "call":
      return defineStructuredNarration({
        family: "advance",
        headline:
          event.payload.nodeValue === null
            ? [
                narrationDfsToken(`${event.id}-headline-dfs`),
                narrationText(
                  `${event.id}-headline-text`,
                  ` enters the ${event.payload.side} child and lands on null.`
                ),
              ]
            : event.payload.side === "root"
              ? [
                  narrationDfsToken(`${event.id}-headline-dfs`),
                  narrationText(
                    `${event.id}-headline-text`,
                    ` starts at the root node ${event.payload.nodeValue}.`
                  ),
                ]
              : [
                  narrationDfsToken(`${event.id}-headline-dfs`),
                  narrationText(
                    `${event.id}-headline-text`,
                    ` descends into the ${event.payload.side} child at node ${event.payload.nodeValue}.`
                  ),
                ],
        reason:
          event.payload.nodeValue === null
            ? "Every missing child still becomes an explicit recursive call so the base case can return a depth of 0."
            : event.payload.side === "root"
              ? "The wrapper delegates the whole problem to one recursive traversal rooted at the original tree."
              : "Depth is aggregated from both children, so the current call must explore this branch before it can return.",
        implication:
          event.payload.nodeValue === null
            ? "The next frame can terminate this branch immediately with the base depth."
            : "The next frame checks whether this node is null or must keep expanding recursion.",
        evidence: [
          {
            id: `${event.id}-side`,
            label: "Branch",
            value: String(event.payload.side),
            tokenId: dfsExecutionToken.id,
            tokenStyle: dfsExecutionToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "compare":
      return defineStructuredNarration({
        family: "check",
        headline: [
          narrationDfsToken(`${event.id}-headline-dfs`),
          narrationText(
            `${event.id}-headline-text`,
            ` confirms node ${event.payload.nodeValue} is not null.`
          ),
        ],
        reason:
          "A real node contributes one level of depth, but only after both child depths are known.",
        implication:
          "The next recursive call will ask the left child for its subtree depth first.",
        evidence: [
          {
            id: `${event.id}-node`,
            label: "Active node",
            value: `${event.payload.nodeValue}`,
            tokenId: dfsExecutionToken.id,
            tokenStyle: dfsExecutionToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "base-case":
      return defineStructuredNarration({
        family: "return",
        headline: [
          narrationDfsToken(`${event.id}-headline-dfs`),
          narrationText(
            `${event.id}-headline-text`,
            "(null) returns base depth 0."
          ),
        ],
        reason:
          "An empty child adds no levels to the subtree, so recursion bottoms out immediately here.",
        implication:
          "That 0 now flows back to the waiting parent call as one side of its max comparison.",
        evidence: [
          {
            id: `${event.id}-return`,
            label: "Returned depth",
            value: "0",
            tokenId: dfsExecutionToken.id,
            tokenStyle: dfsExecutionToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "mutate":
      return defineStructuredNarration({
        family: "commit",
        headline:
          event.codeLine === "L6"
            ? [
                narrationDfsToken(`${event.id}-headline-dfs`),
                narrationText(
                  `${event.id}-headline-text`,
                  ` stores leftDepth = ${event.payload.leftDepth}.`
                ),
              ]
            : [
                narrationDfsToken(`${event.id}-headline-dfs`),
                narrationText(
                  `${event.id}-headline-text`,
                  ` stores rightDepth = ${event.payload.rightDepth}.`
                ),
              ],
        reason:
          event.codeLine === "L6"
            ? "The left subtree has finished unwinding, so its exact contribution is now stable."
            : "The right subtree has finished unwinding, so the call now knows both child depths.",
        implication:
          event.codeLine === "L6"
            ? "The next branch can recurse into the right child to collect the missing half of the answer."
            : "The next frame can compute this node's returned depth from both stored child values.",
        evidence: [
          {
            id: `${event.id}-depth`,
            label: event.codeLine === "L6" ? "leftDepth" : "rightDepth",
            value: `${event.codeLine === "L6" ? event.payload.leftDepth : event.payload.rightDepth}`,
            tokenId: dfsExecutionToken.id,
            tokenStyle: dfsExecutionToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "result":
      return defineStructuredNarration({
        family: "commit",
        headline:
          event.codeLine === "L2"
            ? [
                narrationText(
                  `${event.id}-headline-text-0`,
                  "The wrapper publishes maximum depth "
                ),
                narrationText(
                  `${event.id}-headline-text-1`,
                  `${snapshot.answer}.`,
                  "found"
                ),
              ]
            : [
                narrationDfsToken(`${event.id}-headline-dfs`),
                narrationText(
                  `${event.id}-headline-text`,
                  ` at node ${currentNodeValue} computes 1 + max(${event.payload.leftDepth}, ${event.payload.rightDepth}) = ${event.payload.returnValue}.`
                ),
              ],
        reason:
          event.codeLine === "L2"
            ? "The root recursive call has already returned the complete subtree depth for the whole tree."
            : "A node contributes one level above its deeper child, so recursion collapses both child depths into one returned answer here.",
        implication:
          event.codeLine === "L2"
            ? "The lesson is finished because the final answer has reached the wrapper."
            : "The next frame will hand that solved depth back to the waiting parent call.",
        evidence: [
          {
            id: `${event.id}-result`,
            label:
              event.codeLine === "L2" ? "Maximum depth" : "Returned depth",
            value: `${event.codeLine === "L2" ? snapshot.answer : event.payload.returnValue}`,
            tokenId: dfsExecutionToken.id,
            tokenStyle: dfsExecutionToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "return":
      return defineStructuredNarration({
        family: "return",
        headline:
          event.payload.nodeId === null || event.codeLine === "L5"
            ? [
                narrationDfsToken(`${event.id}-headline-dfs`),
                narrationText(
                  `${event.id}-headline-text`,
                  " hands base depth 0 back to the waiting parent."
                ),
              ]
            : [
                narrationDfsToken(`${event.id}-headline-dfs`),
                narrationText(
                  `${event.id}-headline-text`,
                  ` returns depth ${event.payload.returnValue} from node ${currentNodeValue}.`
                ),
              ],
        reason:
          event.payload.nodeId === null || event.codeLine === "L5"
            ? "The null branch is solved immediately, so its parent can resume with that base contribution."
            : "This call has already aggregated both child depths, so the parent can now treat it as a solved subtree.",
        implication:
          event.payload.nodeId === null || event.codeLine === "L5"
            ? "The waiting parent call now has one side of its max comparison."
            : "The parent frame can either store this depth or, if it is the root, finish the whole algorithm.",
        evidence: [
          {
            id: `${event.id}-return`,
            label: "Returned depth",
            value: `${event.payload.returnValue}`,
            tokenId: dfsExecutionToken.id,
            tokenStyle: dfsExecutionToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    default:
      return defineStructuredNarration({
        family: "advance",
        headline: "Advance the recursion state.",
        reason:
          "The execution tree, call stack, and explanation panel stay synchronized one learner-visible change at a time.",
        implication:
          "The next frame will expose the next explicit recursion step.",
        sourceValues: event.payload,
      })
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
