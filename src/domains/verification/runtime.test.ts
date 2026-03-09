import { buildLessonRuntime } from "@/features/player/runtime"
import { verifyRuntimeOutputs } from "@/domains/verification/runtime"
import { binarySearchLesson } from "../../../content/lessons/binary-search/lesson"
import { houseRobberLesson } from "../../../content/lessons/house-robber/lesson"
import type { StatePrimitiveFrameState } from "@/entities/visualization/primitives"

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
})
