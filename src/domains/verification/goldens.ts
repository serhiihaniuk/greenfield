import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type { PrimitiveFrameState } from "@/entities/visualization/types"

export interface RuntimeGoldenPrimitiveSummary {
  id: string
  kind: PrimitiveFrameState["kind"]
  title?: string
  viewportRole?: PrimitiveFrameState["viewport"] extends infer T
    ? T extends { role?: infer R }
      ? R
      : never
    : never
  data: unknown
  pointers: PrimitiveFrameState["pointers"]
  highlights: PrimitiveFrameState["highlights"]
  annotations: PrimitiveFrameState["annotations"]
}

export interface RuntimeGoldenFrameSummary {
  id: string
  sourceEventId: string
  codeLine: string
  visualChangeType: Frame["visualChangeType"]
  narrationSummary: string
  checks: Array<Frame["checks"][number]["kind"]>
  primitives: RuntimeGoldenPrimitiveSummary[]
}

export interface RuntimeGoldenTraceSummary {
  id: string
  type: TraceEvent["type"]
  codeLine: string
}

export interface RuntimeGoldenSnapshot {
  trace: RuntimeGoldenTraceSummary[]
  frames: RuntimeGoldenFrameSummary[]
}

export interface GoldenComparisonResult {
  matches: boolean
  differences: string[]
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

function summarizePrimitiveData(primitive: PrimitiveFrameState) {
  switch (primitive.kind) {
    case "array":
      return {
        cellValues: (primitive.data as { cells: Array<{ value: string | number }> }).cells.map(
          (cell) => cell.value
        ),
      }
    case "state":
      return {
        values: Object.fromEntries(
          (
            primitive.data as { values: Array<{ label: string; value: string | number }> }
          ).values.map((entry) => [entry.label, entry.value])
        ),
      }
    case "stack":
      return {
        frames: (
          primitive.data as {
            frames: Array<{ id: string; label: string; status: string }>
          }
        ).frames.map((frame) => ({
          id: frame.id,
          label: frame.label,
          status: frame.status,
        })),
      }
    case "hash-map":
      return {
        entries: (
          primitive.data as {
            entries: Array<{ key: string; value: string | number | null; status: string }>
          }
        ).entries.map((entry) => ({
          key: entry.key,
          value: entry.value,
          status: entry.status,
        })),
      }
    case "tree":
    case "call-tree":
      return primitive.data
    case "code-trace":
      return {
        activeLineId: (primitive.data as { activeLineId?: string }).activeLineId,
        lines: (
          primitive.data as { lines: Array<{ id: string; lineNumber: number; text: string }> }
        ).lines.map((line) => ({
          id: line.id,
          lineNumber: line.lineNumber,
          text: line.text,
        })),
      }
    case "narration":
      return primitive.data
    default:
      return primitive.data
  }
}

function summarizePrimitive(
  primitive: PrimitiveFrameState
): RuntimeGoldenPrimitiveSummary {
  return {
    id: primitive.id,
    kind: primitive.kind,
    title: primitive.title,
    viewportRole: primitive.viewport?.role,
    data: summarizePrimitiveData(primitive),
    pointers: primitive.pointers ?? [],
    highlights: primitive.highlights ?? [],
    annotations: primitive.annotations ?? [],
  }
}

export function createRuntimeGoldenSnapshot(
  trace: TraceEvent[],
  frames: Frame[]
): RuntimeGoldenSnapshot {
  return normalizeValue({
    trace: trace.map((event) => ({
      id: event.id,
      type: event.type,
      codeLine: event.codeLine,
    })),
    frames: frames.map((frame) => ({
      id: frame.id,
      sourceEventId: frame.sourceEventId,
      codeLine: frame.codeLine,
      visualChangeType: frame.visualChangeType,
      narrationSummary: frame.narration.summary,
      checks: frame.checks.map((check) => check.kind),
      primitives: frame.primitives.map((primitive) => summarizePrimitive(primitive)),
    })),
  }) as RuntimeGoldenSnapshot
}

export function serializeRuntimeGoldenSnapshot(snapshot: RuntimeGoldenSnapshot) {
  return JSON.stringify(snapshot, null, 2)
}

export function compareRuntimeGoldenSnapshots(
  actual: RuntimeGoldenSnapshot,
  expected: RuntimeGoldenSnapshot
): GoldenComparisonResult {
  const differences: string[] = []

  if (actual.trace.length !== expected.trace.length) {
    differences.push(
      `trace length mismatch: expected ${expected.trace.length}, received ${actual.trace.length}`
    )
  }

  if (actual.frames.length !== expected.frames.length) {
    differences.push(
      `frame length mismatch: expected ${expected.frames.length}, received ${actual.frames.length}`
    )
  }

  const traceLength = Math.min(actual.trace.length, expected.trace.length)
  for (let index = 0; index < traceLength; index += 1) {
    const actualTrace = actual.trace[index]
    const expectedTrace = expected.trace[index]
    if (stableSerialize(actualTrace) !== stableSerialize(expectedTrace)) {
      differences.push(`trace mismatch at index ${index}`)
      break
    }
  }

  const frameLength = Math.min(actual.frames.length, expected.frames.length)
  for (let index = 0; index < frameLength; index += 1) {
    const actualFrame = actual.frames[index]
    const expectedFrame = expected.frames[index]
    if (stableSerialize(actualFrame) !== stableSerialize(expectedFrame)) {
      differences.push(`frame mismatch at index ${index}`)
      break
    }
  }

  return {
    matches: differences.length === 0,
    differences,
  }
}
