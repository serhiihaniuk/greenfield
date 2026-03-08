import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  VerificationIssue,
  VerificationReport,
} from "@/domains/verification/types"
import type { PrimitiveFrameState } from "@/entities/visualization/types"

export interface FrameDiffSummary {
  primitiveAdditions: number
  primitiveRemovals: number
  dataChanges: number
  pointerChanges: number
  highlightChanges: number
  annotationChanges: number
  viewportChanges: number
}

export interface PrimitiveChangeDetail {
  primitiveId: string
  primitiveKind: PrimitiveFrameState["kind"]
  changeKinds: string[]
}

export interface FrameDiffDetails {
  changedGroupCount: number
  primitiveChanges: PrimitiveChangeDetail[]
  summary: FrameDiffSummary
}

export interface NarrationBindingSummary {
  eventPayloadKeys: string[]
  extraNarrationKeys: string[]
  missingNarrationKeys: string[]
  sourceValueKeys: string[]
  synchronizedToEvent?: boolean
}

export interface RelatedIssueSummary {
  blocking: VerificationIssue[]
  warnings: VerificationIssue[]
  hiddenBlockingCount: number
  hiddenWarningCount: number
}

export interface AuthorTimelineEntry {
  frameId: string
  eventId: string
  codeLine: string
  eventType: TraceEvent["type"]
  blockingIssueCount: number
  warningIssueCount: number
  isActive: boolean
}

const EMPTY_SUMMARY: FrameDiffSummary = {
  primitiveAdditions: 0,
  primitiveRemovals: 0,
  dataChanges: 0,
  pointerChanges: 0,
  highlightChanges: 0,
  annotationChanges: 0,
  viewportChanges: 0,
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalizeValue(nested)])
    )
  }

  return value
}

function stableSerialize(value: unknown) {
  return JSON.stringify(normalizeValue(value))
}

function pushPrimitiveChange(
  changes: Map<string, PrimitiveChangeDetail>,
  primitive: PrimitiveFrameState,
  changeKind: string
) {
  const existing = changes.get(primitive.id)

  if (existing) {
    if (!existing.changeKinds.includes(changeKind)) {
      existing.changeKinds.push(changeKind)
    }
    return
  }

  changes.set(primitive.id, {
    primitiveId: primitive.id,
    primitiveKind: primitive.kind,
    changeKinds: [changeKind],
  })
}

export function summarizeFrameDiff(
  previousFrame?: Frame,
  currentFrame?: Frame
): FrameDiffDetails | undefined {
  if (!previousFrame || !currentFrame) {
    return undefined
  }

  const summary: FrameDiffSummary = { ...EMPTY_SUMMARY }
  const primitiveChanges = new Map<string, PrimitiveChangeDetail>()
  const previousPrimitives = new Map(
    previousFrame.primitives.map((primitive) => [primitive.id, primitive])
  )
  const currentPrimitives = new Map(
    currentFrame.primitives.map((primitive) => [primitive.id, primitive])
  )

  for (const [primitiveId, primitive] of currentPrimitives) {
    if (!previousPrimitives.has(primitiveId)) {
      summary.primitiveAdditions += 1
      pushPrimitiveChange(primitiveChanges, primitive, "added")
    }
  }

  for (const [primitiveId, primitive] of previousPrimitives) {
    if (!currentPrimitives.has(primitiveId)) {
      summary.primitiveRemovals += 1
      pushPrimitiveChange(primitiveChanges, primitive, "removed")
    }
  }

  for (const [primitiveId, currentPrimitive] of currentPrimitives) {
    const previousPrimitive = previousPrimitives.get(primitiveId)
    if (!previousPrimitive) {
      continue
    }

    if (stableSerialize(previousPrimitive.data) !== stableSerialize(currentPrimitive.data)) {
      summary.dataChanges += 1
      pushPrimitiveChange(primitiveChanges, currentPrimitive, "data")
    }

    if (
      stableSerialize(previousPrimitive.pointers ?? []) !==
      stableSerialize(currentPrimitive.pointers ?? [])
    ) {
      summary.pointerChanges += 1
      pushPrimitiveChange(primitiveChanges, currentPrimitive, "pointers")
    }

    if (
      stableSerialize(previousPrimitive.highlights ?? []) !==
      stableSerialize(currentPrimitive.highlights ?? [])
    ) {
      summary.highlightChanges += 1
      pushPrimitiveChange(primitiveChanges, currentPrimitive, "highlights")
    }

    if (
      stableSerialize(previousPrimitive.annotations ?? []) !==
      stableSerialize(currentPrimitive.annotations ?? [])
    ) {
      summary.annotationChanges += 1
      pushPrimitiveChange(primitiveChanges, currentPrimitive, "annotations")
    }

    if (
      stableSerialize(previousPrimitive.viewport ?? {}) !==
        stableSerialize(currentPrimitive.viewport ?? {}) ||
      stableSerialize(previousPrimitive.layout ?? {}) !==
        stableSerialize(currentPrimitive.layout ?? {})
    ) {
      summary.viewportChanges += 1
      pushPrimitiveChange(primitiveChanges, currentPrimitive, "viewport")
    }
  }

  const changedGroupCount = [
    summary.primitiveAdditions + summary.primitiveRemovals,
    summary.dataChanges,
    summary.pointerChanges,
    summary.highlightChanges,
    summary.annotationChanges,
    summary.viewportChanges,
  ].filter((count) => count > 0).length

  return {
    changedGroupCount,
    primitiveChanges: [...primitiveChanges.values()].sort((left, right) =>
      left.primitiveId.localeCompare(right.primitiveId)
    ),
    summary,
  }
}

