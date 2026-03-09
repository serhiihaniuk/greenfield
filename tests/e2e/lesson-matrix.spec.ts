import { expect, test } from "@playwright/test"

import {
  customInputEditor,
  expectRuntimeReady,
  openCustomInput,
  selectFooterOption,
} from "./helpers/player"

const lessonMatrix = [
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
    primaryHeading: "Execution Tree",
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

for (const entry of lessonMatrix) {
  test(`renders flagship lesson: ${entry.lesson}`, async ({ page }) => {
    await page.goto("/")

    if (entry.lesson !== "Binary Search") {
      await selectFooterOption(page, "Lesson", entry.lesson)
    }

    await expectRuntimeReady(page, entry.primaryHeading, entry.secondaryHeading)
  })
}

const presetMatrix = [
  {
    lesson: "Coin Change Memo DFS",
    preset: "Blocked Seven",
    expectedSnippet: '"amount": 7',
    primaryHeading: "Execution Tree",
    secondaryHeading: "Memo Table",
  },
  {
    lesson: "Top K Largest with Min Heap",
    preset: "Skip Small Tail",
    expectedSnippet: '"k": 2',
    primaryHeading: "Min Heap",
    secondaryHeading: "Top-K State",
  },
  {
    lesson: "Maximum Depth of Binary Tree",
    preset: "Left Heavy",
    expectedSnippet: '"values": [',
    secondarySnippet: "4",
    primaryHeading: "Execution Tree",
    secondaryHeading: "Call Stack",
  },
  {
    lesson: "Tree DFS Traversal with Stack",
    preset: "Zigzag Five",
    expectedSnippet: '"values": [',
    secondarySnippet: "11",
    primaryHeading: "Traversal Tree",
    secondaryHeading: "DFS Stack",
  },
] as const

for (const entry of presetMatrix) {
  test(`applies alternate preset: ${entry.lesson} / ${entry.preset}`, async ({
    page,
  }) => {
    await page.goto("/")

    await selectFooterOption(page, "Lesson", entry.lesson)
    await selectFooterOption(page, "Preset", entry.preset)
    await expectRuntimeReady(page, entry.primaryHeading, entry.secondaryHeading)

    await openCustomInput(page)
    await expect(customInputEditor(page)).toContainText(entry.expectedSnippet)

    if ("secondarySnippet" in entry) {
      await expect(customInputEditor(page)).toContainText(entry.secondarySnippet)
    }
  })
}
