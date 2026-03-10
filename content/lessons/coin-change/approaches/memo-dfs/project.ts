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
  defineCallTreePrimitiveFrameState,
  defineHashMapPrimitiveFrameState,
  defineStackPrimitiveFrameState,
  type CallTreeNode,
  type HashMapEntry,
  type StackFrame,
} from "@/entities/visualization/primitives"
import type {
  EdgeHighlightSpec,
  PrimitiveFrameState,
} from "@/entities/visualization/types"
import { memoDfsCoinChangeViewSpecs } from "./views"

const INF = "INF" as const
type FiniteOrInf = number | typeof INF
type CallStatus = "current" | "waiting" | "solved" | "memo" | "dead" | "base"

type MemoEntrySnapshot = {
  key: number
  value: FiniteOrInf | null
}

type CallSnapshot = {
  callId: string
  parentCallId?: string
  remaining: number
  viaCoin?: number
  currentCoin?: number
  childRemaining?: number
  childValue?: FiniteOrInf
  candidate?: FiniteOrInf
  best?: FiniteOrInf
  returnValue?: FiniteOrInf
  status: CallStatus
}

type CoinChangeSnapshot = {
  coins: number[]
  amount: number
  memo: MemoEntrySnapshot[]
  calls: CallSnapshot[]
  stack: string[]
  activeCallId?: string
  answer?: FiniteOrInf
  normalizedAnswer?: number
}

function mapEventToVisualChange(event: TraceEvent): VisualChangeType {
  switch (event.type) {
    case "call":
      return "enter"
    case "compare":
    case "memo-hit":
      return "compare"
    case "return":
      return "exit"
    case "result":
      return "result"
    default:
      return "mutate"
  }
}

function formatFiniteOrInf(value: FiniteOrInf | undefined) {
  if (value === undefined) {
    return undefined
  }

  return value === INF ? "INF" : String(value)
}

function getCall(snapshot: CoinChangeSnapshot, callId: string | undefined) {
  if (!callId) {
    return undefined
  }

  return snapshot.calls.find((entry) => entry.callId === callId)
}

function buildEdgeHighlights(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): EdgeHighlightSpec[] {
  const activeCall = getCall(snapshot, snapshot.activeCallId)
  if (!activeCall?.parentCallId) {
    return []
  }

  return [
    {
      id: `${event.id}-edge`,
      sourceId: activeCall.parentCallId,
      targetId: activeCall.callId,
      tone:
        event.type === "return" || event.type === "memo-hit"
          ? "done"
          : "active",
      emphasis: event.type === "call" ? "strong" : "normal",
    },
  ]
}

function buildCallTreeNodes(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): CallTreeNode[] {
  return snapshot.calls.map((call) => {
    const stateValue = `rem ${call.remaining}`
    let badge: string | undefined
    if (call.viaCoin !== undefined) {
      badge = `coin ${call.viaCoin}`
    } else if (call.callId === snapshot.calls[0]?.callId) {
      badge = "root"
    }

    if (snapshot.activeCallId === call.callId) {
      switch (event.codeLine) {
        case "L7":
          badge =
            call.currentCoin !== undefined ? `coin ${call.currentCoin}` : badge
          break
        case "L8":
          badge =
            call.childValue !== undefined
              ? `child ${formatFiniteOrInf(call.childValue)}`
              : badge
          break
        case "L9":
          badge =
            call.childValue === INF
              ? "skip INF"
              : call.childValue !== undefined
                ? "use child"
                : badge
          break
        case "L10":
          badge =
            call.candidate !== undefined
              ? `cand ${formatFiniteOrInf(call.candidate)}`
              : badge
          break
        case "L11":
          badge =
            call.best !== undefined
              ? `best ${formatFiniteOrInf(call.best)}`
              : badge
          break
        case "L13":
          badge = "memo write"
          break
        case "L15":
          badge = `answer ${snapshot.answer === undefined ? "?" : formatFiniteOrInf(snapshot.answer)}`
          break
        case "L16":
          badge = `return ${snapshot.normalizedAnswer ?? "?"}`
          break
        default:
          break
      }
    }

    if (!snapshot.activeCallId && call.callId === snapshot.calls[0]?.callId) {
      if (event.codeLine === "L15") {
        badge = `answer ${snapshot.answer === undefined ? "?" : formatFiniteOrInf(snapshot.answer)}`
      }

      if (event.codeLine === "L16") {
        badge = `return ${snapshot.normalizedAnswer ?? "?"}`
      }
    }

    return {
      id: call.callId,
      label: "dfs",
      stateValue,
      parentId: call.parentCallId,
      badge,
      returnValue: formatFiniteOrInf(call.returnValue),
      status:
        call.status === "base"
          ? "base"
          : call.status === "dead"
            ? "dead"
            : call.status === "memo"
              ? "memo"
              : call.status === "solved"
                ? "solved"
                : call.status,
    }
  })
}

