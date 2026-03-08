import type { CodeTemplate } from "@/domains/lessons/types"
import type { Frame } from "@/domains/projection/types"
import type { TraceEvent } from "@/domains/tracing/types"
import type {
  CallTreePrimitiveFrameState,
  HashMapPrimitiveFrameState,
  StackPrimitiveFrameState,
} from "@/entities/visualization/primitives"
import {
  createVerificationReport,
  mergeVerificationReports,
  type VerificationIssue,
  type VerificationReport,
} from "@/domains/verification/types"

function findPrimitive(frame: Frame, primitiveId: string) {
  return frame.primitives.find((primitive) => primitive.id === primitiveId)
}

function findHashMapEntry(frame: Frame, key: string) {
  const primitive = findPrimitive(frame, "memo-table")
  if (!primitive || primitive.kind !== "hash-map") {
    return undefined
  }

  return (primitive as HashMapPrimitiveFrameState).data.entries.find(
    (entry) => entry.key === key
  )
}

function verifyTraceShape(
  events: TraceEvent[],
  frames: Frame[],
  codeTemplate: CodeTemplate
): VerificationReport {
  const issues: VerificationIssue[] = []
  const visibleEvents = events.filter((event) => event.type !== "complete")
  const completionEvent = events.at(-1)
  const codeLines = new Set(codeTemplate.lines.map((line) => line.id))

  if (frames.length !== visibleEvents.length) {
    issues.push({
      code: "COIN_CHANGE_FRAME_COUNT_MISMATCH",
      kind: "frame",
      severity: "error",
      message: `Coin change should project one learner-visible frame per non-complete event (${visibleEvents.length}), but produced ${frames.length}.`,
    })
  }

  if (!completionEvent || completionEvent.type !== "complete") {
    issues.push({
      code: "COIN_CHANGE_COMPLETE_EVENT_MISSING",
      kind: "semantic",
      severity: "error",
      message: "Coin change trace should end with a complete event.",
      eventId: completionEvent?.id,
    })
  }

  for (const frame of frames) {
    if (!codeLines.has(frame.codeLine)) {
      issues.push({
        code: "COIN_CHANGE_FRAME_CODE_LINE_MISSING",
        kind: "code-line-sync",
        severity: "error",
        message: `Frame "${frame.id}" points to unknown code line "${frame.codeLine}".`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyRequiredViews(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    const executionTree = findPrimitive(frame, "execution-tree")
    const stack = findPrimitive(frame, "call-stack")
    const memo = findPrimitive(frame, "memo-table")

    if (!executionTree || executionTree.kind !== "call-tree") {
      issues.push({
        code: "COIN_CHANGE_CALL_TREE_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the recursive execution tree as the primary surface.`,
        frameId: frame.id,
      })
    }

    if (!stack || stack.kind !== "stack") {
      issues.push({
        code: "COIN_CHANGE_STACK_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the recursion stack.`,
        frameId: frame.id,
      })
    }

    if (!memo || memo.kind !== "hash-map") {
      issues.push({
        code: "COIN_CHANGE_MEMO_VIEW_MISSING",
        kind: "viewport",
        severity: "error",
        message: `Frame "${frame.id}" should render the memo table.`,
        frameId: frame.id,
      })
    }
  }

  return createVerificationReport(issues)
}

function verifyMemoSignals(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []

  for (const frame of frames) {
    if (frame.codeLine === "L5") {
      const remaining = frame.narration.sourceValues.remaining
      const entry =
        typeof remaining === "number"
          ? findHashMapEntry(frame, String(remaining))
          : undefined

      if (!entry) {
        continue
      }

      if (frame.narration.sourceValues.memoValue !== undefined) {
        if (entry.status !== "read") {
          issues.push({
            code: "COIN_CHANGE_MEMO_HIT_NOT_VISIBLE",
            kind: "pedagogical-integrity",
            severity: "error",
            message: `Frame "${frame.id}" should visibly show memo reuse for the active remainder.`,
            frameId: frame.id,
            pedagogicalCheck: "one-visual-change",
          })
        }
      }
    }

    if (frame.codeLine === "L13") {
      const remaining = frame.narration.sourceValues.remaining
      const entry =
        typeof remaining === "number"
          ? findHashMapEntry(frame, String(remaining))
          : undefined

      if (!entry || entry.status !== "write") {
        issues.push({
          code: "COIN_CHANGE_MEMO_WRITE_NOT_VISIBLE",
          kind: "pedagogical-integrity",
          severity: "error",
          message: `Frame "${frame.id}" should visibly show the memo write for the solved remainder.`,
          frameId: frame.id,
          pedagogicalCheck: "narration-mismatch",
        })
      }
    }
  }

  return createVerificationReport(issues)
}

function verifyBaseAndDeadStates(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const baseFrames = frames.filter(
    (frame) => frame.codeLine === "L3" || frame.codeLine === "L4"
  )

  if (baseFrames.length === 0) {
    issues.push({
      code: "COIN_CHANGE_BASE_FRAMES_MISSING",
      kind: "semantic",
      severity: "error",
      message:
        "Coin change should visibly show both terminal recursion outcomes when they occur.",
    })

    return createVerificationReport(issues)
  }

  const expectsZeroBase = baseFrames.some((frame) => frame.codeLine === "L3")
  const hasZeroBase = baseFrames.some((frame) => {
    const tree = findPrimitive(frame, "execution-tree")
    return (
      tree?.kind === "call-tree" &&
      (tree as CallTreePrimitiveFrameState).data.nodes.some(
        (node) => node.stateValue === "rem 0" && node.returnValue === "0"
      )
    )
  })

  if (expectsZeroBase && !hasZeroBase) {
    issues.push({
      code: "COIN_CHANGE_ZERO_BASE_NOT_VISIBLE",
      kind: "pedagogical-integrity",
      severity: "error",
      message: "A base-case frame should visibly return 0 for remainder 0.",
      pedagogicalCheck: "scope-handoff",
    })
  }

  const expectsDeadBranch = baseFrames.some((frame) => frame.codeLine === "L4")
  const hasDeadBranch = baseFrames.some((frame) => {
    const tree = findPrimitive(frame, "execution-tree")
    return (
      tree?.kind === "call-tree" &&
      (tree as CallTreePrimitiveFrameState).data.nodes.some(
        (node) => node.returnValue === "INF" && node.status === "dead"
      )
    )
  })

  if (expectsDeadBranch && !hasDeadBranch) {
    issues.push({
      code: "COIN_CHANGE_DEAD_BRANCH_NOT_VISIBLE",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "An overshoot frame should visibly return INF so impossible branches do not disappear silently.",
      pedagogicalCheck: "hidden-state-loss",
    })
  }

  return createVerificationReport(issues)
}

function verifyFinalAnswer(frames: Frame[]): VerificationReport {
  const issues: VerificationIssue[] = []
  const finalFrame = frames.at(-1)

  if (!finalFrame) {
    issues.push({
      code: "COIN_CHANGE_FRAMES_EMPTY",
      kind: "frame",
      severity: "error",
      message: "Coin change produced no frames.",
    })

    return createVerificationReport(issues)
  }

  if (
    finalFrame.visualChangeType !== "result" ||
    finalFrame.codeLine !== "L16"
  ) {
    issues.push({
      code: "COIN_CHANGE_FINAL_FRAME_NOT_RESULT",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final learner-visible frame should communicate the normalized wrapper answer.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  const stackDepth =
    findPrimitive(finalFrame, "call-stack")?.kind === "stack"
      ? (findPrimitive(finalFrame, "call-stack") as StackPrimitiveFrameState)
          .data.frames.length
      : undefined

  if (stackDepth !== 0) {
    issues.push({
      code: "COIN_CHANGE_STACK_NOT_UNWOUND",
      kind: "pedagogical-integrity",
      severity: "warning",
      message:
        "The wrapper result should appear after the recursive stack has fully unwound.",
      frameId: finalFrame.id,
      pedagogicalCheck: "scope-handoff",
    })
  }

  const rootReturn =
    findPrimitive(finalFrame, "execution-tree")?.kind === "call-tree"
      ? (
          findPrimitive(
            finalFrame,
            "execution-tree"
          ) as CallTreePrimitiveFrameState
        ).data.nodes.find((node) => !node.parentId)?.returnValue
      : undefined

  const expected = finalFrame.narration.sourceValues.normalizedAnswer
  if (rootReturn === undefined || expected === undefined) {
    issues.push({
      code: "COIN_CHANGE_FINAL_RESULT_DATA_MISSING",
      kind: "pedagogical-integrity",
      severity: "error",
      message:
        "The final frame should expose both the recursive root return and the normalized wrapper answer.",
      frameId: finalFrame.id,
      pedagogicalCheck: "code-line-mismatch",
    })
  }

  return createVerificationReport(issues)
}

export function verifyMemoDfsCoinChange(
  codeTemplate: CodeTemplate,
  events: TraceEvent[],
  frames: Frame[]
): VerificationReport {
  return mergeVerificationReports(
    verifyTraceShape(events, frames, codeTemplate),
    verifyRequiredViews(frames),
    verifyMemoSignals(frames),
    verifyBaseAndDeadStates(frames),
    verifyFinalAnswer(frames)
  )
}
