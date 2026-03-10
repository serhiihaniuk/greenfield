import type {
  AnyLessonDefinition,
  ApproachDefinition,
  CodeTemplate,
} from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  ArrayPrimitiveFrameState,
  CallTreePrimitiveFrameState,
  CodeTracePrimitiveFrameState,
  GraphPrimitiveFrameState,
  HashMapPrimitiveFrameState,
  NarrationPrimitiveFrameState,
  QueuePrimitiveFrameState,
  SequencePrimitiveFrameState,
  StackPrimitiveFrameState,
  StatePrimitiveFrameState,
  TreePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import type { FrameCheck, FrameCheckKind } from "@/domains/projection/types"
import type { PrimitiveFrameState } from "@/entities/visualization/types"
import {
  createVerificationReport,
  mergeVerificationReports,
  type VerificationIssue,
  type VerificationReport,
} from "@/domains/verification/types"
import {
  flattenNarrationSegments,
  narrationPlainText,
} from "@/domains/projection/narration"
import { collectFrameExecutionTokens } from "@/shared/visualization/execution-tokens"

type FrameDiffSummary = {
  primitiveAdditions: number
  primitiveRemovals: number
  dataChanges: number
  pointerChanges: number
  highlightChanges: number
  annotationChanges: number
  viewportChanges: number
}

function createIssue(issue: VerificationIssue): VerificationIssue {
  return issue
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

function collectDuplicateIds(ids: string[]): string[] {
  const counts = new Map<string, number>()

  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id)
}

function collectPrimitiveTargetIds(
  primitive: PrimitiveFrameState
): Set<string> {
  switch (primitive.kind) {
    case "array":
      return new Set(
        (primitive as ArrayPrimitiveFrameState).data.cells.map(
          (cell) => cell.id
        )
      )
    case "sequence":
      return new Set(
        (primitive as SequencePrimitiveFrameState).data.items.map(
          (item) => item.id
        )
      )
    case "state":
      return new Set(
        (primitive as StatePrimitiveFrameState).data.values.map(
          (value) => value.label
        )
      )
    case "stack":
      return new Set(
        (primitive as StackPrimitiveFrameState).data.frames.map(
          (frame) => frame.id
        )
      )
    case "queue":
      return new Set(
        (primitive as QueuePrimitiveFrameState).data.items.map(
          (item) => item.id
        )
      )
    case "hash-map":
      return new Set(
        (primitive as HashMapPrimitiveFrameState).data.entries.map(
          (entry) => entry.id
        )
      )
    case "tree":
      return new Set(
        (primitive as TreePrimitiveFrameState).data.nodes.map((node) => node.id)
      )
    case "call-tree":
      return new Set(
        (primitive as CallTreePrimitiveFrameState).data.nodes.map(
          (node) => node.id
        )
      )
    case "graph":
      return new Set(
        (primitive as GraphPrimitiveFrameState).data.nodes.map(
          (node) => node.id
        )
      )
    case "code-trace":
      return new Set(
        (primitive as CodeTracePrimitiveFrameState).data.lines.map(
          (line) => line.id
        )
      )
    case "narration":
      return new Set(
        (primitive as NarrationPrimitiveFrameState).data.segments.map(
          (segment) => segment.id
        )
      )
    default:
      return new Set()
  }
}

function getPrimitiveRole(primitive: PrimitiveFrameState) {
  if (primitive.viewport?.role) {
    return primitive.viewport.role
  }

  switch (primitive.kind) {
    case "state":
    case "code-trace":
    case "narration":
      return "secondary" as const
    default:
      return "primary" as const
  }
}

