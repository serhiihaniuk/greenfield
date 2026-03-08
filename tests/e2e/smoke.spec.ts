import { expect, test, type Page } from "@playwright/test"
import {
  customInputEditor,
  expectRuntimeReady,
  openCustomInput,
  selectFooterOption,
  timelineSlider,
} from "./helpers/player"

test("loads the real lesson runtime and opens author review", async ({ page }) => {
  await page.goto("/")

  await expectRuntimeReady(page, "Search Interval", "State")

  await page.getByRole("button", { name: /author/i }).click()

  await expect(page.getByText("Execution Context", { exact: true })).toBeVisible()
  await expect(page.getByText("Frame Contract", { exact: true })).toBeVisible()
})

test("switches lessons and presets through the footer controls", async ({ page }) => {
  await page.goto("/")

  await selectFooterOption(page, "Lesson", "Graph BFS Frontier")
  await expectRuntimeReady(page, "Graph Frontier", "Frontier Queue")

  await selectFooterOption(page, "Preset", "Blocked Z")
  await openCustomInput(page)

  await expect(customInputEditor(page)).toContainText('"targetId": "Z"')
})

test("surfaces custom input parse failures in the live runtime", async ({ page }) => {
  await page.goto("/")

  await openCustomInput(page)
  await customInputEditor(page).fill("{")
  await page.getByRole("button", { name: /apply/i }).click()

  await expect(
    page.getByText(/Binary search input must be valid JSON/i)
  ).toBeVisible()
  await expect(page.getByText(/Runtime failure/i)).toBeVisible()
})

test("navigates frames from author review controls", async ({ page }) => {
  await page.goto("/")

  await expectRuntimeReady(page, "Search Interval", "State")
  await page.getByRole("button", { name: /author/i }).click()

  const timeline = timelineSlider(page)
  await expect(timeline).toHaveValue("0")

  await page.getByRole("button", { name: "Inspect next frame", exact: true }).click()
  await expect(timeline).toHaveValue("1")

  await page.getByRole("button", { name: "Inspect previous frame", exact: true }).click()
  await expect(timeline).toHaveValue("0")
})
