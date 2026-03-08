import { describe, expect, it } from "vitest"

import { createLessonPlayerStore } from "@/features/player/store"

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

  it("loads the graph bfs lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("graph-bfs")

    const state = store.getState()
    expect(state.lesson?.id).toBe("graph-bfs")
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

  it("loads the sliding window maximum lesson end to end", () => {
    const store = createLessonPlayerStore()
    store.getState().initialize("sliding-window-maximum")

    const state = store.getState()
    expect(state.lesson?.id).toBe("sliding-window-maximum")
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
})