function summarizeFrameDiff(previous: Frame, current: Frame): FrameDiffSummary {
  const previousPrimitives = new Map(
    previous.primitives.map((primitive) => [primitive.id, primitive])
  )
  const currentPrimitives = new Map(
    current.primitives.map((primitive) => [primitive.id, primitive])
  )

  let primitiveAdditions = 0
  let primitiveRemovals = 0
  let dataChanges = 0
  let pointerChanges = 0
  let highlightChanges = 0
  let annotationChanges = 0
  let viewportChanges = 0

  for (const primitiveId of currentPrimitives.keys()) {
    if (!previousPrimitives.has(primitiveId)) {
      primitiveAdditions += 1
    }
  }

  for (const primitiveId of previousPrimitives.keys()) {
    if (!currentPrimitives.has(primitiveId)) {
      primitiveRemovals += 1
    }
  }

  for (const [primitiveId, currentPrimitive] of currentPrimitives) {
    const previousPrimitive = previousPrimitives.get(primitiveId)
    if (!previousPrimitive) {
      continue
    }

    if (
      stableSerialize(previousPrimitive.data) !==
      stableSerialize(currentPrimitive.data)
    ) {
      dataChanges += 1
    }

    if (
      stableSerialize(previousPrimitive.pointers ?? []) !==
      stableSerialize(currentPrimitive.pointers ?? [])
    ) {
      pointerChanges += 1
    }

    if (
      stableSerialize(previousPrimitive.highlights ?? []) !==
      stableSerialize(currentPrimitive.highlights ?? [])
    ) {
      highlightChanges += 1
    }

    if (
      stableSerialize(previousPrimitive.annotations ?? []) !==
      stableSerialize(currentPrimitive.annotations ?? [])
    ) {
      annotationChanges += 1
    }

    if (
      stableSerialize(previousPrimitive.viewport ?? {}) !==
        stableSerialize(currentPrimitive.viewport ?? {}) ||
      stableSerialize(previousPrimitive.layout ?? {}) !==
        stableSerialize(currentPrimitive.layout ?? {})
    ) {
      viewportChanges += 1
    }
  }

  return {
    primitiveAdditions,
    primitiveRemovals,
    dataChanges,
    pointerChanges,
    highlightChanges,
    annotationChanges,
    viewportChanges,
  }
}

function mapFrameCheckKindToIssueKind(
  kind: FrameCheckKind
): VerificationIssue["kind"] {
  switch (kind) {
    case "code-line-sync":
      return "code-line-sync"
    case "viewport":
      return "viewport"
    case "one-visual-change":
    case "pedagogical-integrity":
      return "pedagogical-integrity"
    default:
      return "frame"
  }
}

function mapFrameCheckToPedagogicalCheck(check: FrameCheck) {
  switch (check.kind) {
    case "one-visual-change":
      return "one-visual-change" as const
    case "state-continuity":
      return "hidden-state-loss" as const
    case "pedagogical-integrity":
      return "scope-handoff" as const
    default:
      return undefined
  }
}

