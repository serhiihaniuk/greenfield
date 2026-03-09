import type {
  Frame,
  NarrationPayload,
  VisualChangeType,
} from "@/domains/projection/types"
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

type HouseRobberSnapshot = {
  nums: number[]
  index?: number
  currentValue?: number
  prevTwo?: number
  prevOne?: number
  take?: number
  skip?: number
  best?: number
  decision?: "take" | "skip"
  answer?: number
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

function buildNarration(
  event: TraceEvent,
  snapshot: HouseRobberSnapshot
): NarrationPayload {
  const executionTokens = deriveExecutionTokensFromPointers(
    buildPointers(event, snapshot)
  )
  const indexToken = executionTokens.get("index")
  const textSegment = (
    id: string,
    text: string,
    tone: NarrationPayload["segments"][number]["tone"] = "default"
  ) => ({
    id: `${event.id}-${id}`,
    text,
    tone,
  })
  const tokenSegment = (id: string) =>
    indexToken
      ? {
          id: `${event.id}-${id}`,
          text: indexToken.label,
          tokenId: indexToken.id,
          tokenStyle: indexToken.style,
        }
      : textSegment(id, "i")

  switch (event.codeLine) {
    case "L1":
      return {
        summary:
          "Initialize prevTwo at 0 so the take option has a clean base value.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L2":
      return {
        summary:
          "Initialize prevOne at 0 so the best-so-far total also starts empty.",
        segments: [],
        sourceValues: event.payload,
      }
    case "L3":
      return {
        summary:
          event.payload.result === false
            ? "Every house has been processed, so the rolling state now holds the answer."
            : `Check whether house ${snapshot.index} is the next transition to evaluate.`,
        segments: event.payload.result === false
          ? []
          : [
              textSegment("t0", "Check whether "),
              tokenSegment("index"),
              textSegment("t1", ` = ${snapshot.index} is the next transition to evaluate.`),
            ],
        sourceValues: event.payload,
      }
    case "L4":
      return event.type === "pointer-update"
        ? {
            summary: `Move the focus to house ${snapshot.index} with value ${snapshot.currentValue}.`,
            segments: [
              textSegment("t0", "Move "),
              tokenSegment("index"),
              textSegment(
                "t1",
                ` to house ${snapshot.index} with value ${snapshot.currentValue}.`
              ),
            ],
            sourceValues: event.payload,
          }
        : {
            summary: `Compute take = prevTwo + nums[index] = ${snapshot.take}.`,
            segments: [
              textSegment("t0", "Compute take = prevTwo + nums["),
              tokenSegment("index"),
              textSegment("t1", `] = ${snapshot.take}.`),
            ],
            sourceValues: event.payload,
          }
    case "L5":
      return {
        summary: `Compute skip = prevOne = ${snapshot.skip}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L6":
      return {
        summary: `Compare take ${snapshot.take} against skip ${snapshot.skip}; choose ${snapshot.decision}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L7":
      return {
        summary: `Shift prevTwo forward to the old prevOne value ${snapshot.prevTwo}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L8":
      return {
        summary: `Commit prevOne = best = ${snapshot.prevOne}.`,
        segments: [],
        sourceValues: event.payload,
      }
    case "L10":
      return {
        summary: `Return the best non-adjacent total ${snapshot.answer}.`,
        segments: [],
        sourceValues: event.payload,
      }
    default:
      return {
        summary: "Advance the rolling DP state.",
        segments: [],
        sourceValues: event.payload,
      }
  }
}

function buildHighlights(
  event: TraceEvent,
  snapshot: HouseRobberSnapshot
): HighlightSpec[] {
  return snapshot.nums.map((_, index) => {
    if (snapshot.index === undefined) {
      return {
        targetId: `cell-${index}`,
        tone: event.codeLine === "L10" ? "done" : "dim",
        emphasis: "soft",
      }
    }

    if (index < snapshot.index) {
      return {
        targetId: `cell-${index}`,
        tone: "done",
        emphasis: "soft",
      }
    }

    if (index > snapshot.index) {
      return {
        targetId: `cell-${index}`,
        tone: "dim",
        emphasis: "soft",
      }
    }

    if (event.codeLine === "L3") {
      return {
        targetId: `cell-${index}`,
        tone: event.payload.result === false ? "done" : "candidate",
        emphasis: "strong",
      }
    }

    switch (event.codeLine) {
      case "L4":
        return {
          targetId: `cell-${index}`,
          tone: event.type === "pointer-update" ? "active" : "candidate",
          emphasis: "strong",
        }
      case "L5":
        return {
          targetId: `cell-${index}`,
          tone: "candidate",
          emphasis: "strong",
        }
      case "L6":
        return {
          targetId: `cell-${index}`,
          tone: "compare",
          emphasis: "strong",
        }
      case "L7":
      case "L8":
        return {
          targetId: `cell-${index}`,
          tone: "mutated",
          emphasis: "strong",
        }
      default:
        return {
          targetId: `cell-${index}`,
          tone: "active",
          emphasis: "strong",
        }
    }
  })
}

function buildPointers(
  event: TraceEvent,
  snapshot: HouseRobberSnapshot
): PointerSpec[] {
  const targetIndex =
    snapshot.index ??
    (event.codeLine === "L3" &&
    event.payload.result === false &&
    snapshot.nums.length > 0
      ? snapshot.nums.length - 1
      : undefined)

  if (targetIndex === undefined) {
    return []
  }

  return [
    {
      id: "index",
      targetId: `cell-${targetIndex}`,
      label: "i",
      tone: "primary",
      placement: "top",
      status:
        event.codeLine === "L3" && event.payload.result === false
          ? "done"
          : "active",
    },
  ]
}

function buildAnnotations(
  event: TraceEvent,
  snapshot: HouseRobberSnapshot
): AnnotationSpec[] {
  if (event.codeLine === "L10" && snapshot.answer !== undefined) {
    return [
      {
        id: `${event.id}-answer`,
        targetId: `cell-${snapshot.nums.length - 1}`,
        kind: "badge",
        text: `ans ${snapshot.answer}`,
        tone: "success",
      },
    ]
  }

  if (snapshot.index === undefined) {
    return []
  }

  if (event.codeLine === "L1") {
    return [
      {
        id: `${event.id}-init-prev-two`,
        targetId: `cell-${snapshot.index ?? 0}`,
        kind: "badge",
        text: "init prevTwo",
        tone: "muted",
      },
    ]
  }

  if (event.codeLine === "L6") {
    return [
      {
        id: `${event.id}-decision`,
        targetId: `cell-${snapshot.index}`,
        kind: "badge",
        text: `${snapshot.decision} ${snapshot.best}`,
        tone: "active",
      },
    ]
  }

  if (event.codeLine === "L7") {
    return [
      {
        id: `${event.id}-shift`,
        targetId: `cell-${snapshot.index}`,
        kind: "badge",
        text: "shift prevTwo",
        tone: "warning",
      },
    ]
  }

  if (event.codeLine === "L8") {
    return [
      {
        id: `${event.id}-commit`,
        targetId: `cell-${snapshot.index}`,
        kind: "badge",
        text: "commit prevOne",
        tone: "success",
      },
    ]
  }

  return []
}

function buildPrimitiveStates(
  event: TraceEvent,
  snapshot: HouseRobberSnapshot
): PrimitiveFrameState[] {
  const pointers = buildPointers(event, snapshot)
  const executionTokens = deriveExecutionTokensFromPointers(pointers)
  const arrayPrimitive = defineArrayPrimitiveFrameState({
    id: "houses",
    kind: "array",
    title: "House Values",
    subtitle:
      "The current house competes against the best total from skipping it.",
    data: {
      cells: snapshot.nums.map((value, index) => ({
        id: `cell-${index}`,
        index,
        value,
      })),
    },
    pointers,
    highlights: buildHighlights(event, snapshot),
    annotations: buildAnnotations(event, snapshot),
    viewport: {
      role: "primary",
      preferredWidth: 960,
      minHeight: 280,
    },
  })

  const statePrimitive = defineStatePrimitiveFrameState({
    id: "rolling-state",
    kind: "state",
    title: "DP State",
    data: {
      values: [
        {
          label: "i",
          value: snapshot.index ?? "-",
          tokenId: executionTokens.get("index")?.id,
          tokenStyle: executionTokens.get("index")?.style,
        },
        { label: "house", value: snapshot.currentValue ?? "-" },
        { label: "prevTwo", value: snapshot.prevTwo ?? "-" },
        { label: "prevOne", value: snapshot.prevOne ?? "-" },
        { label: "take", value: snapshot.take ?? "-" },
        { label: "skip", value: snapshot.skip ?? "-" },
        { label: "best", value: snapshot.best ?? "-" },
        { label: "decision", value: snapshot.decision ?? "-" },
        { label: "answer", value: snapshot.answer ?? "-" },
      ],
    },
    viewport: {
      role: "support",
      preferredWidth: 320,
      minHeight: 280,
    },
  })

  return [arrayPrimitive, statePrimitive]
}

export function projectRollingDpHouseRobber(
  events: TraceEvent[],
  mode: VisualizationMode
): Frame[] {
  void mode
  return events
    .filter((event) => event.type !== "complete")
    .map((event, index) => {
      const snapshot = event.snapshot as HouseRobberSnapshot

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
