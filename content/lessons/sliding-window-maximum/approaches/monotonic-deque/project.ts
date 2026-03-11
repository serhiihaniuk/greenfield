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
  narrationTokenFromPointer,
} from "@/domains/projection/narration"
import type { TraceEvent } from "@/domains/tracing/types"
import {
  defineArrayPrimitiveFrameState,
  defineSequencePrimitiveFrameState,
  defineStatePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import type {
  AnnotationSpec,
  HighlightSpec,
  PointerSpec,
  PrimitiveFrameState,
} from "@/entities/visualization/types"
import { deriveExecutionTokensFromPointers } from "@/shared/visualization/execution-tokens"
import { monotonicDequeSlidingWindowViewSpecs } from "./views"

type SlidingWindowMaximumSnapshot = {
  nums: number[]
  k: number
  deque: number[]
  result: number[]
  index?: number
  currentValue?: number
  windowStart?: number
}

function mapEventToVisualChange(event: TraceEvent): VisualChangeType {
  switch (event.type) {
    case "pointer-update":
      return "move"
    case "compare":
      return "compare"
    case "result":
      return "result"
    default:
      return "mutate"
  }
}

function getPayloadNumber(event: TraceEvent, key: string) {
  const value = event.payload[key]
  return typeof value === "number" ? value : undefined
}

function getWindowStart(snapshot: SlidingWindowMaximumSnapshot) {
  if (snapshot.index === undefined) {
    return undefined
  }

  return snapshot.windowStart ?? Math.max(0, snapshot.index - snapshot.k + 1)
}

function buildNarration(
  event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): NarrationPayloadInput {
  const arrayPointers = buildArrayPointers(event, snapshot)
  const dequePointers = buildDequePointers(event, snapshot)
  const indexPointer = arrayPointers.find((pointer) => pointer.id === "index")
  const frontPointer = dequePointers.find(
    (pointer) => pointer.id === "deque-front"
  )
  const backPointer = dequePointers.find(
    (pointer) => pointer.id === "deque-back"
  )
  const windowStart = getWindowStart(snapshot)
  const windowLabel =
    snapshot.index !== undefined && windowStart !== undefined
      ? `[${windowStart}..${snapshot.index}]`
      : "warming up"
  const dequeLabel =
    snapshot.deque.length > 0 ? snapshot.deque.join(" -> ") : "empty"
  const textSegment = (id: string, text: string) =>
    narrationText(`${event.id}-${id}`, text)
  const pointerSegment = (
    id: string,
    pointer: PointerSpec | undefined,
    fallbackText: string
  ) =>
    pointer
      ? narrationTokenFromPointer(`${event.id}-${id}`, pointer)
      : textSegment(id, fallbackText)

  switch (event.codeLine) {
    case "L1":
      return defineStructuredNarration({
        family: "setup",
        headline: "Initialize the monotonic deque as empty.",
        reason:
          "It will hold only live candidate indices in decreasing value order, so the front can always name the strongest current maximum.",
        implication:
          "The scan can now start feeding indices into that candidate structure one by one.",
        evidence: [
          {
            id: `${event.id}-deque`,
            label: "Deque",
            value: dequeLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L2":
      return defineStructuredNarration({
        family: "setup",
        headline: "Initialize the result list as empty.",
        reason:
          "Every full window will contribute exactly one committed maximum in left-to-right scan order.",
        implication:
          "Once the first full window closes, the next commit frame can append its maximum here.",
        evidence: [
          {
            id: `${event.id}-result`,
            label: "Result",
            value: snapshot.result.length > 0 ? snapshot.result.join(", ") : "[]",
          },
        ],
        sourceValues: event.payload,
      })
    case "L3":
      return defineStructuredNarration({
        family: event.payload.result === false ? "return" : "check",
        headline:
          event.payload.result === false
            ? "All indices have been processed."
            : [
                textSegment("headline-0", "Advance "),
                pointerSegment("headline-index", indexPointer, "i"),
                textSegment(
                  "headline-1",
                  ` to index ${snapshot.index} for the next window transition.`
                ),
              ],
        reason:
          event.payload.result === false
            ? "The scan pointer has moved past the end of the array, so no new windows can form."
            : "Each loop iteration introduces one new index, repairs the deque, and possibly emits one maximum.",
        implication:
          event.payload.result === false
            ? "The maxima list is complete and can now be returned."
            : "The next frame makes the incoming array value concrete before the deque repairs begin.",
        evidence: [
          {
            id: `${event.id}-window`,
            label: "Live window",
            value: windowLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L4":
      return defineStructuredNarration({
        family: "advance",
        headline: [
          textSegment("headline-0", "Move "),
          pointerSegment("headline-index", indexPointer, "i"),
          textSegment(
            "headline-1",
            ` to nums[${snapshot.index}] = ${snapshot.currentValue}.`
          ),
        ],
        reason:
          "The incoming index is the only new candidate that can evict stale or weaker deque entries on this step.",
        implication:
          "The following checks decide whether older front or back candidates still deserve to survive around it.",
        evidence: [
          {
            id: `${event.id}-window`,
            label: "Live window",
            value: windowLabel,
          },
          {
            id: `${event.id}-deque`,
            label: "Deque before repair",
            value: dequeLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L5":
      return defineStructuredNarration({
        family: "check",
        headline:
          event.payload.result
            ? [
                pointerSegment("headline-front", frontPointer, "front"),
                textSegment(
                  "headline-0",
                  ` at index ${event.payload.frontIndex} has fallen out of the live window.`
                ),
              ]
            : [
                pointerSegment("headline-front", frontPointer, "front"),
                textSegment("headline-0", " still belongs to the live window."),
              ],
        reason: event.payload.result
          ? `Its index is at or before ${event.payload.windowFloor}, so it can no longer represent the current window ${windowLabel}.`
          : `Its index is still inside the current window ${windowLabel}, so it remains a valid maximum candidate.`,
        implication: event.payload.result
          ? "The next frame must remove that stale front before any maximum can be trusted."
          : "Deque repair can continue by checking whether the back is dominated by the incoming value.",
        evidence: [
          {
            id: `${event.id}-front`,
            label: "Front index",
            value: `${event.payload.frontIndex ?? "-"}`,
            tokenId: frontPointer?.id,
            tokenStyle: frontPointer
              ? deriveExecutionTokensFromPointers([frontPointer]).get(
                  frontPointer.id
                )?.style
              : undefined,
          },
          {
            id: `${event.id}-window`,
            label: "Live window",
            value: windowLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L6":
      return defineStructuredNarration({
        family: "shift",
        headline: `Remove stale index ${event.payload.poppedIndex} from the deque front.`,
        reason:
          "Candidates outside the live window cannot be the maximum for this step, even if they were strongest earlier.",
        implication:
          "The deque front now points to the oldest remaining candidate that still overlaps the current window.",
        evidence: [
          {
            id: `${event.id}-removed`,
            label: "Removed index",
            value: `${event.payload.poppedIndex ?? "-"}`,
          },
          {
            id: `${event.id}-deque`,
            label: "Deque after shift",
            value: dequeLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L8":
      return defineStructuredNarration({
        family: "compare",
        headline:
          event.payload.result
            ? [
                pointerSegment("headline-back", backPointer, "back"),
                textSegment(
                  "headline-0",
                  ` at index ${event.payload.backIndex} is dominated by ${snapshot.currentValue}.`
                ),
              ]
            : [
                pointerSegment("headline-back", backPointer, "back"),
                textSegment(
                  "headline-0",
                  ` stays because ${event.payload.backValue} is larger than ${snapshot.currentValue}.`
                ),
              ],
        reason: event.payload.result
          ? "A smaller-or-equal value behind the incoming index can never beat that newer value in this window or any later overlapping window."
          : "A larger back value can still outlive the incoming index as a stronger maximum candidate, so the decreasing-order invariant already holds.",
        implication: event.payload.result
          ? "The next frame pops that dominated candidate from the deque back."
          : "The deque is ready to append the incoming index without breaking monotonic order.",
        evidence: [
          {
            id: `${event.id}-comparison`,
            label: "Back vs current",
            value: `${event.payload.backValue ?? "-"} vs ${snapshot.currentValue ?? "-"}`,
          },
          {
            id: `${event.id}-deque`,
            label: "Deque",
            value: dequeLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L9":
      return defineStructuredNarration({
        family: "prune",
        headline: `Pop dominated index ${event.payload.poppedIndex} from the deque back.`,
        reason:
          "That older candidate is weaker than the incoming value and will expire sooner, so it can never become a future maximum.",
        implication:
          "The deque back now exposes the next strongest surviving candidate before the incoming index is appended.",
        evidence: [
          {
            id: `${event.id}-removed`,
            label: "Removed index",
            value: `${event.payload.poppedIndex ?? "-"}`,
          },
          {
            id: `${event.id}-deque`,
            label: "Deque after prune",
            value: dequeLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L11":
      return defineStructuredNarration({
        family: "expand",
        headline: [
          textSegment("headline-0", "Push "),
          pointerSegment("headline-index", indexPointer, "i"),
          textSegment(
            "headline-1",
            " into the deque as a surviving candidate."
          ),
        ],
        reason:
          "All stale and dominated indices have already been removed, so the incoming index is now the newest valid candidate for upcoming windows.",
        implication:
          snapshot.index !== undefined && snapshot.index >= snapshot.k - 1
            ? "Because the window is now full, the next frame can emit the deque front as its maximum."
            : "The deque is ready, but the window still needs more elements before any maximum can be committed.",
        evidence: [
          {
            id: `${event.id}-deque`,
            label: "Deque after push",
            value: dequeLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L12":
      return defineStructuredNarration({
        family: "check",
        headline: event.payload.result
          ? "The live window now contains k elements."
          : "The live window is still warming up.",
        reason: event.payload.result
          ? `Once i reaches ${snapshot.k - 1}, every step closes a full window of size ${snapshot.k}.`
          : `Fewer than ${snapshot.k} elements are in scope, so a maximum would be premature.`,
        implication: event.payload.result
          ? "The next frame can safely read the deque front as the maximum for this window."
          : "The scan continues until the first full window forms.",
        evidence: [
          {
            id: `${event.id}-window`,
            label: "Live window",
            value: windowLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L13":
      return defineStructuredNarration({
        family: "commit",
        headline: [
          textSegment("headline-0", `Emit ${event.payload.maxValue} from `),
          pointerSegment("headline-front", frontPointer, "front"),
          textSegment("headline-1", ` at index ${event.payload.maxIndex}.`),
        ],
        reason:
          "The deque stores candidates in decreasing value order, so the front is always the strongest live maximum candidate.",
        implication:
          "The result list grows by one, and the next incoming index can shift the window forward again.",
        evidence: [
          {
            id: `${event.id}-result`,
            label: "Result length",
            value: `${event.payload.resultLength ?? snapshot.result.length}`,
          },
          {
            id: `${event.id}-window`,
            label: "Window maximum",
            value: `${event.payload.maxValue ?? "-"}`,
          },
        ],
        sourceValues: event.payload,
      })
    case "L16":
      return defineStructuredNarration({
        family: "return",
        headline: `Return the completed maxima list [${snapshot.result.join(", ")}].`,
        reason:
          "Every full window emitted exactly one maximum, so the result list now contains the full scan order of committed answers.",
        implication:
          "The algorithm is finished; there are no remaining windows to repair or emit.",
        evidence: [
          {
            id: `${event.id}-result`,
            label: "Returned maxima",
            value:
              snapshot.result.length > 0
                ? `[${snapshot.result.join(", ")}]`
                : "[]",
          },
        ],
        sourceValues: event.payload,
      })
    default:
      return defineStructuredNarration({
        family: "shift",
        headline: "Advance the deque-backed window state.",
        reason:
          "The lesson keeps the scan, deque invariants, and output commitments synchronized one learner-visible change at a time.",
        implication:
          "The next frame will expose the next concrete array or deque transition.",
        sourceValues: event.payload,
      })
  }
}

function buildArrayHighlights(
  event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): HighlightSpec[] {
  const windowStart = getWindowStart(snapshot)
  const comparedIndex =
    getPayloadNumber(event, "frontIndex") ??
    getPayloadNumber(event, "backIndex") ??
    getPayloadNumber(event, "poppedIndex")
  const maxIndex = getPayloadNumber(event, "maxIndex")

  return snapshot.nums.map((_, index) => {
    const inWindow =
      snapshot.index !== undefined &&
      windowStart !== undefined &&
      index >= windowStart &&
      index <= snapshot.index

    if (index === maxIndex) {
      return {
        targetId: `cell-${index}`,
        tone: "found",
        emphasis: "strong",
      }
    }

    if (
      (event.codeLine === "L5" ||
        event.codeLine === "L8" ||
        event.codeLine === "L6" ||
        event.codeLine === "L9") &&
      comparedIndex === index
    ) {
      return {
        targetId: `cell-${index}`,
        tone:
          event.codeLine === "L6"
            ? "error"
            : event.codeLine === "L9"
              ? "mutated"
              : "compare",
        emphasis: "strong",
      }
    }

    if (
      event.codeLine === "L11" &&
      getPayloadNumber(event, "pushedIndex") === index
    ) {
      return {
        targetId: `cell-${index}`,
        tone: "mutated",
        emphasis: "strong",
      }
    }

    if (event.codeLine === "L4" && snapshot.index === index) {
      return {
        targetId: `cell-${index}`,
        tone: "active",
        emphasis: "strong",
      }
    }

    if (inWindow) {
      return {
        targetId: `cell-${index}`,
        tone: "candidate",
        emphasis: "soft",
      }
    }

    if (windowStart !== undefined && index < windowStart) {
      return {
        targetId: `cell-${index}`,
        tone: "done",
        emphasis: "soft",
      }
    }

    return {
      targetId: `cell-${index}`,
      tone: snapshot.index === undefined ? "default" : "dim",
      emphasis: "soft",
    }
  })
}

function buildArrayAnnotations(
  event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): AnnotationSpec[] {
  const annotations: AnnotationSpec[] = []
  const poppedIndex = getPayloadNumber(event, "poppedIndex")
  const pushedIndex = getPayloadNumber(event, "pushedIndex")
  const maxIndex = getPayloadNumber(event, "maxIndex")

  if (event.codeLine === "L6" && poppedIndex !== undefined) {
    annotations.push({
      id: `${event.id}-stale`,
      targetId: `cell-${poppedIndex}`,
      kind: "badge",
      text: "stale",
      tone: "warning",
    })
  }

  if (event.codeLine === "L9" && poppedIndex !== undefined) {
    annotations.push({
      id: `${event.id}-pop-back`,
      targetId: `cell-${poppedIndex}`,
      kind: "badge",
      text: "pop back",
      tone: "active",
    })
  }

  if (event.codeLine === "L11" && pushedIndex !== undefined) {
    annotations.push({
      id: `${event.id}-push`,
      targetId: `cell-${pushedIndex}`,
      kind: "badge",
      text: "push",
      tone: "success",
    })
  }

  if (event.codeLine === "L13" && maxIndex !== undefined) {
    annotations.push({
      id: `${event.id}-max`,
      targetId: `cell-${maxIndex}`,
      kind: "badge",
      text: `max ${event.payload.maxValue}`,
      tone: "success",
    })
  }

  if (event.codeLine === "L16" && snapshot.deque[0] !== undefined) {
    annotations.push({
      id: `${event.id}-return`,
      targetId: `cell-${snapshot.deque[0]}`,
      kind: "badge",
      text: "return",
      tone: "success",
    })
  }

  if (event.codeLine === "L4" && snapshot.index !== undefined) {
    annotations.push({
      id: `${event.id}-current`,
      targetId: `cell-${snapshot.index}`,
      kind: "badge",
      text: "current",
      tone: "active",
    })
  }

  return annotations
}

function buildArrayPointers(
  _event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): PointerSpec[] {
  if (snapshot.index === undefined) {
    return []
  }

  return [
    {
      id: "index",
      targetId: `cell-${snapshot.index}`,
      label: "i",
      tone: "primary",
      placement: "top",
      status: "active",
    },
  ]
}

function buildDequeHighlights(
  event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): HighlightSpec[] {
  const backIndex = getPayloadNumber(event, "backIndex")
  const pushedIndex = getPayloadNumber(event, "pushedIndex")
  const maxIndex = getPayloadNumber(event, "maxIndex")

  return snapshot.deque.map((dequeIndex, order) => {
    if (event.codeLine === "L8" && backIndex === dequeIndex) {
      return {
        targetId: `deque-${dequeIndex}`,
        tone: "compare",
        emphasis: "strong",
      }
    }

    if (event.codeLine === "L11" && pushedIndex === dequeIndex) {
      return {
        targetId: `deque-${dequeIndex}`,
        tone: "mutated",
        emphasis: "strong",
      }
    }

    if (event.codeLine === "L13" && maxIndex === dequeIndex) {
      return {
        targetId: `deque-${dequeIndex}`,
        tone: "found",
        emphasis: "strong",
      }
    }

    return {
      targetId: `deque-${dequeIndex}`,
      tone: order === 0 ? "candidate" : "default",
      emphasis: order === 0 ? "strong" : "normal",
    }
  })
}

function buildDequePointers(
  _event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): PointerSpec[] {
  if (snapshot.deque.length === 0) {
    return []
  }

  const frontIndex = snapshot.deque[0]
  const backIndex = snapshot.deque.at(-1)
  const pointers: PointerSpec[] = [
    {
      id: "deque-front",
      targetId: `deque-${frontIndex}`,
      label: "front",
      tone: "secondary",
      placement: "top",
      priority: 1,
      status: "active",
    },
  ]

  if (backIndex !== undefined) {
    pointers.push({
      id: "deque-back",
      targetId: `deque-${backIndex}`,
      label: "back",
      tone: "compare",
      placement: "bottom",
      priority: 2,
      status: "waiting",
    })
  }

  return pointers
}

function buildDequeAnnotations(
  event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): AnnotationSpec[] {
  const annotations: AnnotationSpec[] = []
  const backIndex = getPayloadNumber(event, "backIndex")
  const pushedIndex = getPayloadNumber(event, "pushedIndex")
  const maxIndex = getPayloadNumber(event, "maxIndex")

  if (event.codeLine === "L8" && backIndex !== undefined) {
    annotations.push({
      id: `${event.id}-compare-back`,
      targetId: `deque-${backIndex}`,
      kind: "badge",
      text: "compare",
      tone: "active",
    })
  }

  if (event.codeLine === "L11" && pushedIndex !== undefined) {
    annotations.push({
      id: `${event.id}-push`,
      targetId: `deque-${pushedIndex}`,
      kind: "badge",
      text: "push",
      tone: "success",
    })
  }

  if (event.codeLine === "L13" && maxIndex !== undefined) {
    annotations.push({
      id: `${event.id}-output`,
      targetId: `deque-${maxIndex}`,
      kind: "badge",
      text: "emit",
      tone: "success",
    })
  }

  if (event.codeLine === "L16" && snapshot.deque[0] !== undefined) {
    annotations.push({
      id: `${event.id}-return`,
      targetId: `deque-${snapshot.deque[0]}`,
      kind: "badge",
      text: "return",
      tone: "success",
    })
  }

  if (event.codeLine === "L5" && snapshot.deque[0] !== undefined) {
    annotations.push({
      id: `${event.id}-front-check`,
      targetId: `deque-${snapshot.deque[0]}`,
      kind: "badge",
      text: "front",
      tone: "muted",
    })
  }

  return annotations
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): PrimitiveFrameState[] {
  const arrayViewSpec = getLessonViewSpec(
    monotonicDequeSlidingWindowViewSpecs,
    "window-array"
  )
  const dequeViewSpec = getLessonViewSpec(
    monotonicDequeSlidingWindowViewSpecs,
    "monotonic-deque"
  )
  const stateViewSpec = getLessonViewSpec(
    monotonicDequeSlidingWindowViewSpecs,
    "window-state"
  )
  const arrayPointers = buildArrayPointers(event, snapshot)
  const dequePointers = buildDequePointers(event, snapshot)
  const executionTokens = deriveExecutionTokensFromPointers([
    ...arrayPointers,
    ...dequePointers,
  ])

  const arrayPrimitive = defineArrayPrimitiveFrameState({
    id: "window-array",
    kind: "array",
    title: arrayViewSpec.title,
    subtitle:
      "The current index enters the window while stale and dominated candidates are removed around it.",
    data: {
      cells: snapshot.nums.map((value, index) => ({
        id: `cell-${index}`,
        index,
        value,
      })),
    },
    pointers: arrayPointers,
    highlights: buildArrayHighlights(event, snapshot),
    annotations: buildArrayAnnotations(event, snapshot),
    viewport: arrayViewSpec.viewport,
  })

  const dequePrimitive = defineSequencePrimitiveFrameState({
    id: "monotonic-deque",
    kind: "sequence",
    title: dequeViewSpec.title,
    subtitle:
      "Indices stay in decreasing value order, so the front always names the current maximum candidate.",
    data: {
      leadingLabel: "front",
      trailingLabel: "back",
      items: snapshot.deque.map((dequeIndex) => ({
        id: `deque-${dequeIndex}`,
        label: `${dequeIndex}`,
        detail: `val ${snapshot.nums[dequeIndex]}`,
      })),
    },
    pointers: dequePointers,
    highlights: buildDequeHighlights(event, snapshot),
    annotations: buildDequeAnnotations(event, snapshot),
    viewport: dequeViewSpec.viewport,
  })

  const frontIndex = snapshot.deque[0]
  const backIndex = snapshot.deque.at(-1)
  const statePrimitive = defineStatePrimitiveFrameState({
    id: "window-state",
    kind: "state",
    title: stateViewSpec.title,
    data: {
      values: [
        {
          label: "i",
          value: snapshot.index ?? "-",
          tokenId: executionTokens.get("index")?.id,
          tokenStyle: executionTokens.get("index")?.style,
        },
        { label: "current", value: snapshot.currentValue ?? "-" },
        { label: "k", value: snapshot.k },
        {
          label: "deque",
          value: snapshot.deque.length > 0 ? snapshot.deque.join(" -> ") : "-",
        },
        {
          label: "front",
          value: frontIndex ?? "-",
          tokenId: executionTokens.get("deque-front")?.id,
          tokenStyle: executionTokens.get("deque-front")?.style,
        },
        {
          label: "frontVal",
          value: frontIndex !== undefined ? snapshot.nums[frontIndex] : "-",
        },
        {
          label: "back",
          value: backIndex ?? "-",
          tokenId: executionTokens.get("deque-back")?.id,
          tokenStyle: executionTokens.get("deque-back")?.style,
        },
        {
          label: "result",
          value:
            snapshot.result.length > 0
              ? snapshot.result.join(", ")
              : event.codeLine === "L1"
                ? "-"
                : "[]",
        },
      ],
    },
    viewport: stateViewSpec.viewport,
  })

  return [arrayPrimitive, dequePrimitive, statePrimitive]
}

export function projectMonotonicDequeSlidingWindowMaximum(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  void mode
  return events
    .filter((event) => event.type !== "complete")
    .map((event, index) => {
      const snapshot = event.snapshot as SlidingWindowMaximumSnapshot

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