function verifyTraceAndFrameReferences(
  codeTemplate: CodeTemplate,
  trace: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  const issues: VerificationIssue[] = []
  const eventIds = new Set(trace.map((event) => event.id))
  const codeLines = new Set(codeTemplate.lines.map((line) => line.id))
  const duplicateEventIds = collectDuplicateIds(trace.map((event) => event.id))
  const duplicateFrameIds = collectDuplicateIds(frames.map((frame) => frame.id))
  const seenFrameSourceIds = new Set<string>()

  if (trace.length === 0) {
    issues.push(
      createIssue({
        code: "TRACE_EMPTY",
        kind: "semantic",
        severity: "error",
        message: "The trace is empty.",
      })
    )
  }

  if (frames.length === 0) {
    issues.push(
      createIssue({
        code: "FRAMES_EMPTY",
        kind: "frame",
        severity: "error",
        message: "The projected frame list is empty.",
      })
    )
  }

  for (const eventId of duplicateEventIds) {
    issues.push(
      createIssue({
        code: "TRACE_EVENT_DUPLICATE_ID",
        kind: "semantic",
        severity: "error",
        message: `Trace event id "${eventId}" is duplicated.`,
        eventId,
      })
    )
  }

  for (const frameId of duplicateFrameIds) {
    issues.push(
      createIssue({
        code: "FRAME_DUPLICATE_ID",
        kind: "frame",
        severity: "error",
        message: `Frame id "${frameId}" is duplicated.`,
        frameId,
      })
    )
  }

  for (const frame of frames) {
    if (!eventIds.has(frame.sourceEventId)) {
      issues.push(
        createIssue({
          code: "FRAME_SOURCE_EVENT_MISSING",
          kind: "frame",
          severity: "error",
          message: `Frame "${frame.id}" references an event that does not exist.`,
          frameId: frame.id,
        })
      )
    }

    if (!codeLines.has(frame.codeLine)) {
      issues.push(
        createIssue({
          code: "FRAME_CODE_LINE_MISSING",
          kind: "code-line-sync",
          severity: "error",
          message: `Frame "${frame.id}" references unknown code line "${frame.codeLine}".`,
          frameId: frame.id,
        })
      )
    }

    const sourceEvent = trace.find((event) => event.id === frame.sourceEventId)
    if (sourceEvent && sourceEvent.codeLine !== frame.codeLine) {
      issues.push(
        createIssue({
          code: "FRAME_EVENT_CODE_LINE_MISMATCH",
          kind: "code-line-sync",
          severity: "error",
          message: `Frame "${frame.id}" is bound to code line "${frame.codeLine}" but source event "${sourceEvent.id}" is on "${sourceEvent.codeLine}".`,
          frameId: frame.id,
          eventId: sourceEvent.id,
        })
      )
    }

    if (seenFrameSourceIds.has(frame.sourceEventId)) {
      issues.push(
        createIssue({
          code: "FRAME_SOURCE_EVENT_DUPLICATED",
          kind: "frame",
          severity: "error",
          message: `Multiple frames reference the same source event "${frame.sourceEventId}".`,
          frameId: frame.id,
          eventId: frame.sourceEventId,
        })
      )
    } else {
      seenFrameSourceIds.add(frame.sourceEventId)
    }

    if (frame.primitives.length === 0) {
      issues.push(
        createIssue({
          code: "FRAME_PRIMITIVES_EMPTY",
          kind: "frame",
          severity: "error",
          message: `Frame "${frame.id}" does not contain any primitives.`,
          frameId: frame.id,
        })
      )
    }
  }

  return createVerificationReport(issues)
}

function verifyPrimitiveContracts(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const duplicatePrimitiveIds = collectDuplicateIds(
      frame.primitives.map((primitive) => primitive.id)
    )

    for (const primitiveId of duplicatePrimitiveIds) {
      issues.push(
        createIssue({
          code: "FRAME_PRIMITIVE_DUPLICATE_ID",
          kind: "frame",
          severity: "error",
          message: `Frame "${frame.id}" contains duplicate primitive id "${primitiveId}".`,
          frameId: frame.id,
          meta: { primitiveId },
        })
      )
    }

    for (const primitive of frame.primitives) {
      const targetIds = collectPrimitiveTargetIds(primitive)

      for (const pointer of primitive.pointers ?? []) {
        if (!targetIds.has(pointer.targetId)) {
          issues.push(
            createIssue({
              code: "PRIMITIVE_POINTER_TARGET_MISSING",
              kind: "frame",
              severity: "error",
              message: `Pointer "${pointer.id}" in primitive "${primitive.id}" targets missing id "${pointer.targetId}".`,
              frameId: frame.id,
              meta: { primitiveId: primitive.id, pointerId: pointer.id },
            })
          )
        }
      }

      for (const highlight of primitive.highlights ?? []) {
        if (!targetIds.has(highlight.targetId)) {
          issues.push(
            createIssue({
              code: "PRIMITIVE_HIGHLIGHT_TARGET_MISSING",
              kind: "frame",
              severity: "error",
              message: `Highlight in primitive "${primitive.id}" targets missing id "${highlight.targetId}".`,
              frameId: frame.id,
              meta: { primitiveId: primitive.id, targetId: highlight.targetId },
            })
          )
        }
      }

      for (const annotation of primitive.annotations ?? []) {
        if (!targetIds.has(annotation.targetId)) {
          issues.push(
            createIssue({
              code: "PRIMITIVE_ANNOTATION_TARGET_MISSING",
              kind: "frame",
              severity: "error",
              message: `Annotation "${annotation.id}" in primitive "${primitive.id}" targets missing id "${annotation.targetId}".`,
              frameId: frame.id,
              meta: { primitiveId: primitive.id, annotationId: annotation.id },
            })
          )
        }
      }

      for (const edge of primitive.edgeHighlights ?? []) {
        if (!targetIds.has(edge.sourceId) || !targetIds.has(edge.targetId)) {
          issues.push(
            createIssue({
              code: "PRIMITIVE_EDGE_TARGET_MISSING",
              kind: "frame",
              severity: "error",
              message: `Edge "${edge.id}" in primitive "${primitive.id}" references a missing source or target id.`,
              frameId: frame.id,
              meta: { primitiveId: primitive.id, edgeId: edge.id },
            })
          )
        }
      }
    }
  }

  return createVerificationReport(issues)
}

