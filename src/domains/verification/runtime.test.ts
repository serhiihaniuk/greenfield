import { buildLessonRuntime } from "@/features/player/runtime"
import { verifyRuntimeOutputs } from "@/domains/verification/runtime"
import { binarySearchLesson } from "../../../content/lessons/binary-search/lesson"
import { houseRobberLesson } from "../../../content/lessons/house-robber/lesson"
import { maximumDepthLesson } from "../../../content/lessons/maximum-depth/lesson"
import { slidingWindowMaximumLesson } from "../../../content/lessons/sliding-window-maximum/lesson"
import type {
  CallTreePrimitiveFrameState,
  StackPrimitiveFrameState,
  StatePrimitiveFrameState,
} from "@/entities/visualization/primitives"

describe("verifyRuntimeOutputs", () => {
  const approach = binarySearchLesson.approaches[0]
  const foundMiddlePreset = approach?.presets.find(
    (preset) => preset.id === "found-middle"
  )

  if (!approach || !foundMiddlePreset) {
    throw new Error("Binary search lesson fixture is not available.")
  }

  it("passes verification for the flagship found-middle preset", () => {
    const runtime = buildLessonRuntime({
      lesson: binarySearchLesson,
      approach,
      mode: "full",
      rawInput: foundMiddlePreset.rawInput,
    })

    expect(runtime.failure).toBeUndefined()
    expect(runtime.verification?.isValid).toBe(true)
  })

  it("projects binary search execution tokens across state and narration", () => {
    const runtime = buildLessonRuntime({
      lesson: binarySearchLesson,
      approach,
      mode: "full",
      rawInput: foundMiddlePreset.rawInput,
    })

    const midFrame = runtime.frames.find((frame) => frame.codeLine === "L4")
    const statePrimitive = midFrame?.primitives.find(
      (primitive) => primitive.id === "state"
    )

    if (!midFrame || !statePrimitive || statePrimitive.kind !== "state") {
      throw new Error("Expected a binary search state primitive on the midpoint frame.")
    }

    const typedStatePrimitive = statePrimitive as StatePrimitiveFrameState

    expect(
      typedStatePrimitive.data.values.find((entry) => entry.label === "mid")
    ).toMatchObject({
      tokenId: "mid",
      tokenStyle: "accent-3",
    })
    expect(midFrame.narration.segments.some((segment) => segment.tokenId === "mid")).toBe(
      true
    )
  })

  it("flags broken frame bindings and missing primary primitives", () => {
    const runtime = buildLessonRuntime({
      lesson: binarySearchLesson,
      approach,
      mode: "full",
      rawInput: foundMiddlePreset.rawInput,
    })

    const frame = runtime.frames[0]
    if (!frame) {
      throw new Error("Expected at least one frame for binary search.")
    }

    const report = verifyRuntimeOutputs(
      binarySearchLesson,
      approach,
      runtime.trace,
      [
        {
          ...frame,
          codeLine: "L15",
          primitives: frame.primitives.filter(
            (primitive) => primitive.viewport?.role !== "primary"
          ),
        },
        ...runtime.frames.slice(1),
      ]
    )

    expect(report.isValid).toBe(false)
    expect(
      report.errors.some(
        (issue) => issue.code === "FRAME_EVENT_CODE_LINE_MISMATCH"
      )
    ).toBe(true)
    expect(
      report.errors.some((issue) => issue.code === "FRAME_PRIMARY_VIEW_MISSING")
    ).toBe(true)
  })

  it("keeps the house robber index pointer continuous across processing steps", () => {
    const houseRobberApproach = houseRobberLesson.approaches[0]
    const classicFivePreset = houseRobberApproach?.presets.find(
      (preset) => preset.id === "classic-five"
    )

    if (!houseRobberApproach || !classicFivePreset) {
      throw new Error("House robber lesson fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: houseRobberLesson,
      approach: houseRobberApproach,
      mode: "full",
      rawInput: classicFivePreset.rawInput,
    })

    expect(runtime.failure).toBeUndefined()
    expect(
      runtime.verification?.errors.some(
        (issue) => issue.code === "HOUSE_ROBBER_INDEX_POINTER_DISAPPEARS"
      )
    ).toBe(false)
    expect(
      runtime.verification?.warnings.some(
        (issue) => issue.code === "FRAME_POINTER_CONTINUITY_LOSS"
      )
    ).toBe(false)
  })

  it("projects the house robber index token across state and narration", () => {
    const houseRobberApproach = houseRobberLesson.approaches[0]
    const classicFivePreset = houseRobberApproach?.presets.find(
      (preset) => preset.id === "classic-five"
    )

    if (!houseRobberApproach || !classicFivePreset) {
      throw new Error("House robber lesson fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: houseRobberLesson,
      approach: houseRobberApproach,
      mode: "full",
      rawInput: classicFivePreset.rawInput,
    })

    const focusedFrame = runtime.frames.find((frame) => frame.codeLine === "L4")
    const statePrimitive = focusedFrame?.primitives.find(
      (primitive) => primitive.id === "rolling-state"
    )

    if (!focusedFrame || !statePrimitive || statePrimitive.kind !== "state") {
      throw new Error("Expected a house robber state primitive on the pointer frame.")
    }

    const typedStatePrimitive = statePrimitive as StatePrimitiveFrameState

    expect(
      typedStatePrimitive.data.values.find((entry) => entry.label === "i")
    ).toMatchObject({
      tokenId: "index",
      tokenStyle: "accent-1",
    })
    expect(
      focusedFrame.narration.segments.some((segment) => segment.tokenId === "index")
    ).toBe(true)
  })

  it("flags disappearing pointers as a continuity warning", () => {
    const houseRobberApproach = houseRobberLesson.approaches[0]
    const classicFivePreset = houseRobberApproach?.presets.find(
      (preset) => preset.id === "classic-five"
    )

    if (!houseRobberApproach || !classicFivePreset) {
      throw new Error("House robber lesson fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: houseRobberLesson,
      approach: houseRobberApproach,
      mode: "full",
      rawInput: classicFivePreset.rawInput,
    })

    const targetFrameIndex = runtime.frames.findIndex(
      (frame, index) =>
        index > 0 &&
        frame.codeLine === "L3" &&
        runtime.frames[index - 1]?.primitives
          .find((primitive) => primitive.id === "houses")
          ?.pointers?.some((pointer) => pointer.id === "index")
    )

    if (targetFrameIndex <= 0) {
      throw new Error(
        "Expected a house robber loop-check frame after an index pointer frame."
      )
    }

    const report = verifyRuntimeOutputs(
      houseRobberLesson,
      houseRobberApproach,
      runtime.trace,
      runtime.frames.map((frame, index) => {
        if (index !== targetFrameIndex) {
          return frame
        }

        return {
          ...frame,
          primitives: frame.primitives.map((primitive) =>
            primitive.id === "houses"
              ? {
                  ...primitive,
                  pointers: [],
                }
              : primitive
          ),
        }
      })
    )

    expect(
      report.warnings.some(
        (issue) => issue.code === "FRAME_POINTER_CONTINUITY_LOSS"
      )
    ).toBe(true)
  })

  it("projects sliding window tokens across state and narration", () => {
    const slidingWindowApproach = slidingWindowMaximumLesson.approaches[0]
    const classicPreset = slidingWindowApproach?.presets.find(
      (preset) => preset.id === "classic-five"
    )

    if (!slidingWindowApproach || !classicPreset) {
      throw new Error("Sliding window lesson fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: slidingWindowMaximumLesson,
      approach: slidingWindowApproach,
      mode: "full",
      rawInput: classicPreset.rawInput,
    })

    const pushFrame = runtime.frames.find((frame) => frame.codeLine === "L11")
    const statePrimitive = pushFrame?.primitives.find(
      (primitive) => primitive.id === "window-state"
    )

    if (!pushFrame || !statePrimitive || statePrimitive.kind !== "state") {
      throw new Error("Expected a sliding window state primitive on the push frame.")
    }

    const typedStatePrimitive = statePrimitive as StatePrimitiveFrameState

    expect(
      typedStatePrimitive.data.values.find((entry) => entry.label === "i")
    ).toMatchObject({
      tokenId: "index",
      tokenStyle: "accent-1",
    })
    expect(
      typedStatePrimitive.data.values.find((entry) => entry.label === "front")
    ).toMatchObject({
      tokenId: "deque-front",
      tokenStyle: "accent-2",
    })
    expect(
      pushFrame.narration.segments.some((segment) => segment.tokenId === "index")
    ).toBe(true)
  })

  it("projects the maximum depth dfs token across execution tree, stack, and narration", () => {
    const maximumDepthApproach = maximumDepthLesson.approaches[0]
    const balancedPreset = maximumDepthApproach?.presets.find(
      (preset) => preset.id === "balanced-five"
    )

    if (!maximumDepthApproach || !balancedPreset) {
      throw new Error("Maximum depth lesson fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: maximumDepthLesson,
      approach: maximumDepthApproach,
      mode: "full",
      rawInput: balancedPreset.rawInput,
    })

    const rootFrame = runtime.frames.find((frame) => frame.codeLine === "L2")
    const executionTree = rootFrame?.primitives.find(
      (primitive) => primitive.id === "execution-tree"
    )
    const callStack = rootFrame?.primitives.find(
      (primitive) => primitive.id === "call-stack"
    )

    if (!rootFrame || !executionTree || executionTree.kind !== "call-tree") {
      throw new Error("Expected a maximum depth execution tree on the root frame.")
    }

    if (!callStack || callStack.kind !== "stack") {
      throw new Error("Expected a maximum depth call stack on the root frame.")
    }

    const typedExecutionTree = executionTree as CallTreePrimitiveFrameState
    const typedCallStack = callStack as StackPrimitiveFrameState

    expect(typedExecutionTree.data.nodes[0]).toMatchObject({
      tokenId: "dfs",
      tokenStyle: "accent-1",
    })
    expect(typedCallStack.data.frames[0]).toMatchObject({
      tokenId: "dfs",
      tokenStyle: "accent-1",
    })
    expect(
      rootFrame.narration.segments.some((segment) => segment.tokenId === "dfs")
    ).toBe(true)
  })
})