function buildCallTreePrimitive(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(
    memoDfsCoinChangeViewSpecs,
    "execution-tree"
  )

  return defineCallTreePrimitiveFrameState({
    id: "execution-tree",
    kind: "call-tree",
    title: viewSpec.title,
    subtitle:
      "Each remainder is a recursive subproblem; solved remainders stay visible so memo reuse is explicit.",
    data: {
      nodes: buildCallTreeNodes(event, snapshot),
      rootId: snapshot.calls[0]?.callId ?? "call-1",
    },
    edgeHighlights: buildEdgeHighlights(event, snapshot),
    viewport: viewSpec.viewport,
  })
}

function buildStackFrames(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): StackFrame[] {
  return snapshot.stack.map((callId, index) => {
    const call = getCall(snapshot, callId)
    if (!call) {
      throw new Error(`Missing stack call ${callId}.`)
    }

    const isActive = index === snapshot.stack.length - 1
    let detail = `best ${formatFiniteOrInf(call.best) ?? "?"} · coin ${call.currentCoin ?? "-"}`

    if (isActive) {
      switch (event.codeLine) {
        case "L8":
          detail = `child ${formatFiniteOrInf(call.childValue) ?? "?"} · coin ${call.currentCoin ?? "-"}`
          break
        case "L9":
          detail = `child ${formatFiniteOrInf(call.childValue) ?? "?"} · ${call.childValue === INF ? "skip" : "use"}`
          break
        case "L10":
          detail = `cand ${formatFiniteOrInf(call.candidate) ?? "?"} · best ${formatFiniteOrInf(call.best) ?? "?"}`
          break
        case "L11":
          detail = `best ${formatFiniteOrInf(call.best) ?? "?"} · child ${formatFiniteOrInf(call.childValue) ?? "?"}`
          break
        case "L13":
          detail = `memo ${formatFiniteOrInf(call.returnValue) ?? "?"} stored`
          break
        default:
          break
      }
    }

    return {
      id: call.callId,
      label: `dfs(${call.remaining})`,
      detail,
      status: isActive
        ? "active"
        : call.returnValue !== undefined
          ? "done"
          : "waiting",
      annotation:
        call.returnValue !== undefined
          ? `ret ${formatFiniteOrInf(call.returnValue)}`
          : call.viaCoin !== undefined
            ? `via ${call.viaCoin}`
            : "root",
    }
  })
}

function buildStackPrimitive(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(memoDfsCoinChangeViewSpecs, "call-stack")

  return defineStackPrimitiveFrameState({
    id: "call-stack",
    kind: "stack",
    title: viewSpec.title,
    subtitle: "Parents wait while one child remainder is explored at a time.",
    data: {
      frames: buildStackFrames(event, snapshot),
      topLabel: snapshot.stack.length > 0 ? "top of stack" : undefined,
    },
    viewport: viewSpec.viewport,
  })
}

function buildHashMapEntries(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): HashMapEntry[] {
  const memoByKey = new Map(
    snapshot.memo.map((entry) => [entry.key, entry.value])
  )
  const activeCall = getCall(snapshot, snapshot.activeCallId)
  const keys = Array.from({ length: snapshot.amount + 1 }, (_, index) => index)

  return keys.map((key) => {
    const memoValue = memoByKey.get(key) ?? null
    let status: HashMapEntry["status"] = memoValue === null ? "pending" : "memo"
    let annotation: string | undefined

    if (event.codeLine === "L13" && activeCall?.remaining === key) {
      status = "write"
      annotation = `write ${formatFiniteOrInf(activeCall.returnValue)}`
    } else if (event.type === "memo-hit" && activeCall?.remaining === key) {
      status = "read"
      annotation = `reuse ${formatFiniteOrInf(activeCall.returnValue)}`
    } else if (event.codeLine === "L5" && activeCall?.remaining === key) {
      status = "read"
      annotation =
        memoValue === null ? "check" : `hit ${formatFiniteOrInf(memoValue)}`
    } else if (activeCall?.remaining === key && memoValue === null) {
      status = "pending"
      annotation = "active"
    }

    return {
      id: `memo-${key}`,
      key: String(key),
      value: memoValue === null ? null : (formatFiniteOrInf(memoValue) ?? null),
      status,
      annotation,
    }
  })
}

