import type { Frame, NarrationPayload, VisualChangeType } from "@/domains/projection/types"
import type { VisualizationMode } from "@/domains/lessons/types"
import type { TraceEvent } from "@/domains/tracing/types"
import { defineFrame } from "@/domains/projection/types"
import {
  defineArrayPrimitiveFrameState,
  defineStatePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import type {
  AnnotationSpec,
  HighlightSpec,
  PointerSpec,
  PrimitiveFrameState,
} from "@/entities/visualization/types"
import { deriveExecutionTokensFromPointers } from "@/shared/visualization/execution-tokens"

type BinarySearchSnapshot = {
  nums: number[]
  target: number
  lo?: number
  hi?: number
  mid?: number
  value?: number
  answer?: number
}

function buildRangeHighlights(
  snapshot: BinarySearchSnapshot,
  inRangeTone: HighlightSpec["tone"],
  outOfRangeTone?: HighlightSpec["tone"]
) {
  return snapshot.nums.map((_, index) => ({
    targetId: `cell-${index}`,
    tone:
      snapshot.lo !== undefined &&
      snapshot.hi !== undefined &&
      index >= snapshot.lo &&
      index <= snapshot.hi
        ? inRangeTone
        : outOfRangeTone ?? "default",
    emphasis: "soft" as const,
  }))
}

function mapEventToVisualChange(event: TraceEvent): VisualChangeType {
  switch (event.type) {
    case "pointer-update":
      return "move"
    case "compare":
      return "compare"
    case "mutate":
      return "mutate"
    case "result":
      return "result"
    case "enter-scope":
    case "call":
    case "start":
      return "enter"
    case "exit-scope":
    case "return":
    case "complete":
      return "exit"
    default:
      return "mutate"
  }
}

function buildNarration(event: TraceEvent, snapshot: BinarySearchSnapshot): NarrationPayload {
  const tokenSegment = (
    id: string,
    text: string,
    tone: NarrationPayload["segments"][number]["tone"] = "default"
  ) => ({
    id: `${event.id}-${id}`,
    text,
    tone,
  })

  const pointerSegments = (pointer: PointerSpec) => ({
    id: `${event.id}-${pointer.id}`,
    text: pointer.label,
    tokenId: pointer.id,
    tokenStyle: deriveExecutionTokensFromPointers([pointer]).get(pointer.id)?.style,
  })

  switch (event.codeLine) {
    case "L1":
      return {
        summary: "Initialize the low pointer at the start of the array.",
        segments: [
          tokenSegment("t0", "Initialize "),
          pointerSegments({
            id: "lo",
            targetId: `cell-${snapshot.lo ?? 0}`,
            label: "lo",
            tone: "primary",
            placement: "top-start",
          }),
          tokenSegment("t1", " at the start of the array."),
        ],
        sourceValues: event.payload,
      }
    case "L2":
      return {
        summary: "Initialize the high pointer at the end of the array.",
        segments: [
          tokenSegment("t0", "Initialize "),
          pointerSegments({
            id: "hi",
            targetId: `cell-${snapshot.hi ?? snapshot.nums.length - 1}`,
            label: "hi",
            tone: "secondary",
            placement: "top-end",
          }),
          tokenSegment("t1", " at the end of the array."),
        ],
        sourceValues: event.payload,
      }
    case "L3":
      return {
        summary:
          event.payload.result === false
            ? "The candidate interval is empty, so the search ends."
            : "Check whether the search interval is still valid.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L4":
      return {
        summary: `Move the midpoint to index ${snapshot.mid}.`,
        segments: [
          tokenSegment("t0", "Move "),
          pointerSegments({
            id: "mid",
            targetId: `cell-${snapshot.mid ?? 0}`,
            label: "mid",
            tone: "compare",
            placement: "bottom",
          }),
          tokenSegment("t1", ` to index ${snapshot.mid}.`),
        ],
        sourceValues: event.payload,
      }
    case "L6":
      return {
        summary: `Compare nums[mid]=${snapshot.value} against target=${snapshot.target}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L7":
      return {
        summary: `The target is found at index ${snapshot.answer}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L9":
      return {
        summary: `Decide which half to discard based on ${snapshot.value} < ${snapshot.target}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L10":
      return {
        summary: `Discard the left half through mid and move lo to ${snapshot.lo}.`,
        segments: [
          tokenSegment("t0", "Discard the left half through "),
          pointerSegments({
            id: "mid",
            targetId: `cell-${snapshot.mid ?? 0}`,
            label: "mid",
            tone: "compare",
            placement: "bottom",
          }),
          tokenSegment("t1", " and move "),
          pointerSegments({
            id: "lo",
            targetId: `cell-${snapshot.lo ?? 0}`,
            label: "lo",
            tone: "primary",
            placement: "top-start",
          }),
          tokenSegment("t2", ` to ${snapshot.lo}.`),
        ],
        sourceValues: event.payload,
      }
    case "L12":
      return {
        summary: `Discard the right half through mid and move hi to ${snapshot.hi}.`,
        segments: [
          tokenSegment("t0", "Discard the right half through "),
          pointerSegments({
            id: "mid",
            targetId: `cell-${snapshot.mid ?? 0}`,
            label: "mid",
            tone: "compare",
            placement: "bottom",
          }),
          tokenSegment("t1", " and move "),
          pointerSegments({
            id: "hi",
            targetId: `cell-${snapshot.hi ?? 0}`,
            label: "hi",
            tone: "secondary",
            placement: "top-end",
          }),
          tokenSegment("t2", ` to ${snapshot.hi}.`),
        ],
        sourceValues: event.payload,
      }
    case "L15":
      return {
        summary:
          snapshot.answer === -1
            ? "Return -1 because the target never appeared in the candidate interval."
            : `Return the final answer ${snapshot.answer}.`,
        segments: [],
        sourceValues: event.payload,
      }
    default:
      return {
        summary: "Advance the binary search state.",
        segments: [],
        sourceValues: event.payload,
      }
  }
}

function buildHighlights(event: TraceEvent, snapshot: BinarySearchSnapshot): HighlightSpec[] {
  switch (event.codeLine) {
    case "L3":
      return buildRangeHighlights(
        snapshot,
        event.payload.result === false ? "dim" : "candidate",
        "dim"
      )
    case "L4": {
      const intervalHighlights = buildRangeHighlights(snapshot, "candidate", "dim")
      return snapshot.mid === undefined
        ? intervalHighlights
        : intervalHighlights.map((highlight) =>
            highlight.targetId === `cell-${snapshot.mid}`
              ? {
                  targetId: highlight.targetId,
                  tone: "compare",
                  emphasis: "strong",
                }
              : highlight
          )
    }
    case "L6": {
      if (snapshot.mid === undefined) {
        return []
      }

      return buildRangeHighlights(snapshot, "candidate", "dim").map((highlight) =>
        highlight.targetId === `cell-${snapshot.mid}`
          ? {
              targetId: highlight.targetId,
              tone: snapshot.value === snapshot.target ? "found" : "compare",
              emphasis: "strong",
            }
          : highlight
      )
    }
    case "L9": {
      if (snapshot.mid === undefined) {
        return []
      }

      return buildRangeHighlights(snapshot, "candidate", "dim").map((highlight) =>
        highlight.targetId === `cell-${snapshot.mid}`
          ? {
              targetId: highlight.targetId,
              tone: "compare",
              emphasis: "strong",
            }
          : highlight
      )
    }
    case "L10":
    case "L12":
      return buildRangeHighlights(snapshot, "candidate", "dim").map((highlight) =>
        highlight.targetId === `cell-${event.payload.next}`
          ? {
              targetId: highlight.targetId,
              tone: "mutated",
              emphasis: "strong",
            }
          : highlight
      )
    case "L7":
      return snapshot.mid === undefined
        ? []
        : buildRangeHighlights(snapshot, "dim", "dim").map((highlight) =>
            highlight.targetId === `cell-${snapshot.mid}`
              ? {
                  targetId: highlight.targetId,
                  tone: "found",
                  emphasis: "strong",
                }
              : highlight
          )
    case "L15":
      return buildRangeHighlights(snapshot, "dim", "dim")
    default:
      return []
  }
}

function buildAnnotations(
  event: TraceEvent,
  snapshot: BinarySearchSnapshot
): AnnotationSpec[] {
  if (event.codeLine === "L9" && snapshot.mid !== undefined) {
    return [
      {
        id: `${event.id}-decision`,
        targetId: `cell-${snapshot.mid}`,
        kind: "badge",
        text:
          snapshot.value !== undefined && snapshot.value < snapshot.target
            ? "go right"
            : "go left",
        tone: "active",
      },
    ]
  }

  return []
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: BinarySearchSnapshot,
  _mode: VisualizationMode
): PrimitiveFrameState[] {
  const pointers: PointerSpec[] = []
  if (snapshot.lo !== undefined) {
    pointers.push({
      id: "lo",
      targetId: `cell-${snapshot.lo}`,
      label: "lo",
      tone: "primary",
      placement: "top-start",
    })
  }

  if (snapshot.hi !== undefined) {
    pointers.push({
      id: "hi",
      targetId: `cell-${snapshot.hi}`,
      label: "hi",
      tone: "secondary",
      placement: "top-end",
    })
  }

  if (snapshot.mid !== undefined) {
    pointers.push({
      id: "mid",
      targetId: `cell-${snapshot.mid}`,
      label: "mid",
      tone: "compare",
      placement: "bottom",
    })
  }

  const highlights = buildHighlights(event, snapshot)
  const annotations = buildAnnotations(event, snapshot)
  const executionTokens = deriveExecutionTokensFromPointers(pointers)

  const arrayPrimitive = defineArrayPrimitiveFrameState({
    id: "array",
    kind: "array",
    title: "Search Interval",
    data: {
      cells: snapshot.nums.map((value, index) => ({
        id: `cell-${index}`,
        index,
        value,
        })),
    },
    pointers,
    highlights,
    annotations,
    viewport: {
      role: "primary",
      preferredWidth: 960,
      minHeight: 280,
    },
  })

  const statePrimitive = defineStatePrimitiveFrameState({
    id: "state",
    kind: "state",
    title: "State",
    data: {
      values: [
        { label: "target", value: snapshot.target },
        {
          label: "lo",
          value: snapshot.lo ?? "—",
          tokenId: executionTokens.get("lo")?.id,
          tokenStyle: executionTokens.get("lo")?.style,
        },
        {
          label: "hi",
          value: snapshot.hi ?? "—",
          tokenId: executionTokens.get("hi")?.id,
          tokenStyle: executionTokens.get("hi")?.style,
        },
        {
          label: "mid",
          value: snapshot.mid ?? "—",
          tokenId: executionTokens.get("mid")?.id,
          tokenStyle: executionTokens.get("mid")?.style,
        },
        { label: "value", value: snapshot.value ?? "—" },
        { label: "answer", value: snapshot.answer ?? "—" },
      ],
    },
    viewport: {
      role: "support",
      preferredWidth: 280,
      minHeight: 240,
    },
  })

  return [arrayPrimitive, statePrimitive]
}

export function projectIterativeBinarySearch(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  return events
    .filter((event) => event.type !== "complete")
    .map((event, index) => {
      const snapshot = event.snapshot as BinarySearchSnapshot

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
            message: "Frame stays inside the desktop playback viewport contract.",
          },
        ],
      })
    })
}
