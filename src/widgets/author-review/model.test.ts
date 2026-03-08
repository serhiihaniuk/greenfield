import { describe, expect, it } from "vitest"

import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type { VerificationReport } from "@/domains/verification/types"
import {
  collectRelatedIssues,
  summarizeFrameDiff,
  summarizeNarrationBindings,
} from "@/widgets/author-review/model"

const previousFrame = {
  id: "frame-1",
  sourceEventId: "event-1",
  codeLine: "L1",
  visualChangeType: "mutate",
  narration: {
    summary: "before",
    segments: [],
    sourceValues: { step: 1 },
  },
  primitives: [
    {
      id: "array",
      kind: "array",
      data: {
        cells: [{ id: "cell-0", index: 0, value: 3 }],
      },
      pointers: [{ id: "lo", targetId: "cell-0", label: "lo", tone: "primary" }],
      highlights: [],
      annotations: [],
      viewport: { role: "primary", minHeight: 200 },
    },
  ],
  checks: [],
} as Frame

const currentFrame = {
  id: "frame-2",
  sourceEventId: "event-2",
  codeLine: "L2",
  visualChangeType: "compare",
  narration: {
    summary: "after",
    segments: [],
    sourceValues: { step: 2, target: 7 },
  },
  primitives: [
    {
      id: "array",
      kind: "array",
      data: {
        cells: [{ id: "cell-0", index: 0, value: 7 }],
      },
      pointers: [{ id: "lo", targetId: "cell-0", label: "lo", tone: "secondary" }],
      highlights: [{ targetId: "cell-0", tone: "compare" }],
      annotations: [{ id: "decision", targetId: "cell-0", kind: "badge", text: "check" }],
      viewport: { role: "primary", minHeight: 240 },
    },
    {
      id: "state",
      kind: "state",
      data: {
        values: [{ label: "target", value: 7 }],
      },
      viewport: { role: "secondary", minHeight: 160 },
    },
  ],
  checks: [],
} as Frame

const event = {
  id: "event-2",
  type: "compare",
  codeLine: "L2",
  payload: { target: 7, decision: "left" },
  snapshot: { target: 7 },
} as TraceEvent

describe("author review model", () => {
  it("summarizes adjacent frame changes for author diff inspection", () => {
    const diff = summarizeFrameDiff(previousFrame, currentFrame)

    expect(diff).toBeDefined()
    expect(diff?.summary.primitiveAdditions).toBe(1)
    expect(diff?.summary.dataChanges).toBe(1)
    expect(diff?.summary.pointerChanges).toBe(1)
    expect(diff?.summary.highlightChanges).toBe(1)
    expect(diff?.summary.annotationChanges).toBe(1)
    expect(diff?.summary.viewportChanges).toBe(1)
    expect(diff?.primitiveChanges.map((change) => change.primitiveId)).toEqual([
      "array",
      "state",
    ])
  })

  it("keeps global and active-context verification issues together", () => {
    const verification = {
      isValid: false,
      errors: [
        {
          code: "GLOBAL",
          kind: "semantic",
          severity: "error",
          message: "global issue",
        },
        {
          code: "FRAME",
          kind: "frame",
          severity: "error",
          message: "frame issue",
          frameId: "frame-2",
        },
      ],
      warnings: [
        {
          code: "EVENT",
          kind: "pedagogical-integrity",
          severity: "warning",
          message: "event warning",
          eventId: "event-2",
        },
        {
          code: "OTHER",
          kind: "viewport",
          severity: "warning",
          message: "other warning",
          frameId: "frame-99",
        },
      ],
    } as VerificationReport

    const issues = collectRelatedIssues(verification, currentFrame, event)

    expect(issues.blocking.map((issue) => issue.code)).toEqual(["GLOBAL", "FRAME"])
    expect(issues.warnings.map((issue) => issue.code)).toEqual(["EVENT"])
  })

  it("detects narration bindings that diverge from the source event payload", () => {
    const bindings = summarizeNarrationBindings(currentFrame, event)

    expect(bindings.synchronizedToEvent).toBe(false)
    expect(bindings.missingNarrationKeys).toEqual(["decision"])
    expect(bindings.extraNarrationKeys).toEqual(["step"])
  })
})