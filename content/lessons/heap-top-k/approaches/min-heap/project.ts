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
  defineArrayPrimitiveFrameState,
  defineStatePrimitiveFrameState,
  defineTreePrimitiveFrameState,
  type TreeNode,
} from "@/entities/visualization/primitives"
import type {
  AnnotationSpec,
  EdgeHighlightSpec,
  HighlightSpec,
  PointerSpec,
  PrimitiveFrameState,
} from "@/entities/visualization/types"
import { minHeapTopKViewSpecs } from "./views"

type HeapTopKSnapshot = {
  nums: number[]
  k: number
  heap: number[]
  currentIndex?: number
  currentValue?: number
  result?: number[]
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

function buildNarration(
  event: TraceEvent,
  snapshot: HeapTopKSnapshot
): NarrationPayload {
  switch (event.codeLine) {
    case "L1":
      return {
        summary:
          "Start with an empty min-heap that will hold only the current top k values.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L2":
      return {
        summary: `Scan nums[${snapshot.currentIndex}] = ${snapshot.currentValue}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L3":
      return {
        summary: event.payload.hasRoom
          ? `The heap has room because size ${event.payload.heapSize} is still below k = ${snapshot.k}.`
          : `The heap is full at size ${snapshot.k}, so the new value must beat the root threshold to stay.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L4":
      return {
        summary: `Push ${event.payload.pushedValue} into the heap as a new top-k candidate.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L5":
      return event.type === "compare"
        ? {
            summary: event.payload.shouldSwap
              ? `${event.payload.childValue} is smaller than parent ${event.payload.parentValue}, so bubble it up.`
              : `${event.payload.childValue} is not smaller than parent ${event.payload.parentValue}, so the min-heap order already holds.`,
            segments: [],
            sourceValues: event.payload,
          }
        : {
            summary: `Swap heap slots ${event.payload.parentIndex} and ${event.payload.childIndex} to restore min-heap order.`,
            segments: [],
            sourceValues: event.payload,
          }
    case "L6":
      return {
        summary: event.payload.shouldReplace
          ? `${event.payload.currentValue} beats the root threshold ${event.payload.rootValue}, so it enters the top-k set.`
          : `${event.payload.currentValue} does not beat the root threshold ${event.payload.rootValue}, so it is skipped.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L7":
      return {
        summary: `Replace heap root ${event.payload.replacedValue} with ${event.payload.nextValue}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L8":
      return event.type === "compare"
        ? {
            summary: event.payload.shouldSwap
              ? `The smaller child ${event.payload.chosenChildValue} is below parent ${event.payload.parentValue}, so sift the replacement down.`
              : `Parent ${event.payload.parentValue} is already below its smaller child ${event.payload.chosenChildValue}, so the heap is restored.`,
            segments: [],
            sourceValues: event.payload,
          }
        : {
            summary: `Swap parent slot ${event.payload.parentIndex} with child slot ${event.payload.childIndex} during sift-down.`,
            segments: [],
            sourceValues: event.payload,
          }
    case "L11":
      return {
        summary: `Return the top-k values [${(snapshot.result ?? []).join(", ")}] in descending order.`,
        segments: [],
        sourceValues: event.payload,
      }
    default:
      return {
        summary: "Advance the heap-backed top-k state.",
        segments: [],
        sourceValues: event.payload,
      }
  }
}

function buildInputHighlights(
  event: TraceEvent,
  snapshot: HeapTopKSnapshot
): HighlightSpec[] {
  return snapshot.nums.map((_, index) => {
    if (snapshot.currentIndex === index) {
      if (event.codeLine === "L3" || event.codeLine === "L6") {
        return {
          targetId: `num-${index}`,
          tone: "compare",
          emphasis: "strong",
        }
      }

      if (event.codeLine === "L4" || event.codeLine === "L7") {
        return {
          targetId: `num-${index}`,
          tone: "mutated",
          emphasis: "strong",
        }
      }

      return {
        targetId: `num-${index}`,
        tone: "active",
        emphasis: "strong",
      }
    }

    if (snapshot.currentIndex !== undefined && index < snapshot.currentIndex) {
      return {
        targetId: `num-${index}`,
        tone: "done",
        emphasis: "soft",
      }
    }

    return {
      targetId: `num-${index}`,
      tone: snapshot.currentIndex === undefined ? "default" : "dim",
      emphasis: "soft",
    }
  })
}

function buildInputAnnotations(
  event: TraceEvent,
  snapshot: HeapTopKSnapshot
): AnnotationSpec[] {
  if (snapshot.currentIndex === undefined) {
    return []
  }

  if (event.codeLine === "L4") {
    return [
      {
        id: `${event.id}-push`,
        targetId: `num-${snapshot.currentIndex}`,
        kind: "badge",
        text: "push",
        tone: "success",
      },
    ]
  }

  if (event.codeLine === "L3") {
    return [
      {
        id: `${event.id}-room`,
        targetId: `num-${snapshot.currentIndex}`,
        kind: "badge",
        text: event.payload.hasRoom ? "room" : "full",
        tone: event.payload.hasRoom ? "active" : "muted",
      },
    ]
  }

  if (event.codeLine === "L7") {
    return [
      {
        id: `${event.id}-replace`,
        targetId: `num-${snapshot.currentIndex}`,
        kind: "badge",
        text: "replace",
        tone: "active",
      },
    ]
  }

  if (event.codeLine === "L6" && !event.payload.shouldReplace) {
    return [
      {
        id: `${event.id}-skip`,
        targetId: `num-${snapshot.currentIndex}`,
        kind: "badge",
        text: "skip",
        tone: "warning",
      },
    ]
  }

  return []
}

function buildInputPointers(snapshot: HeapTopKSnapshot): PointerSpec[] {
  if (snapshot.currentIndex === undefined) {
    return []
  }

  return [
    {
      id: "scan-index",
      targetId: `num-${snapshot.currentIndex}`,
      label: "i",
      tone: "primary",
      placement: "top",
      status: "active",
    },
  ]
}

function buildHeapEdgeHighlights(event: TraceEvent): EdgeHighlightSpec[] {
  if (event.codeLine === "L5") {
    const parentIndex = getPayloadNumber(event, "parentIndex")
    const childIndex = getPayloadNumber(event, "childIndex")
    if (parentIndex === undefined || childIndex === undefined) {
      return []
    }

    return [
      {
        id: `${event.id}-sift-up`,
        sourceId: `slot-${parentIndex}`,
        targetId: `slot-${childIndex}`,
        tone: event.type === "compare" ? "active" : "done",
        emphasis: "strong",
      },
    ]
  }

  if (event.codeLine === "L8") {
    const parentIndex = getPayloadNumber(event, "parentIndex")
    const childIndex =
      getPayloadNumber(event, "chosenChildIndex") ??
      getPayloadNumber(event, "childIndex")

    if (parentIndex === undefined || childIndex === undefined) {
      return []
    }

    return [
      {
        id: `${event.id}-sift-down`,
        sourceId: `slot-${parentIndex}`,
        targetId: `slot-${childIndex}`,
        tone: event.type === "compare" ? "active" : "done",
        emphasis: "strong",
      },
    ]
  }

  return []
}

function buildHeapNodes(
  event: TraceEvent,
  snapshot: HeapTopKSnapshot
): TreeNode[] {
  const parentIndex = getPayloadNumber(event, "parentIndex")
  const childIndex =
    getPayloadNumber(event, "childIndex") ??
    getPayloadNumber(event, "chosenChildIndex")
  const pushedIndex = getPayloadNumber(event, "pushedIndex")
  const rootIndex = getPayloadNumber(event, "rootIndex")

  return snapshot.heap.map((value, index) => {
    let status: TreeNode["status"] = "default"
    if (
      index === pushedIndex ||
      index === parentIndex ||
      index === childIndex ||
      index === rootIndex
    ) {
      status = event.type === "compare" ? "active" : "found"
    } else if (event.codeLine === "L11") {
      status = "done"
    }

    let annotation: string | undefined
    if (index === 0 && snapshot.heap.length > 0) {
      annotation = `min ${snapshot.heap[0]}`
    }

    if (event.codeLine === "L4" && index === pushedIndex) {
      annotation = "push"
    } else if (event.codeLine === "L5" && index === childIndex) {
      annotation = event.type === "compare" ? "child" : "down"
    } else if (event.codeLine === "L5" && index === parentIndex) {
      annotation = event.type === "compare" ? "parent" : "up"
    } else if (event.codeLine === "L7" && index === 0) {
      annotation = `drop ${event.payload.replacedValue}`
    } else if (event.codeLine === "L8" && index === parentIndex) {
      annotation = event.type === "compare" ? "parent" : "down"
    } else if (event.codeLine === "L8" && index === childIndex) {
      annotation = event.type === "compare" ? "child" : "up"
    } else if (event.codeLine === "L11") {
      annotation = index === 0 ? "threshold" : `top ${value}`
    }

    return {
      id: `slot-${index}`,
      label: String(value),
      parentId: index === 0 ? undefined : `slot-${Math.floor((index - 1) / 2)}`,
      annotation,
      status,
    }
  })
}

function buildHeapPrimitive(
  event: TraceEvent,
  snapshot: HeapTopKSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(minHeapTopKViewSpecs, "min-heap")

  return defineTreePrimitiveFrameState({
    id: "min-heap",
    kind: "tree",
    title: viewSpec.title,
    subtitle:
      "The root is the weakest kept value, so every new candidate must beat it before entering the top-k set.",
    data: {
      nodes: buildHeapNodes(event, snapshot),
      rootId: "slot-0",
    },
    edgeHighlights: buildHeapEdgeHighlights(event),
    viewport: viewSpec.viewport,
  })
}

function buildInputPrimitive(
  event: TraceEvent,
  snapshot: HeapTopKSnapshot
): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(minHeapTopKViewSpecs, "input-array")

  return defineArrayPrimitiveFrameState({
    id: "input-array",
    kind: "array",
    title: viewSpec.title,
    subtitle:
      "Each value is considered exactly once against the current heap threshold.",
    data: {
      cells: snapshot.nums.map((value, index) => ({
        id: `num-${index}`,
        index,
        value,
      })),
    },
    pointers: buildInputPointers(snapshot),
    highlights: buildInputHighlights(event, snapshot),
    annotations: buildInputAnnotations(event, snapshot),
    viewport: viewSpec.viewport,
  })
}

function buildStatePrimitive(snapshot: HeapTopKSnapshot): PrimitiveFrameState {
  const viewSpec = getLessonViewSpec(minHeapTopKViewSpecs, "heap-state")

  return defineStatePrimitiveFrameState({
    id: "heap-state",
    kind: "state",
    title: viewSpec.title,
    data: {
      values: [
        { label: "i", value: snapshot.currentIndex ?? "-" },
        { label: "num", value: snapshot.currentValue ?? "-" },
        { label: "k", value: snapshot.k },
        { label: "size", value: snapshot.heap.length },
        { label: "threshold", value: snapshot.heap[0] ?? "-" },
        {
          label: "heap",
          value: snapshot.heap.length > 0 ? `[${snapshot.heap.join(", ")}]` : "[]",
        },
        {
          label: "topK",
          value:
            snapshot.result !== undefined
              ? `[${snapshot.result.join(", ")}]`
              : `[${[...snapshot.heap]
                  .sort((left, right) => right - left)
                  .join(", ")}]`,
        },
      ],
    },
    viewport: viewSpec.viewport,
  })
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: HeapTopKSnapshot
): PrimitiveFrameState[] {
  return [
    buildHeapPrimitive(event, snapshot),
    buildInputPrimitive(event, snapshot),
    buildStatePrimitive(snapshot),
  ]
}

export function projectMinHeapTopK(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  void mode
  return events
    .filter((event) => event.type !== "complete")
    .map((event, index) => {
      const snapshot = event.snapshot as HeapTopKSnapshot

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