function verifyFrameChecks(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (!frame.checks.some((check) => check.kind === "code-line-sync")) {
      issues.push(
        createIssue({
          code: "FRAME_CODE_LINE_CHECK_MISSING",
          kind: "frame",
          severity: "warning",
          message: `Frame "${frame.id}" does not expose a code-line-sync frame check.`,
          frameId: frame.id,
        })
      )
    }

    for (const check of frame.checks) {
      if (check.status === "pass") {
        continue
      }

      issues.push(
        createIssue({
          code:
            check.status === "fail"
              ? "FRAME_CHECK_FAILED"
              : "FRAME_CHECK_WARNING",
          kind: mapFrameCheckKindToIssueKind(check.kind),
          severity: check.status === "fail" ? "error" : "warning",
          message: `${frame.id}: ${check.message}`,
          frameId: frame.id,
          pedagogicalCheck: mapFrameCheckToPedagogicalCheck(check),
          meta: {
            checkId: check.id,
            checkKind: check.kind,
          },
        })
      )
    }
  }

  return createVerificationReport(issues)
}

function verifyPedagogicalIntegrity(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (let index = 1; index < frames.length; index += 1) {
    const previousFrame = frames[index - 1]
    const frame = frames[index]
    if (!previousFrame) {
      continue
    }

    const diff = summarizeFrameDiff(previousFrame, frame)
    const changedGroups = [
      diff.primitiveAdditions + diff.primitiveRemovals,
      diff.dataChanges,
      diff.pointerChanges,
      diff.highlightChanges,
      diff.annotationChanges,
      diff.viewportChanges,
    ].filter((count) => count > 0).length

    if (changedGroups === 0) {
      issues.push(
        createIssue({
          code: "FRAME_NO_VISIBLE_CHANGE",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" does not introduce a learner-visible change relative to "${previousFrame.id}".`,
          frameId: frame.id,
          pedagogicalCheck: "one-visual-change",
        })
      )
    }

    if (changedGroups > 4) {
      issues.push(
        createIssue({
          code: "FRAME_OVERLOADED",
          kind: "pedagogical-integrity",
          severity: "warning",
          message: `Frame "${frame.id}" changes too many primitive groups at once (${changedGroups}).`,
          frameId: frame.id,
          pedagogicalCheck: "overloaded-frame",
          meta: {
            changedGroups,
            primitiveAdditions: diff.primitiveAdditions,
            primitiveRemovals: diff.primitiveRemovals,
            dataChanges: diff.dataChanges,
            pointerChanges: diff.pointerChanges,
            highlightChanges: diff.highlightChanges,
            annotationChanges: diff.annotationChanges,
            viewportChanges: diff.viewportChanges,
          },
        })
      )
    }

    if (
      frame.visualChangeType === "move" &&
      diff.pointerChanges === 0 &&
      diff.dataChanges === 0
    ) {
      issues.push(
        createIssue({
          code: "FRAME_MOVE_WITHOUT_POINTER_SIGNAL",
          kind: "pedagogical-integrity",
          severity: "warning",
          message: `Frame "${frame.id}" is labeled as a move but does not visibly move a pointer or state value.`,
          frameId: frame.id,
          pedagogicalCheck: "one-visual-change",
        })
      )
    }

    if (
      frame.visualChangeType === "compare" &&
      diff.highlightChanges === 0 &&
      diff.annotationChanges === 0 &&
      diff.dataChanges === 0
    ) {
      issues.push(
        createIssue({
          code: "FRAME_COMPARE_WITHOUT_SIGNAL",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" is labeled as a compare but does not visibly show the comparison.`,
          frameId: frame.id,
          pedagogicalCheck: "code-line-mismatch",
        })
      )
    }

    if (
      frame.visualChangeType !== "exit" &&
      frame.visualChangeType !== "result" &&
      diff.primitiveRemovals > 0
    ) {
      issues.push(
        createIssue({
          code: "FRAME_HIDDEN_STATE_LOSS",
          kind: "pedagogical-integrity",
          severity: "warning",
          message: `Frame "${frame.id}" removes visible primitive state without an explicit exit/result handoff.`,
          frameId: frame.id,
          pedagogicalCheck: "hidden-state-loss",
        })
      )
    }

    const previousPrimitiveMap = new Map(
      previousFrame.primitives.map((primitive) => [primitive.id, primitive])
    )

    for (const primitive of frame.primitives) {
      const previousPrimitive = previousPrimitiveMap.get(primitive.id)
      if (!previousPrimitive) {
        continue
      }

      const currentPointerIds = new Set(
        (primitive.pointers ?? []).map((pointer) => pointer.id)
      )

      for (const pointer of previousPrimitive.pointers ?? []) {
        if (
          pointer.status === "done" ||
          currentPointerIds.has(pointer.id) ||
          frame.visualChangeType === "exit" ||
          frame.visualChangeType === "result"
        ) {
          continue
        }

        issues.push(
          createIssue({
            code: "FRAME_POINTER_CONTINUITY_LOSS",
            kind: "pedagogical-integrity",
            severity: "warning",
            message: `Frame "${frame.id}" drops pointer "${pointer.id}" from primitive "${primitive.id}" instead of moving it or handing it off explicitly.`,
            frameId: frame.id,
            pedagogicalCheck: "hidden-state-loss",
            meta: {
              primitiveId: primitive.id,
              pointerId: pointer.id,
              previousFrameId: previousFrame.id,
            },
          })
        )
      }
    }
  }

  return createVerificationReport(issues)
}