function buildHashMapPrimitive(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(memoDfsCoinChangeViewSpecs, "memo-table")

  return defineHashMapPrimitiveFrameState({
    id: "memo-table",
    kind: "hash-map",
    title: viewSpec.title,
    subtitle:
      "Solved remainders are cached so repeated calls can return immediately.",
    data: {
      entries: buildHashMapEntries(event, snapshot),
    },
    viewport: viewSpec.viewport,
  })
}

function buildNarration(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): NarrationPayloadInput {
  switch (event.type) {
    case "call":
      return {
        summary:
          event.payload.viaCoin === null
            ? `Start solving remainder ${event.payload.remaining}.`
            : `Use coin ${event.payload.viaCoin} and recurse on remainder ${event.payload.remaining}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "base-case":
      return {
        summary:
          event.codeLine === "L3"
            ? "Remainder 0 is solved: it needs 0 more coins."
            : `Negative remainder ${event.payload.remaining} is impossible, so return INF.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "memo-hit":
      return {
        summary: `Remainder ${event.payload.remaining} was solved earlier, so reuse memo value ${event.payload.memoValue}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "compare":
      return {
        summary:
          event.codeLine === "L7"
            ? `Try coin ${event.payload.coin}, which leaves remainder ${event.payload.childRemaining}.`
            : `Check whether child result ${event.payload.childValue} is usable or still INF.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "mutate":
      switch (event.codeLine) {
        case "L1":
          return {
            summary:
              "Initialize the memo table as empty before recursion starts.",
            segments: [],
            sourceValues: event.payload,
          }
        case "L6":
          return {
            summary: `Initialize best for remainder ${event.payload.remaining} as INF.`,
            segments: [],
            sourceValues: event.payload,
          }
        case "L8":
          return {
            summary: `The child call for remainder ${event.payload.childRemaining} returned ${event.payload.childValue}.`,
            segments: [],
            sourceValues: event.payload,
          }
        case "L10":
          return {
            summary: `Convert the child result into candidate ${event.payload.candidate} by using one more coin.`,
            segments: [],
            sourceValues: event.payload,
          }
        case "L11":
          return {
            summary: `Update best for remainder ${event.payload.remaining} to ${event.payload.best}.`,
            segments: [],
            sourceValues: event.payload,
          }
        case "L13":
          return {
            summary: `Write memo[${event.payload.remaining}] = ${event.payload.memoValue}.`,
            segments: [],
            sourceValues: event.payload,
          }
        case "L15":
          return {
            summary: `Store the root result as ${event.payload.answer}.`,
            segments: [],
            sourceValues: event.payload,
          }
        default:
          return {
            summary: "Advance the memoized recursion state.",
            segments: [],
            sourceValues: event.payload,
          }
      }
    case "result":
      return {
        summary:
          event.codeLine === "L14"
            ? `Return ${event.payload.returnValue} for remainder ${event.payload.remaining}.`
            : `Normalize the wrapper result to ${snapshot.normalizedAnswer}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "return":
      return {
        summary: `Return ${event.payload.returnValue} to the waiting parent call.`,
        segments: [],
        sourceValues: event.payload,
      }
    default:
      return {
        summary: "Advance the coin-change recursion state.",
        segments: [],
        sourceValues: event.payload,
      }
  }
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: CoinChangeSnapshot
): PrimitiveFrameState[] {
  return [
    buildCallTreePrimitive(event, snapshot),
    buildStackPrimitive(event, snapshot),
    buildHashMapPrimitive(event, snapshot),
  ]
}

export function projectMemoDfsCoinChange(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  void mode
  return events
    .filter((event) => event.type !== "complete")
    .map((event, index) => {
      const snapshot = event.snapshot as CoinChangeSnapshot

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
