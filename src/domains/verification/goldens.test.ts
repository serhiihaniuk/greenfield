import { readFileSync } from "node:fs"
import path from "node:path"

import {
  compareRuntimeGoldenSnapshots,
  createRuntimeGoldenSnapshot,
  type RuntimeGoldenSnapshot,
} from "@/domains/verification/goldens"
import { buildLessonRuntime } from "@/features/player/runtime"
import { binarySearchLesson } from "../../../content/lessons/binary-search/lesson"
import { graphBfsLesson } from "../../../content/lessons/graph-bfs/lesson"
import { houseRobberLesson } from "../../../content/lessons/house-robber/lesson"
import { maximumDepthLesson } from "../../../content/lessons/maximum-depth/lesson"
import { slidingWindowMaximumLesson } from "../../../content/lessons/sliding-window-maximum/lesson"

describe("runtime goldens", () => {
  it("matches the checked-in binary-search focus golden", () => {
    const approach = binarySearchLesson.approaches[0]
    const preset = approach?.presets.find(
      (entry) => entry.id === "found-middle"
    )

    if (!approach || !preset) {
      throw new Error("Binary search golden fixture is not available.")
    }

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

  it("matches the checked-in house-robber focus golden", () => {
    const approach = houseRobberLesson.approaches[0]
    const preset = approach?.presets.find(
      (entry) => entry.id === "classic-five"
    )

    if (!approach || !preset) {
      throw new Error("House robber golden fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: houseRobberLesson,
      approach,
      mode: "focus",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/house-robber/approaches/rolling-dp/goldens/focus-classic-five.json"
        ),
        "utf8"
      )
    ) as RuntimeGoldenSnapshot

    const comparison = compareRuntimeGoldenSnapshots(actual, expected)

    expect(comparison.matches).toBe(true)
    expect(comparison.differences).toEqual([])
  })

  it("matches the checked-in graph-bfs focus golden", () => {
    const approach = graphBfsLesson.approaches[0]
    const preset = approach?.presets.find((entry) => entry.id === "reach-f")

    if (!approach || !preset) {
      throw new Error("Graph BFS golden fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: graphBfsLesson,
      approach,
      mode: "focus",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/graph-bfs/approaches/queue-bfs/goldens/focus-reach-f.json"
        ),
        "utf8"
      )
    ) as RuntimeGoldenSnapshot

    const comparison = compareRuntimeGoldenSnapshots(actual, expected)

    expect(comparison.matches).toBe(true)
    expect(comparison.differences).toEqual([])
  })

  it("matches the checked-in maximum-depth focus golden", () => {
    const approach = maximumDepthLesson.approaches[0]
    const preset = approach?.presets.find(
      (entry) => entry.id === "balanced-five"
    )

    if (!approach || !preset) {
      throw new Error("Maximum depth golden fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: maximumDepthLesson,
      approach,
      mode: "focus",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/maximum-depth/approaches/recursive-dfs/goldens/focus-balanced-five.json"
        ),
        "utf8"
      )
    ) as RuntimeGoldenSnapshot

    const comparison = compareRuntimeGoldenSnapshots(actual, expected)

    expect(comparison.matches).toBe(true)
    expect(comparison.differences).toEqual([])
  })

  it("matches the checked-in sliding-window-maximum focus golden", () => {
    const approach = slidingWindowMaximumLesson.approaches[0]
    const preset = approach?.presets.find(
      (entry) => entry.id === "classic-five"
    )

    if (!approach || !preset) {
      throw new Error("Sliding window maximum golden fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: slidingWindowMaximumLesson,
      approach,
      mode: "focus",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/sliding-window-maximum/approaches/monotonic-deque/goldens/focus-classic-five.json"
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
