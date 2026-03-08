import { expect, test } from "@playwright/test"

import {
  expectNoVerticalPageScroll,
  expectPrimitiveCanvasFits,
  expectNoVerticalRegionOverflow,
  expectRegionMinHeight,
  expectRuntimeReady,
  primitiveRegion,
  selectFooterOption,
  testRegion,
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

const denseViewportMatrix = [
  {
    lesson: "Coin Change Memo DFS",
    preset: "Blocked Seven",
    primaryHeading: "Execution Tree",
    secondaryHeading: "Call Stack",
  },
  {
    lesson: "Maximum Depth of Binary Tree",
    preset: "Left Heavy",
    primaryHeading: "Binary Tree",
    secondaryHeading: "Call Stack",
  },
  {
    lesson: "Top K Largest with Min Heap",
    preset: "Skip Small Tail",
    primaryHeading: "Min Heap",
    secondaryHeading: "Input Scan",
  },
] as const

test("keeps dense presets inside stage and context regions on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  for (const entry of denseViewportMatrix) {
    await selectFooterOption(page, "Lesson", entry.lesson)
    await selectFooterOption(page, "Preset", entry.preset)
    await expectRuntimeReady(page, entry.primaryHeading, entry.secondaryHeading)
    await expectNoVerticalPageScroll(page)
    await expectNoVerticalRegionOverflow(page, "stage-scroll-region")
    await expectNoVerticalRegionOverflow(page, "support-column")
    await expectRegionMinHeight(page, "reference-column", 120)
  }
})

test("keeps synchronized secondary visuals inside the stage instead of the support column", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  await selectFooterOption(page, "Lesson", "Tree DFS Traversal with Stack")
  await expectRuntimeReady(page, "Traversal Tree", "DFS Stack")

  await expect(
    testRegion(page, "stage-secondary-region").getByRole("heading", {
      name: "DFS Stack",
      exact: true,
    })
  ).toBeVisible()
  await expect(
    testRegion(page, "stage-secondary-region").getByRole("heading", {
      name: "Preorder Output",
      exact: true,
    })
  ).toBeVisible()
})

test("keeps compact code-state panels in the support column", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  await expectRuntimeReady(page, "Search Interval", "State")

  await expect(
    testRegion(page, "support-primitives-region").getByRole("heading", {
      name: "State",
      exact: true,
    })
  ).toBeVisible()
})

test("keeps the author drawer docked without forcing page scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  await selectFooterOption(page, "Lesson", "Coin Change Memo DFS")
  await selectFooterOption(page, "Preset", "Blocked Seven")
  await expectRuntimeReady(page, "Execution Tree", "Call Stack")

  await page.getByRole("button", { name: /author/i }).click()

  await expect(testRegion(page, "author-review-drawer")).toBeVisible()
  await expectNoVerticalPageScroll(page)
})

test("keeps tall primary primitive canvases fully visible inside their shells", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  await selectFooterOption(page, "Lesson", "Coin Change Memo DFS")
  await selectFooterOption(page, "Preset", "Blocked Seven")
  await expectRuntimeReady(page, "Execution Tree", "Call Stack")
  await expect(primitiveRegion(page, "execution-tree")).toBeVisible()
  await expectPrimitiveCanvasFits(page, "execution-tree-canvas")

  await selectFooterOption(page, "Lesson", "Maximum Depth of Binary Tree")
  await selectFooterOption(page, "Preset", "Left Heavy")
  await expectRuntimeReady(page, "Binary Tree", "Call Stack")
  await expect(primitiveRegion(page, "tree")).toBeVisible()
  await expectPrimitiveCanvasFits(page, "tree-canvas")

  await selectFooterOption(page, "Lesson", "Top K Largest with Min Heap")
  await selectFooterOption(page, "Preset", "Skip Small Tail")
  await expectRuntimeReady(page, "Min Heap", "Input Scan")
  await expect(primitiveRegion(page, "min-heap")).toBeVisible()
  await expectPrimitiveCanvasFits(page, "min-heap-canvas")
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