export function collectRelatedIssues(
  verification?: VerificationReport,
  frame?: Frame,
  event?: TraceEvent,
  limit = 6
): RelatedIssueSummary {
  const issues = [...(verification?.errors ?? []), ...(verification?.warnings ?? [])]
  const related = issues.filter((issue) => {
    const isGlobal = !issue.frameId && !issue.eventId
    return isGlobal || issue.frameId === frame?.id || issue.eventId === event?.id
  })

  const blocking = related.filter((issue) => issue.severity === "error")
  const warnings = related.filter((issue) => issue.severity === "warning")

  return {
    blocking: blocking.slice(0, limit),
    warnings: warnings.slice(0, limit),
    hiddenBlockingCount: Math.max(blocking.length - limit, 0),
    hiddenWarningCount: Math.max(warnings.length - limit, 0),
  }
}

export function summarizeNarrationBindings(
  frame?: Frame,
  event?: TraceEvent
): NarrationBindingSummary {
  const sourceValues = frame?.narration.sourceValues ?? {}
  const sourceValueKeys = Object.keys(sourceValues).sort()
  const eventPayloadKeys = Object.keys(event?.payload ?? {}).sort()

  return {
    eventPayloadKeys,
    extraNarrationKeys: sourceValueKeys.filter(
      (key) => !eventPayloadKeys.includes(key)
    ),
    missingNarrationKeys: eventPayloadKeys.filter(
      (key) => !sourceValueKeys.includes(key)
    ),
    sourceValueKeys,
    synchronizedToEvent:
      frame && event
        ? stableSerialize(sourceValues) === stableSerialize(event.payload)
        : undefined,
  }
}

export function formatAuthorValue(value: unknown) {
  return JSON.stringify(normalizeValue(value), null, 2)
}

export function buildAuthorTimeline(
  trace: TraceEvent[],
  frames: Frame[],
  verification?: VerificationReport,
  activeFrameId?: string
): AuthorTimelineEntry[] {
  const eventById = new Map(trace.map((event) => [event.id, event]))
  const issues = [...(verification?.errors ?? []), ...(verification?.warnings ?? [])]

  return frames.map((frame) => {
    const event = eventById.get(frame.sourceEventId)
    const relatedIssues = issues.filter(
      (issue) => issue.frameId === frame.id || issue.eventId === frame.sourceEventId
    )

    return {
      frameId: frame.id,
      eventId: frame.sourceEventId,
      codeLine: frame.codeLine,
      eventType: event?.type ?? "custom",
      blockingIssueCount: relatedIssues.filter((issue) => issue.severity === "error").length,
      warningIssueCount: relatedIssues.filter((issue) => issue.severity === "warning").length,
      isActive: frame.id === activeFrameId,
    }
  })
}
