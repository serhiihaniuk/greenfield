import { readFileSync } from "node:fs"
import path from "node:path"

import {
  compareRuntimeGoldenSnapshots,
  createRuntimeGoldenSnapshot,
  type RuntimeGoldenSnapshot,
} from "@/domains/verification/goldens"
import { buildLessonRuntime } from "@/features/player/runtime"
import { binarySearchLesson } from "../../../content/lessons/binary-search/lesson"

describe("runtime goldens", () => {
  const approach = binarySearchLesson.approaches[0]
  const preset = approach?.presets.find((entry) => entry.id === "found-middle")

  if (!approach || !preset) {
    throw new Error("Binary search golden fixture is not available.")
  }

  it("matches the checked-in binary-search focus golden", () => {
    const runtime = buildLessonRuntime({
      lesson: binarySearchLesson,
      approach,
      mode: "focus",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/binary-search/approaches/iterative/goldens/focus-found-middle.json"
        ),
        "utf8"
      )
    ) as RuntimeGoldenSnapshot

    const comparison = compareRuntimeGoldenSnapshots(actual, expected)

    expect(comparison.matches).toBe(true)
    expect(comparison.differences).toEqual([])
  })

  it("reports a mismatch when a golden frame is altered", () => {
    const actual: RuntimeGoldenSnapshot = {
      trace: [],
      frames: [],
    }
    const expected: RuntimeGoldenSnapshot = {
      trace: [],
      frames: [
        {
          id: "frame-1",
          sourceEventId: "event-1",
          codeLine: "L1",
          visualChangeType: "mutate",
          narrationSummary: "Example",
          checks: [],
          primitives: [],
        },
      ],
    }

    const comparison = compareRuntimeGoldenSnapshots(actual, expected)

    expect(comparison.matches).toBe(false)
    expect(comparison.differences[0]).toContain("frame length mismatch")
  })
})
