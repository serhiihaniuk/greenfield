import { describe, expect, it } from "vitest"

import { createLessonPlayerStore } from "@/features/player/store"

const customInputMatrix = [
  {
    lessonId: "binary-search",
    rawInput: JSON.stringify({
      nums: [10, 20, 30, 42],
      target: 42,
    }),
  },
  {
    lessonId: "house-robber",
    rawInput: JSON.stringify({
      nums: [21, 1, 34],
    }),
  },
  {
    lessonId: "maximum-depth",
    rawInput: JSON.stringify({
      values: [41, 19, 63, 88],
    }),
  },
  {
    lessonId: "rotting-oranges",
    rawInput: JSON.stringify({
      grid: [
        [2, 1, 1],
        [1, 1, 0],
        [0, 1, 1],
      ],
    }),
  },
  {
    lessonId: "graph-bfs",
    rawInput: JSON.stringify({
      nodes: [
        { id: "S", x: 88, y: 140 },
        { id: "A", x: 220, y: 92 },
        { id: "ZQ", x: 352, y: 140 },
      ],
      edges: [
        { sourceId: "S", targetId: "A" },
        { sourceId: "A", targetId: "ZQ" },
      ],
      startId: "S",
      targetId: "ZQ",
    }),
  },
  {
    lessonId: "sliding-window-maximum",
    rawInput: JSON.stringify({
      nums: [14, 2, 26, 4],
      k: 2,
    }),
  },
  {
    lessonId: "coin-change",
    rawInput: JSON.stringify({
      coins: [5, 11],
      amount: 22,
    }),
  },
  {
    lessonId: "heap-top-k",
    rawInput: JSON.stringify({
      nums: [17, 3, 25, 1],
      k: 2,
    }),
  },
  {
    lessonId: "tree-dfs-traversal",
    rawInput: JSON.stringify({
      values: [21, 13, 34, null, 18],
    }),
  },
] as const

describe("lesson player store", () => {
  it("loads the binary search lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("binary-search")

    const state = store.getState()
    expect(state.lesson?.id).toBe("binary-search")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("loads the house robber lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("house-robber")

    const state = store.getState()
    expect(state.lesson?.id).toBe("house-robber")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("loads the coin change lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("coin-change")

    const state = store.getState()
    expect(state.lesson?.id).toBe("coin-change")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("loads the blocked coin change preset without runtime failure", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("coin-change")
    store.getState().selectPreset("blocked-seven")

    const state = store.getState()
    expect(state.lesson?.id).toBe("coin-change")
    expect(state.selectedPresetId).toBe("blocked-seven")
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
    expect(state.verification?.isValid).toBe(true)
  })

  it("loads the graph bfs lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("graph-bfs")

    const state = store.getState()
    expect(state.lesson?.id).toBe("graph-bfs")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("loads the heap top-k lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("heap-top-k")

    const state = store.getState()
    expect(state.lesson?.id).toBe("heap-top-k")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("loads the maximum depth lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("maximum-depth")

    const state = store.getState()
    expect(state.lesson?.id).toBe("maximum-depth")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("loads the rotting oranges lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("rotting-oranges")

    const state = store.getState()
    expect(state.lesson?.id).toBe("rotting-oranges")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("loads the sliding window maximum lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("sliding-window-maximum")

    const state = store.getState()
    expect(state.lesson?.id).toBe("sliding-window-maximum")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("loads the tree dfs traversal lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("tree-dfs-traversal")

    const state = store.getState()
    expect(state.lesson?.id).toBe("tree-dfs-traversal")
    expect(state.trace.length).toBeGreaterThan(0)
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.failure).toBeUndefined()
  })

  it("rebuilds from custom input without a page reload", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("binary-search")
    store.getState().setRawInput(
      JSON.stringify({
        nums: [4, 8, 12, 16],
        target: 16,
      })
    )
    store.getState().applyCustomInput()

    const state = store.getState()
    expect(state.inputSource).toBe("custom")
    expect(state.frames.length).toBeGreaterThan(0)
    expect(state.currentFrameIndex).toBe(0)
    expect(state.failure).toBeUndefined()
  })

  for (const entry of customInputMatrix) {
    it(`accepts valid custom input for ${entry.lessonId}`, () => {
      const store = createLessonPlayerStore()
      store.getState().initialize(entry.lessonId)

      store.getState().setRawInput(entry.rawInput)
      store.getState().applyCustomInput()

      const state = store.getState()
      expect(state.lesson?.id).toBe(entry.lessonId)
      expect(state.inputSource).toBe("custom")
      expect(state.rawInput).toBe(entry.rawInput)
      expect(state.parsedInput).toEqual(JSON.parse(entry.rawInput))
      expect(state.frames.length).toBeGreaterThan(0)
      expect(state.currentFrameIndex).toBe(0)
      expect(state.failure).toBeUndefined()
      expect(state.verification?.isValid).toBe(true)
    })
  }
})
