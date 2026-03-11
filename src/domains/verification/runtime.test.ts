import { buildLessonRuntime } from "@/features/player/runtime"
import { verifyRuntimeOutputs } from "@/domains/verification/runtime"
import { binarySearchLesson } from "../../../content/lessons/binary-search/lesson"
import { graphBfsLesson } from "../../../content/lessons/graph-bfs/lesson"
import { houseRobberLesson } from "../../../content/lessons/house-robber/lesson"
import { maximumDepthLesson } from "../../../content/lessons/maximum-depth/lesson"
import { slidingWindowMaximumLesson } from "../../../content/lessons/sliding-window-maximum/lesson"
import type {
  CallTreePrimitiveFrameState,
  GraphPrimitiveFrameState,
  QueuePrimitiveFrameState,
  StackPrimitiveFrameState,
  StatePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import { collectFrameExecutionTokens } from "@/shared/visualization/execution-tokens"

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
    expect(midFrame.narration.headline?.segments[1]?.tokenId).toBe("mid")
    expect(midFrame.narration.reason?.segments[0]?.text).toContain(
      "Binary search always probes the center"
    )
    expect(midFrame.narration.implication?.segments[0]?.text).toContain(
      "The next frame compares"
    )
  })

  it("flags narration tokens that are not projected outside the explanation surface", () => {
    const runtime = buildLessonRuntime({
      lesson: binarySearchLesson,
      approach,
      mode: "full",
      rawInput: foundMiddlePreset.rawInput,
    })

    const report = verifyRuntimeOutputs(
      binarySearchLesson,
      approach,
      runtime.trace,
      runtime.frames.map((frame) => {
        if (frame.codeLine !== "L4") {
          return frame
        }

        return {
          ...frame,
          primitives: frame.primitives.map((primitive) => {
            if (primitive.id === "array") {
              return {
                ...primitive,
                pointers: primitive.pointers?.filter(
                  (pointer) => pointer.id !== "mid"
                ),
              }
            }

            if (primitive.id === "state" && primitive.kind === "state") {
              const statePrimitive = primitive as StatePrimitiveFrameState
              return {
                ...statePrimitive,
                data: {
                  ...statePrimitive.data,
                  values: statePrimitive.data.values.map((entry) =>
                    entry.label === "mid"
                      ? {
                          ...entry,
                          tokenId: undefined,
                          tokenStyle: undefined,
                        }
                      : entry
                  ),
                },
              }
            }

            return primitive
          }),
        }
      })
    )

    expect(
      report.errors.some(
        (issue) => issue.code === "NARRATION_TOKEN_NOT_PROJECTED"
      )
    ).toBe(true)
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

    const pushFrame = runtime.frames.find(
      (frame) =>
        frame.codeLine === "L11" &&
        frame.narration.implication?.segments[0]?.text.includes(
          "the next frame can emit the deque front"
        )
    )
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
    expect(pushFrame.narration.headline?.segments.some((segment) => segment.tokenId === "index")).toBe(
      true
    )
    expect(pushFrame.narration.reason?.segments[0]?.text).toContain(
      "All stale and dominated indices have already been removed"
    )
    expect(pushFrame.narration.implication?.segments[0]?.text).toContain(
      "the next frame can emit the deque front"
    )

    const compareFrame = runtime.frames.find((frame) => frame.codeLine === "L8")
    if (!compareFrame) {
      throw new Error("Expected a sliding window compare frame for the deque back.")
    }

    expect(
      compareFrame.narration.segments.some(
        (segment) => segment.tokenId === "deque-back"
      )
    ).toBe(true)
    expect(compareFrame.narration.reason?.segments[0]?.text).toContain(
      "A smaller-or-equal value behind the incoming index"
    )
    expect(compareFrame.narration.implication?.segments[0]?.text).toContain(
      "The next frame pops"
    )

    const commitFrame = runtime.frames.find((frame) => frame.codeLine === "L13")
    if (!commitFrame) {
      throw new Error("Expected a sliding window commit frame.")
    }

    expect(
      commitFrame.narration.segments.some(
        (segment) => segment.tokenId === "deque-front"
      )
    ).toBe(true)
    expect(commitFrame.narration.reason?.segments[0]?.text).toContain(
      "The deque stores candidates in decreasing value order"
    )
    expect(commitFrame.narration.implication?.segments[0]?.text).toContain(
      "The result list grows by one"
    )
  })

  it("projects graph bfs current and neighbor tokens across graph, queue, state, and narration", () => {
    const graphBfsApproach = graphBfsLesson.approaches[0]
    const reachPreset = graphBfsApproach?.presets.find(
      (preset) => preset.id === "reach-f"
    )

    if (!graphBfsApproach || !reachPreset) {
      throw new Error("Graph BFS lesson fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: graphBfsLesson,
      approach: graphBfsApproach,
      mode: "full",
      rawInput: reachPreset.rawInput,
    })

    const frontierFrame = runtime.frames.find((frame) => frame.codeLine === "L3")
    const frontierQueue = frontierFrame?.primitives.find(
      (primitive) => primitive.id === "frontier-queue"
    )

    if (!frontierFrame || !frontierQueue || frontierQueue.kind !== "queue") {
      throw new Error("Expected a Graph BFS frontier queue on the loop-check frame.")
    }

    const typedFrontierQueue = frontierQueue as QueuePrimitiveFrameState
    expect(typedFrontierQueue.data.items[0]).toMatchObject({
      tokenId: "current",
      tokenLabel: "current",
      tokenStyle: "accent-1",
    })

    const enqueueFrame = runtime.frames.find((frame) => frame.codeLine === "L9")
    const graphPrimitive = enqueueFrame?.primitives.find(
      (primitive) => primitive.id === "graph"
    )
    const enqueueQueue = enqueueFrame?.primitives.find(
      (primitive) => primitive.id === "frontier-queue"
    )
    const statePrimitive = enqueueFrame?.primitives.find(
      (primitive) => primitive.id === "frontier-state"
    )

    if (!enqueueFrame || !graphPrimitive || graphPrimitive.kind !== "graph") {
      throw new Error("Expected a Graph BFS graph primitive on the enqueue frame.")
    }

    if (!enqueueQueue || enqueueQueue.kind !== "queue") {
      throw new Error("Expected a Graph BFS queue primitive on the enqueue frame.")
    }

    if (!statePrimitive || statePrimitive.kind !== "state") {
      throw new Error("Expected a Graph BFS state primitive on the enqueue frame.")
    }

    const typedGraphPrimitive = graphPrimitive as GraphPrimitiveFrameState
    const typedQueuePrimitive = enqueueQueue as QueuePrimitiveFrameState
    const typedStatePrimitive = statePrimitive as StatePrimitiveFrameState

    expect(
      typedGraphPrimitive.data.nodes.find((node) => node.tokenId === "current")
    ).toMatchObject({
      tokenLabel: "current",
      tokenStyle: "accent-1",
    })
    expect(
      typedGraphPrimitive.data.nodes.find((node) => node.tokenId === "neighbor")
    ).toMatchObject({
      tokenLabel: "neighbor",
      tokenStyle: "accent-3",
    })
    expect(
      typedQueuePrimitive.data.items.find((item) => item.tokenId === "neighbor")
    ).toMatchObject({
      tokenLabel: "neighbor",
      tokenStyle: "accent-3",
    })
    expect(
      typedStatePrimitive.data.values.find((entry) => entry.label === "current")
    ).toMatchObject({
      tokenId: "current",
      tokenStyle: "accent-1",
    })
    expect(
      typedStatePrimitive.data.values.find((entry) => entry.label === "neighbor")
    ).toMatchObject({
      tokenId: "neighbor",
      tokenStyle: "accent-3",
    })
    expect(
      enqueueFrame.narration.segments.some(
        (segment) => segment.tokenId === "current"
      )
    ).toBe(true)
    expect(
      enqueueFrame.narration.segments.some(
        (segment) => segment.tokenId === "neighbor"
      )
    ).toBe(true)

    const tokenSources = collectFrameExecutionTokens(enqueueFrame)
    expect(tokenSources.find((token) => token.id === "current")?.sources).toEqual(
      expect.arrayContaining(["graph", "state", "narration"])
    )
    expect(tokenSources.find((token) => token.id === "neighbor")?.sources).toEqual(
      expect.arrayContaining(["graph", "queue", "state", "narration"])
    )
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
