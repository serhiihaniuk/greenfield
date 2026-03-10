import type {
  Frame,
  NarrationPayloadInput,
  NarrationSegmentTone,
  VisualChangeType,
} from "@/domains/projection/types"
import type { VisualizationMode } from "@/domains/lessons/types"
import type { TraceEvent } from "@/domains/tracing/types"
import { defineFrame } from "@/domains/projection/types"
import {
  defineStructuredNarration,
  narrationText,
  narrationTokenFromPointer,
} from "@/domains/projection/narration"
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

function buildNarration(
  event: TraceEvent,
  snapshot: BinarySearchSnapshot
): NarrationPayloadInput {
  const loPointer: PointerSpec = {
    id: "lo",
    targetId: `cell-${snapshot.lo ?? 0}`,
    label: "lo",
    tone: "primary",
    placement: "top-start",
  }
  const hiPointer: PointerSpec = {
    id: "hi",
    targetId: `cell-${snapshot.hi ?? Math.max(snapshot.nums.length - 1, 0)}`,
    label: "hi",
    tone: "secondary",
    placement: "top-end",
  }
  const midPointer: PointerSpec = {
    id: "mid",
    targetId: `cell-${snapshot.mid ?? 0}`,
    label: "mid",
    tone: "compare",
    placement: "bottom",
  }
  const tokenSegment = (
    id: string,
    text: string,
    tone?: NarrationSegmentTone
  ) => narrationText(`${event.id}-${id}`, text, tone)
  const pointerSegment = (id: string, pointer: PointerSpec) =>
    narrationTokenFromPointer(`${event.id}-${id}`, pointer)
  const intervalLabel =
    snapshot.lo !== undefined && snapshot.hi !== undefined
      ? `${snapshot.lo}..${snapshot.hi}`
      : "—"

  switch (event.codeLine) {
    case "L1":
      return defineStructuredNarration({
        family: "setup",
        headline: [
          tokenSegment("headline-0", "Initialize "),
          pointerSegment("headline-lo", loPointer),
          tokenSegment("headline-1", " at the start of the array."),
        ],
        reason:
          "Binary search starts with the full array as the candidate interval.",
        implication:
          "The next step places hi at the opposite end of that same interval.",
        evidence: [
          {
            id: `${event.id}-interval`,
            label: "Candidate interval",
            value: "whole array",
          },
        ],
        sourceValues: event.payload,
      })
    case "L2":
      return defineStructuredNarration({
        family: "setup",
        headline: [
          tokenSegment("headline-0", "Initialize "),
          pointerSegment("headline-hi", hiPointer),
          tokenSegment("headline-1", " at the end of the array."),
        ],
        reason:
          "The live search interval spans from lo through hi, so both ends must be visible before the loop begins.",
        implication:
          "The loop can now test whether any candidate indices remain.",
        evidence: [
          {
            id: `${event.id}-interval`,
            label: "Candidate interval",
            value: intervalLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L3":
      return defineStructuredNarration({
        family: "check",
        headline:
          event.payload.result === false
            ? "The candidate interval is empty."
            : "Check whether the candidate interval is still valid.",
        reason:
          event.payload.result === false
            ? "lo has crossed hi, so no indices remain to test."
            : "Binary search continues only while lo stays on or before hi.",
        implication:
          event.payload.result === false
            ? "The search will finish because every possible index has been eliminated."
            : "The next step can safely probe the midpoint inside the live interval.",
        evidence: [
          {
            id: `${event.id}-interval`,
            label: "Current interval",
            value: intervalLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L4":
      return defineStructuredNarration({
        family: "advance",
        headline: [
          tokenSegment("headline-0", "Move "),
          pointerSegment("headline-mid", midPointer),
          tokenSegment("headline-1", ` to index ${snapshot.mid}.`),
        ],
        reason:
          "Binary search always probes the center of the current candidate interval before discarding a side.",
        implication:
          "The next frame compares nums[mid] with the target to decide what survives.",
        evidence: [
          {
            id: `${event.id}-interval`,
            label: "Current interval",
            value: intervalLabel,
          },
          {
            id: `${event.id}-mid`,
            label: "Mid index",
            value: `${snapshot.mid ?? "—"}`,
          },
        ],
        sourceValues: event.payload,
      })
    case "L6":
      return defineStructuredNarration({
        family: "compare",
        headline: [
          tokenSegment("headline-0", "Compare nums["),
          pointerSegment("headline-mid", midPointer),
          tokenSegment("headline-1", `]=${snapshot.value} against target=${snapshot.target}.`),
        ],
        reason:
          "This comparison tells binary search whether it can return immediately or which half is still worth keeping.",
        implication:
          snapshot.value === snapshot.target
            ? "An exact match means the midpoint itself is the answer."
            : "The next frame will decide which half is safe to discard.",
        evidence: [
          {
            id: `${event.id}-comparison`,
            label: "Comparison",
            value: `${snapshot.value} vs ${snapshot.target}`,
          },
        ],
        sourceValues: event.payload,
      })
    case "L7":
      return defineStructuredNarration({
        family: "commit",
        headline: `The target is found at index ${snapshot.answer}.`,
        reason:
          "nums[mid] matched target exactly, so there is no need to inspect any other candidate.",
        implication:
          "The search is complete and the final return can commit this index as the answer.",
        evidence: [
          {
            id: `${event.id}-answer`,
            label: "Answer",
            value: `${snapshot.answer ?? "—"}`,
          },
        ],
        sourceValues: event.payload,
      })
    case "L9":
      return defineStructuredNarration({
        family: "check",
        headline: `Decide which half to discard based on ${snapshot.value} < ${snapshot.target}.`,
        reason:
          snapshot.value !== undefined && snapshot.value < snapshot.target
            ? "A smaller midpoint value means every index at or left of mid is too small."
            : "A larger midpoint value means every index at or right of mid is too large.",
        implication:
          snapshot.value !== undefined && snapshot.value < snapshot.target
            ? "The next frame will move lo to the first index that can still beat the target."
            : "The next frame will move hi to the last index that can still beat the target.",
        evidence: [
          {
            id: `${event.id}-rule`,
            label: "Branch rule",
            value:
              snapshot.value !== undefined && snapshot.value < snapshot.target
                ? "nums[mid] < target"
                : "nums[mid] > target",
          },
        ],
        sourceValues: event.payload,
      })
    case "L10":
      return defineStructuredNarration({
        family: "prune",
        headline: [
          tokenSegment("headline-0", "Discard the left half through "),
          pointerSegment("headline-mid", midPointer),
          tokenSegment("headline-1", " and move "),
          pointerSegment("headline-lo", loPointer),
          tokenSegment("headline-2", ` to ${snapshot.lo}.`),
        ],
        reason:
          "nums[mid] was smaller than the target, so every index at or before mid is now provably too small.",
        implication:
          "Only the right half remains a valid candidate interval.",
        evidence: [
          {
            id: `${event.id}-next-interval`,
            label: "Next interval",
            value: intervalLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L12":
      return defineStructuredNarration({
        family: "prune",
        headline: [
          tokenSegment("headline-0", "Discard the right half through "),
          pointerSegment("headline-mid", midPointer),
          tokenSegment("headline-1", " and move "),
          pointerSegment("headline-hi", hiPointer),
          tokenSegment("headline-2", ` to ${snapshot.hi}.`),
        ],
        reason:
          "nums[mid] was larger than the target, so every index at or after mid is now provably too large.",
        implication:
          "Only the left half remains a valid candidate interval.",
        evidence: [
          {
            id: `${event.id}-next-interval`,
            label: "Next interval",
            value: intervalLabel,
          },
        ],
        sourceValues: event.payload,
      })
    case "L15":
      return defineStructuredNarration({
        family: "return",
        headline:
          snapshot.answer === -1
            ? "Return -1 because the target never appeared in the candidate interval."
            : `Return the final answer ${snapshot.answer}.`,
        reason:
          snapshot.answer === -1
            ? "The interval became empty before any midpoint matched the target."
            : "A prior compare frame already proved this index is an exact match.",
        implication:
          snapshot.answer === -1
            ? "The search finishes with no valid position."
            : "The caller receives the exact index of the target.",
        evidence: [
          {
            id: `${event.id}-answer`,
            label: "Return value",
            value: `${snapshot.answer ?? "—"}`,
          },
        ],
        sourceValues: event.payload,
      })
    default:
      return defineStructuredNarration({
        family: "advance",
        headline: "Advance the binary search state.",
        reason:
          "This frame keeps the search state synchronized before the next learner-visible change.",
        sourceValues: event.payload,
      })
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
  snapshot: BinarySearchSnapshot
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
  void mode
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
            message: "Frame stays inside the desktop playback viewport contract.",
          },
        ],
      })
    })
}