function verifyStructuredNarration(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const implicationFamilies = new Set([
    "prune",
    "commit",
    "return",
    "reuse",
    "shift",
  ])

  for (const frame of frames) {
    const { narration } = frame
    const headline = narration.headline
    const flattenedSegments = flattenNarrationSegments(narration)
    const projectedTokenIds = new Set(
      collectFrameExecutionTokens(frame, { includeNarration: false }).map(
        (token) => token.id
      )
    )

    if (headline) {
      const headlineText = narrationPlainText(headline.segments)
      if (headlineText !== narration.summary) {
        issues.push(
          createIssue({
            code: "NARRATION_SUMMARY_HEADLINE_MISMATCH",
            kind: "pedagogical-integrity",
            severity: "warning",
            message: `Frame "${frame.id}" narration summary drifts from the structured headline.`,
            frameId: frame.id,
            pedagogicalCheck: "narration-mismatch",
          })
        )
      }
    }

    if (narration.family && !narration.headline) {
      issues.push(
        createIssue({
          code: "NARRATION_FAMILY_WITHOUT_HEADLINE",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" declares narration family "${narration.family}" without a structured headline.`,
          frameId: frame.id,
          pedagogicalCheck: "narration-mismatch",
        })
      )
    }

    if (
      narration.family &&
      !narration.reason &&
      !narration.implication
    ) {
      issues.push(
        createIssue({
          code: "NARRATION_EXPLANATION_TOO_THIN",
          kind: "pedagogical-integrity",
          severity: "warning",
          message: `Frame "${frame.id}" narration family "${narration.family}" should explain either why the change happened or what it implies next.`,
          frameId: frame.id,
          pedagogicalCheck: "narration-mismatch",
        })
      )
    }

    if (
      narration.family &&
      implicationFamilies.has(narration.family) &&
      !narration.implication
    ) {
      issues.push(
        createIssue({
          code: "NARRATION_IMPLICATION_MISSING",
          kind: "pedagogical-integrity",
          severity: "warning",
          message: `Frame "${frame.id}" narration family "${narration.family}" should expose the consequence of the step.`,
          frameId: frame.id,
          pedagogicalCheck: "narration-mismatch",
        })
      )
    }

    for (const segment of flattenedSegments) {
      if (!segment.tokenId) {
        continue
      }

      if (!projectedTokenIds.has(segment.tokenId)) {
        issues.push(
          createIssue({
            code: "NARRATION_TOKEN_NOT_PROJECTED",
            kind: "pedagogical-integrity",
            severity: "error",
            message: `Frame "${frame.id}" mentions token "${segment.tokenId}" in narration without projecting it in another synchronized view.`,
            frameId: frame.id,
            pedagogicalCheck: "narration-mismatch",
            meta: {
              tokenId: segment.tokenId,
            },
          })
        )
      }
    }
  }

  return createVerificationReport(issues)
}

