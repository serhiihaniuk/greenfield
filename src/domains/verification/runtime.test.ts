import { buildLessonRuntime } from "@/features/player/runtime"
import { verifyRuntimeOutputs } from "@/domains/verification/runtime"
import { binarySearchLesson } from "../../../content/lessons/binary-search/lesson"

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

    const report = verifyRuntimeOutputs(binarySearchLesson, approach, runtime.trace, [
      {
        ...frame,
        codeLine: "L15",
        primitives: frame.primitives.filter(
          (primitive) => primitive.viewport?.role !== "primary"
        ),
      },
      ...runtime.frames.slice(1),
    ])

    expect(report.isValid).toBe(false)
    expect(report.errors.some((issue) => issue.code === "FRAME_EVENT_CODE_LINE_MISMATCH")).toBe(
      true
    )
    expect(report.errors.some((issue) => issue.code === "FRAME_PRIMARY_VIEW_MISSING")).toBe(
      true
    )
  })
})
