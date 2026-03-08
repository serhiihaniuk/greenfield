import { expect, test } from "@playwright/test"

import {
  applyCustomInput,
  expectRuntimeReady,
  selectFooterOption,
} from "./helpers/player"

const customInputMatrix = [
  {
    lesson: "Binary Search",
    primaryHeading: "Search Interval",
    secondaryHeading: "State",
    expectedVisibleText: "42",
    rawInput: JSON.stringify(
      {
        nums: [10, 20, 30, 42],
        target: 42,
      },
      null,
      2
    ),
  },
  {
    lesson: "House Robber",
    primaryHeading: "House Values",
    secondaryHeading: "DP State",
    expectedVisibleText: "34",
    rawInput: JSON.stringify(
      {
        nums: [21, 1, 34],
      },
      null,
      2
    ),
  },
  {
    lesson: "Maximum Depth of Binary Tree",
    primaryHeading: "Binary Tree",
    secondaryHeading: "Call Stack",
    expectedVisibleText: "88",
    rawInput: JSON.stringify(
      {
        values: [41, 19, 63, 88],
      },
      null,
      2
    ),
  },
  {
    lesson: "Graph BFS Frontier",
    primaryHeading: "Graph Frontier",
    secondaryHeading: "Frontier Queue",
    expectedVisibleText: "ZQ",
    rawInput: JSON.stringify(
      {
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
      },
      null,
      2
    ),
  },
  {
    lesson: "Sliding Window Maximum",
    primaryHeading: "Sliding Window",
    secondaryHeading: "Monotonic Deque",
    expectedVisibleText: "26",
    rawInput: JSON.stringify(
      {
        nums: [14, 2, 26, 4],
        k: 2,
      },
      null,
      2
    ),
  },
  {
    lesson: "Coin Change Memo DFS",
    primaryHeading: "Execution Tree",
    secondaryHeading: "Call Stack",
    expectedVisibleText: "22",
    rawInput: JSON.stringify(
      {
        coins: [5, 11],
        amount: 22,
      },
      null,
      2
    ),
  },
  {
    lesson: "Top K Largest with Min Heap",
    primaryHeading: "Min Heap",
    secondaryHeading: "Input Scan",
    expectedVisibleText: "25",
    rawInput: JSON.stringify(
      {
        nums: [17, 3, 25, 1],
        k: 2,
      },
      null,
      2
    ),
  },
  {
    lesson: "Tree DFS Traversal with Stack",
    primaryHeading: "Traversal Tree",
    secondaryHeading: "DFS Stack",
    expectedVisibleText: "34",
    rawInput: JSON.stringify(
      {
        values: [21, 13, 34, null, 18],
      },
      null,
      2
    ),
  },
] as const

for (const entry of customInputMatrix) {
  test(`replays valid custom input for ${entry.lesson}`, async ({ page }) => {
    await page.goto("/")

    if (entry.lesson !== "Binary Search") {
      await selectFooterOption(page, "Lesson", entry.lesson)
    }

    await expectRuntimeReady(page, entry.primaryHeading, entry.secondaryHeading)

    await applyCustomInput(page, entry.rawInput)
    await expect(page.getByText(/Runtime failure/i)).toHaveCount(0)
    await expect(page.getByText("custom", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Close custom input", exact: true }).click()

    await expectRuntimeReady(page, entry.primaryHeading, entry.secondaryHeading)
    await expect(
      page.getByText(entry.expectedVisibleText, { exact: true }).first()
    ).toBeVisible()
  })
}