function verifyViewportSanity(
  lesson: AnyLessonDefinition,
  frames: Frame[]
): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const primaryPrimitives = frame.primitives.filter(
      (primitive) => getPrimitiveRole(primitive) === "primary"
    )
    const secondaryPrimitives = frame.primitives.filter(
      (primitive) => getPrimitiveRole(primitive) !== "primary"
    )

    if (primaryPrimitives.length === 0) {
      issues.push(
        createIssue({
          code: "FRAME_PRIMARY_VIEW_MISSING",
          kind: "viewport",
          severity: "error",
          message: `Frame "${frame.id}" does not expose a primary visualization surface.`,
          frameId: frame.id,
        })
      )
    }

    if (
      secondaryPrimitives.length >
      lesson.viewportContract.maxVisibleSecondaryPanels
    ) {
      issues.push(
        createIssue({
          code: "FRAME_SECONDARY_PANEL_OVERFLOW",
          kind: "viewport",
          severity: "warning",
          message: `Frame "${frame.id}" exposes ${secondaryPrimitives.length} secondary panels, exceeding the lesson contract of ${lesson.viewportContract.maxVisibleSecondaryPanels}.`,
          frameId: frame.id,
        })
      )
    }

    if (lesson.viewportContract.avoidVerticalScroll) {
      const primaryHeight = Math.max(
        0,
        ...primaryPrimitives.map(
          (primitive) =>
            primitive.viewport?.preferredHeight ??
            primitive.viewport?.minHeight ??
            0
        )
      )
      const secondaryHeight = secondaryPrimitives.reduce((total, primitive) => {
        return (
          total +
          (primitive.viewport?.preferredHeight ??
            primitive.viewport?.minHeight ??
            0)
        )
      }, 0)

      const estimatedHeight =
        lesson.viewportContract.preferredLayout === "canvas-with-side-panels"
          ? Math.max(primaryHeight, secondaryHeight)
          : primaryHeight + secondaryHeight

      if (estimatedHeight > lesson.viewportContract.desktopMinHeight * 0.95) {
        issues.push(
          createIssue({
            code: "FRAME_VIEWPORT_HEIGHT_WARNING",
            kind: "viewport",
            severity: "warning",
            message: `Frame "${frame.id}" is likely too tall for the lesson viewport contract (${estimatedHeight}px estimated vs ${lesson.viewportContract.desktopMinHeight}px target).`,
            frameId: frame.id,
            meta: {
              estimatedHeight,
              desktopMinHeight: lesson.viewportContract.desktopMinHeight,
            },
          })
        )
      }
    }
  }

  return createVerificationReport(issues)
}

export function verifyRuntimeOutputs(
  lesson: AnyLessonDefinition,
  approach: ApproachDefinition,
  trace: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  const baseReport = mergeVerificationReports(
    verifyTraceAndFrameReferences(approach.codeTemplate, trace, frames),
    verifyPrimitiveContracts(frames),
    verifyFrameChecks(frames),
    verifyPedagogicalIntegrity(frames),
    verifyStructuredNarration(frames),
    verifyViewportSanity(lesson, frames)
  )

  if (!approach.verify) {
    return baseReport
  }

  const report = mergeVerificationReports(
    baseReport,
    approach.verify(trace, frames)
  )
  return createVerificationReport([...report.errors, ...report.warnings], {
    lessonId: lesson.id,
    approachId: approach.id,
    traceEventCount: trace.length,
    frameCount: frames.length,
  })
}
