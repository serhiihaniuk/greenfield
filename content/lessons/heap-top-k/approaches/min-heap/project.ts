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
  defineArrayPrimitiveFrameState,
  defineStatePrimitiveFrameState,
  defineTreePrimitiveFrameState,
  type TreeNode,
} from "@/entities/visualization/primitives"
import type {
  AnnotationSpec,
  EdgeHighlightSpec,
  ExecutionTokenStyle,
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

const scanIndexToken = {
  id: "scan-index",
  label: "i",
  style: "accent-1" as ExecutionTokenStyle,
}

function narrationScanToken(id: string) {
  return narrationToken({
    id,
    text: scanIndexToken.label,
    tokenId: scanIndexToken.id,
    tokenStyle: scanIndexToken.style,
  })
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
): NarrationPayloadInput {
  const currentIndex = snapshot.currentIndex
  const currentValue = snapshot.currentValue
  const heapSize =
    typeof event.payload.heapSize === "number"
      ? event.payload.heapSize
      : snapshot.heap.length
  const thresholdValue =
    typeof event.payload.rootValue === "number"
      ? event.payload.rootValue
      : (snapshot.heap[0] ?? "-")

  switch (event.codeLine) {
    case "L1":
      return defineStructuredNarration({
        family: "setup",
        headline:
          "Start with an empty min-heap that will keep only the strongest top-k candidates.",
        reason:
          "A min-heap makes the weakest kept value easy to inspect at the root, so every new candidate has a clear threshold to beat.",
        implication:
          "The next frames will scan the input one value at a time against that evolving threshold.",
        evidence: [
          {
            id: `${event.id}-k`,
            label: "k",
            value: `${snapshot.k}`,
          },
        ],
        sourceValues: event.payload,
      })
    case "L2":
      return defineStructuredNarration({
        family: "advance",
        headline: [
          narrationScanToken(`${event.id}-headline-index`),
          narrationText(
            `${event.id}-headline-text`,
            ` advances to nums[${currentIndex}] = ${currentValue}.`
          ),
        ],
        reason:
          "Top-k by heap works as a single left-to-right scan, so each input value gets exactly one chance to challenge the current threshold.",
        implication:
          "The next frame decides whether the heap still has room or whether this candidate must beat the root.",
        evidence: [
          {
            id: `${event.id}-candidate`,
            label: "Candidate",
            value: `${currentValue}`,
            tokenId: scanIndexToken.id,
            tokenStyle: scanIndexToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "L3":
      return defineStructuredNarration({
        family: "check",
        headline: event.payload.hasRoom
          ? [
              narrationScanToken(`${event.id}-headline-index`),
              narrationText(
                `${event.id}-headline-text`,
                ` sees room: heap size ${heapSize} is still below k = ${snapshot.k}.`
              ),
            ]
          : [
              narrationScanToken(`${event.id}-headline-index`),
              narrationText(
                `${event.id}-headline-text`,
                ` must beat root threshold ${thresholdValue} because the heap is already full.`
              ),
            ],
        reason: event.payload.hasRoom
          ? "Until the min-heap reaches k items, every scanned value automatically belongs to the current top-k set because no root threshold exists yet."
          : "Once the heap is full, the root is the weakest kept value, so only stronger candidates are allowed to enter.",
        implication: event.payload.hasRoom
          ? "The next frame pushes this value into the heap as a guaranteed candidate."
          : "The next frame compares the scanned value against the root and either skips it or replaces the threshold.",
        evidence: [
          {
            id: `${event.id}-size`,
            label: "Heap size",
            value: `${heapSize}`,
          },
          {
            id: `${event.id}-threshold`,
            label: "Threshold",
            value: `${thresholdValue}`,
          },
        ],
        sourceValues: event.payload,
      })
    case "L4":
      return defineStructuredNarration({
        family: "commit",
        headline: [
          narrationScanToken(`${event.id}-headline-index`),
          narrationText(
            `${event.id}-headline-text`,
            ` pushes ${event.payload.pushedValue} into the heap as a new top-k candidate.`
          ),
        ],
        reason:
          "Values scanned before the heap is full are provisionally part of the answer because there are not yet k stronger competitors to displace them.",
        implication:
          "The next frame checks whether the new leaf must bubble upward to restore min-heap order.",
        evidence: [
          {
            id: `${event.id}-push`,
            label: "Heap after push",
            value: `[${snapshot.heap.join(", ")}]`,
            tokenId: scanIndexToken.id,
            tokenStyle: scanIndexToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "L5":
      return defineStructuredNarration({
        family: event.type === "compare" ? "compare" : "commit",
        headline:
          event.type === "compare"
            ? event.payload.shouldSwap
              ? `Child ${event.payload.childValue} is smaller than parent ${event.payload.parentValue}.`
              : `Child ${event.payload.childValue} is not smaller than parent ${event.payload.parentValue}.`
            : `Swap heap slots ${event.payload.parentIndex} and ${event.payload.childIndex} during sift-up.`,
        reason:
          event.type === "compare"
            ? event.payload.shouldSwap
              ? "A min-heap keeps the smallest kept value at the root, so any smaller child must rise above a larger parent."
              : "If the child is already greater than or equal to the parent, the local min-heap ordering is satisfied."
            : "The swap moves the smaller value closer to the root so the heap can continue exposing the weakest kept candidate as the threshold.",
        implication:
          event.type === "compare"
            ? event.payload.shouldSwap
              ? "The next frame performs the swap that bubbles the new candidate toward its correct threshold position."
              : "The push is fully integrated, so the scan can advance to the next input value."
            : "The next frame either checks the next parent link or resumes scanning if the new candidate is settled.",
        evidence: [
          {
            id: `${event.id}-heap`,
            label: "Heap",
            value: `[${snapshot.heap.join(", ")}]`,
          },
        ],
        sourceValues: event.payload,
      })
    case "L6":
      return defineStructuredNarration({
        family: "compare",
        headline: event.payload.shouldReplace
          ? [
              narrationScanToken(`${event.id}-headline-index`),
              narrationText(
                `${event.id}-headline-text`,
                ` brings ${event.payload.currentValue}, which beats threshold ${event.payload.rootValue}.`
              ),
            ]
          : [
              narrationScanToken(`${event.id}-headline-index`),
              narrationText(
                `${event.id}-headline-text`,
                ` brings ${event.payload.currentValue}, which does not beat threshold ${event.payload.rootValue}.`
              ),
            ],
        reason: event.payload.shouldReplace
          ? "Only values larger than the heap root can improve the current top-k set once the heap is full."
          : "A value that is not larger than the root cannot belong in the top-k set because the heap already holds k values at least as strong.",
        implication: event.payload.shouldReplace
          ? "The next frame replaces the root so the heap can re-establish the new weakest kept value."
          : "The heap stays unchanged and the scan moves on to the next candidate.",
        evidence: [
          {
            id: `${event.id}-threshold`,
            label: "Threshold comparison",
            value: `${event.payload.currentValue} vs ${event.payload.rootValue}`,
            tokenId: scanIndexToken.id,
            tokenStyle: scanIndexToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "L7":
      return defineStructuredNarration({
        family: "commit",
        headline: [
          narrationScanToken(`${event.id}-headline-index`),
          narrationText(
            `${event.id}-headline-text`,
            ` replaces root ${event.payload.replacedValue} with ${event.payload.nextValue}.`
          ),
        ],
        reason:
          "The old root was the weakest kept value, so replacing it is the only mutation needed to admit a stronger candidate into the top-k set.",
        implication:
          "The next frames sift the replacement downward until the min-heap threshold property is restored.",
        evidence: [
          {
            id: `${event.id}-heap`,
            label: "Heap after replace",
            value: `[${snapshot.heap.join(", ")}]`,
            tokenId: scanIndexToken.id,
            tokenStyle: scanIndexToken.style,
          },
        ],
        sourceValues: event.payload,
      })
    case "L8":
      return defineStructuredNarration({
        family: event.type === "compare" ? "compare" : "commit",
        headline:
          event.type === "compare"
            ? event.payload.shouldSwap
              ? `Parent ${event.payload.parentValue} is larger than smaller child ${event.payload.chosenChildValue}.`
              : `Parent ${event.payload.parentValue} is already below smaller child ${event.payload.chosenChildValue}.`
            : `Swap parent slot ${event.payload.parentIndex} with child slot ${event.payload.childIndex} during sift-down.`,
        reason:
          event.type === "compare"
            ? event.payload.shouldSwap
              ? "After replacing the root, the new candidate may be too large to remain above smaller children in a min-heap."
              : "When the parent is already below the smaller child, the threshold order is restored and no further repair is needed."
            : "This swap pushes the oversized replacement away from the root so the smallest kept value can surface again as the threshold.",
        implication:
          event.type === "compare"
            ? event.payload.shouldSwap
              ? "The next frame performs the downward swap that repairs the threshold ordering."
              : "The heap is stable again, so the scan can continue with the next input value."
            : "The next frame either checks the next child relation or resumes the scan if the heap is settled.",
        evidence: [
          {
            id: `${event.id}-heap`,
            label: "Heap",
            value: `[${snapshot.heap.join(", ")}]`,
          },
        ],
        sourceValues: event.payload,
      })
    case "L11":
      return defineStructuredNarration({
        family: "return",
        headline: `Return the top-k values [${(snapshot.result ?? []).join(", ")}] in descending order.`,
        reason:
          "The heap preserved exactly k strongest candidates throughout the scan, and sorting them descending produces the final answer form expected by the caller.",
        implication:
          "The lesson ends here with the final thresholded candidate set already resolved.",
        evidence: [
          {
            id: `${event.id}-result`,
            label: "Top-k result",
            value: `[${(snapshot.result ?? []).join(", ")}]`,
          },
        ],
        sourceValues: event.payload,
      })
    default:
      return defineStructuredNarration({
        family: "advance",
        headline: "Advance the heap-backed top-k state.",
        reason:
          "The heap, input scan, and state panel stay synchronized one learner-visible threshold decision at a time.",
        implication:
          "The next frame will expose the next comparison or mutation in the top-k process.",
        sourceValues: event.payload,
      })
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
        {
          label: "i",
          value: snapshot.currentIndex ?? "-",
          tokenId:
            snapshot.currentIndex !== undefined ? scanIndexToken.id : undefined,
          tokenStyle:
            snapshot.currentIndex !== undefined
              ? scanIndexToken.style
              : undefined,
        },
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
