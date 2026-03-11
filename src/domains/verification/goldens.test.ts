import { readFileSync } from "node:fs"
import path from "node:path"

import {
  compareRuntimeGoldenSnapshots,
  createRuntimeGoldenSnapshot,
  type RuntimeGoldenSnapshot,
} from "@/domains/verification/goldens"
import { buildLessonRuntime } from "@/features/player/runtime"
import { binarySearchLesson } from "../../../content/lessons/binary-search/lesson"
import { coinChangeLesson } from "../../../content/lessons/coin-change/lesson"
import { graphBfsLesson } from "../../../content/lessons/graph-bfs/lesson"
import { heapTopKLesson } from "../../../content/lessons/heap-top-k/lesson"
import { houseRobberLesson } from "../../../content/lessons/house-robber/lesson"
import { maximumDepthLesson } from "../../../content/lessons/maximum-depth/lesson"
import { rottingOrangesLesson } from "../../../content/lessons/rotting-oranges/lesson"
import { slidingWindowMaximumLesson } from "../../../content/lessons/sliding-window-maximum/lesson"
import { treeDfsTraversalLesson } from "../../../content/lessons/tree-dfs-traversal/lesson"

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
      mode: "full",
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
      mode: "full",
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

  it("matches the checked-in coin-change focus golden", () => {
    const approach = coinChangeLesson.approaches[0]
    const preset = approach?.presets.find((entry) => entry.id === "reuse-six")

    if (!approach || !preset) {
      throw new Error("Coin change golden fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: coinChangeLesson,
      approach,
      mode: "full",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/coin-change/approaches/memo-dfs/goldens/focus-reuse-six.json"
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
      mode: "full",
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

  it("matches the checked-in heap-top-k focus golden", () => {
    const approach = heapTopKLesson.approaches[0]
    const preset = approach?.presets.find(
      (entry) => entry.id === "classic-six-k3"
    )

    if (!approach || !preset) {
      throw new Error("Heap top-k golden fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: heapTopKLesson,
      approach,
      mode: "full",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/heap-top-k/approaches/min-heap/goldens/focus-classic-six-k3.json"
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
      mode: "full",
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
      mode: "full",
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

  it("matches the checked-in rotting-oranges focus golden", () => {
    const approach = rottingOrangesLesson.approaches[0]
    const preset = approach?.presets.find((entry) => entry.id === "classic-wave")

    if (!approach || !preset) {
      throw new Error("Rotting oranges golden fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: rottingOrangesLesson,
      approach,
      mode: "full",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/rotting-oranges/approaches/multi-source-bfs/goldens/focus-classic-wave.json"
        ),
        "utf8"
      )
    ) as RuntimeGoldenSnapshot

    const comparison = compareRuntimeGoldenSnapshots(actual, expected)

    expect(comparison.matches).toBe(true)
    expect(comparison.differences).toEqual([])
  })

  it("matches the checked-in tree-dfs-traversal focus golden", () => {
    const approach = treeDfsTraversalLesson.approaches[0]
    const preset = approach?.presets.find(
      (entry) => entry.id === "balanced-six"
    )

    if (!approach || !preset) {
      throw new Error("Tree DFS traversal golden fixture is not available.")
    }

    const runtime = buildLessonRuntime({
      lesson: treeDfsTraversalLesson,
      approach,
      mode: "full",
      rawInput: preset.rawInput,
    })
    const actual = createRuntimeGoldenSnapshot(runtime.trace, runtime.frames)
    const expected = JSON.parse(
      readFileSync(
        path.resolve(
          process.cwd(),
          "content/lessons/tree-dfs-traversal/approaches/iterative-stack/goldens/focus-balanced-six.json"
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
