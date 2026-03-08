import { expect, test } from "@playwright/test"

import {
  expectNoVerticalPageScroll,
  expectRuntimeReady,
  selectFooterOption,
  timelineSlider,
} from "./helpers/player"

const desktopLessonMatrix = [
  {
    lesson: "Binary Search",
    primaryHeading: "Search Interval",
    secondaryHeading: "State",
  },
  {
    lesson: "House Robber",
    primaryHeading: "House Values",
    secondaryHeading: "DP State",
  },
  {
    lesson: "Maximum Depth of Binary Tree",
    primaryHeading: "Binary Tree",
    secondaryHeading: "Call Stack",
  },
  {
    lesson: "Graph BFS Frontier",
    primaryHeading: "Graph Frontier",
    secondaryHeading: "Frontier Queue",
  },
  {
    lesson: "Sliding Window Maximum",
    primaryHeading: "Sliding Window",
    secondaryHeading: "Monotonic Deque",
  },
  {
    lesson: "Coin Change Memo DFS",
    primaryHeading: "Execution Tree",
    secondaryHeading: "Call Stack",
  },
  {
    lesson: "Top K Largest with Min Heap",
    primaryHeading: "Min Heap",
    secondaryHeading: "Input Scan",
  },
  {
    lesson: "Tree DFS Traversal with Stack",
    primaryHeading: "Traversal Tree",
    secondaryHeading: "DFS Stack",
  },
] as const

test("keeps flagship presets inside the desktop page viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  for (const entry of desktopLessonMatrix) {
    if (entry.lesson !== "Binary Search") {
      await selectFooterOption(page, "Lesson", entry.lesson)
    }

    await expectRuntimeReady(page, entry.primaryHeading, entry.secondaryHeading)
    await expectNoVerticalPageScroll(page)
  }
})

test("supports deterministic stepping from pointer, slider, and keyboard controls", async ({
  page,
}) => {
  await page.goto("/")
  await expectRuntimeReady(page, "Search Interval", "State")

  const timeline = timelineSlider(page)
  await expect(timeline).toHaveValue("0")

  await page.getByRole("button", { name: "Next frame", exact: true }).click()
  await expect(timeline).toHaveValue("1")

  await page.keyboard.press("ArrowRight")
  await expect(timeline).toHaveValue("2")

  await page.keyboard.press("Home")
  await expect(timeline).toHaveValue("0")

  await page.keyboard.press("End")
  const maxTimelineValue = await timeline.evaluate(
    (input) => (input as HTMLInputElement).max
  )
  await expect(timeline).toHaveValue(maxTimelineValue)

  await page.getByRole("button", { name: "First frame", exact: true }).click()
  await expect(timeline).toHaveValue("0")

  const bounds = await timeline.boundingBox()
  if (!bounds) {
    throw new Error("Timeline slider is missing a visible bounding box.")
  }

  await page.mouse.click(bounds.x + bounds.width * 0.7, bounds.y + bounds.height / 2)

  const scrubbedValue = Number(
    await timeline.evaluate((input) => (input as HTMLInputElement).value)
  )

  expect(scrubbedValue).toBeGreaterThan(0)
  expect(scrubbedValue).toBeLessThan(Number(maxTimelineValue))
})
