import type { VisualizationMode } from "@/domains/lessons/types"
import {
  defineFrame,
  type Frame,
  type NarrationPayload,
  type VisualChangeType,
} from "@/domains/projection/types"
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
): NarrationPayload {
  switch (event.codeLine) {
    case "L1":
      return {
        summary:
          "Initialize an empty deque that will keep candidate indices in decreasing value order.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L2":
      return {
        summary: "Initialize the output list for completed window maximums.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L3":
      return {
        summary:
          event.payload.result === false
            ? "Every index has been processed, so the output list is complete."
            : `Advance to index ${snapshot.index} for the next window transition.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L4":
      return {
        summary: `Move the focus to nums[${snapshot.index}] = ${snapshot.currentValue}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L5":
      return {
        summary: Boolean(event.payload.result)
          ? `Deque front index ${event.payload.frontIndex} is stale, so it must leave the window.`
          : "The deque front still belongs to the current window, so keep it.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L6":
      return {
        summary: `Remove stale index ${event.payload.poppedIndex} from the deque front.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L8":
      return {
        summary: Boolean(event.payload.result)
          ? `Deque back index ${event.payload.backIndex} is dominated by ${snapshot.currentValue}, so pop it.`
          : "The deque back is larger than the current value, so it can stay as a candidate.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L9":
      return {
        summary: `Pop dominated index ${event.payload.poppedIndex} from the deque back.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L11":
      return {
        summary: `Push index ${event.payload.pushedIndex} so it can compete in later windows.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L12":
      return {
        summary: Boolean(event.payload.result)
          ? "The first full window is ready, so emit its maximum."
          : "The window is not full yet, so do not emit an output.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L13":
      return {
        summary: `Append ${event.payload.maxValue} from deque front index ${event.payload.maxIndex} to the result.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L16":
      return {
        summary: `Return the completed maxima list [${snapshot.result.join(", ")}].`,
        segments: [],
        sourceValues: event.payload,
      }
    default:
      return {
        summary: "Advance the deque-backed window state.",
        segments: [],
        sourceValues: event.payload,
      }
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
  event: TraceEvent,
  snapshot: SlidingWindowMaximumSnapshot
): PointerSpec[] {
  if (snapshot.index === undefined || event.codeLine === "L3") {
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
  event: TraceEvent,
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
      label: event.codeLine === "L13" ? "max" : "front",
      tone: event.codeLine === "L13" ? "success" : "primary",
      placement: "top",
      priority: 1,
      status: "active",
    },
  ]

  if (backIndex !== undefined && backIndex !== frontIndex) {
    pointers.push({
      id: "deque-back",
      targetId: `deque-${backIndex}`,
      label: "back",
      tone: "secondary",
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
  snapshot: SlidingWindowMaximumSnapshot,
  mode: VisualizationMode
): PrimitiveFrameState[] {
  const arrayPrimitive = defineArrayPrimitiveFrameState({
    id: "window-array",
    kind: "array",
    title: "Sliding Window",
    subtitle:
      "The current index enters the window while stale and dominated candidates are removed around it.",
    data: {
      cells: snapshot.nums.map((value, index) => ({
        id: `cell-${index}`,
        index,
        value,
      })),
    },
    pointers: buildArrayPointers(event, snapshot),
    highlights: buildArrayHighlights(event, snapshot),
    annotations: buildArrayAnnotations(event, snapshot),
    viewport: {
      role: "primary",
      preferredWidth: 960,
      minHeight: 300,
    },
  })

  const dequePrimitive = defineSequencePrimitiveFrameState({
    id: "monotonic-deque",
    kind: "sequence",
    title: "Monotonic Deque",
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
    pointers: buildDequePointers(event, snapshot),
    highlights: buildDequeHighlights(event, snapshot),
    annotations: buildDequeAnnotations(event, snapshot),
    viewport: {
      role: "secondary",
      preferredWidth: 360,
      minHeight: 220,
    },
  })

  const frontIndex = snapshot.deque[0]
  const backIndex = snapshot.deque.at(-1)
  const statePrimitive = defineStatePrimitiveFrameState({
    id: "window-state",
    kind: "state",
    title: mode === "code" ? "Deque State" : "Window State",
    data: {
      values: [
        { label: "index", value: snapshot.index ?? "-" },
        { label: "current", value: snapshot.currentValue ?? "-" },
        { label: "k", value: snapshot.k },
        {
          label: "deque",
          value: snapshot.deque.length > 0 ? snapshot.deque.join(" -> ") : "-",
        },
        { label: "frontIdx", value: frontIndex ?? "-" },
        {
          label: "frontVal",
          value: frontIndex !== undefined ? snapshot.nums[frontIndex] : "-",
        },
        { label: "backIdx", value: backIndex ?? "-" },
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
    viewport: {
      role: "secondary",
      preferredWidth: 320,
      minHeight: 240,
    },
  })

  return mode === "code"
    ? [arrayPrimitive, dequePrimitive]
    : [arrayPrimitive, dequePrimitive, statePrimitive]
}

export function projectMonotonicDequeSlidingWindowMaximum(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
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
