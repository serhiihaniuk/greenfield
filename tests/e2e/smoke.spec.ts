import { expect, test, type Page } from "@playwright/test"
import {
  customInputEditor,
  expectRuntimeReady,
  openCustomInput,
  selectFooterOption,
  timelineSlider,
} from "./helpers/player"

test("loads the real lesson runtime and opens lesson audit", async ({ page }) => {
  await page.goto("/")

  await expectRuntimeReady(page, "Search Interval", "State")

  await page.getByRole("button", { name: /audit/i }).click()

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

test("shows preset detail context before applying a scenario", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("button", { name: "Open preset studio" }).click()

  const dialog = page.getByRole("dialog", { name: "Preset Studio" })
  await expect(dialog).toBeVisible()
  await dialog.getByText("Not Found", { exact: true }).click()

  await expect(dialog.getByText("What makes it special", { exact: true })).toBeVisible()
  await expect(dialog.getByText(/The search exhausts the interval and returns -1/i).first()).toBeVisible()
})

test("surfaces custom input parse failures in the live runtime", async ({ page }) => {
  await page.goto("/")

  await openCustomInput(page)
  await customInputEditor(page).fill("{")
  await page.getByRole("button", { name: /apply custom input/i }).click()

  await expect(
    page.getByText(/Binary search input must be valid JSON/i)
  ).toBeVisible()
  await expect(page.getByText(/Runtime failure/i)).toBeVisible()
})

test("navigates frames from lesson audit controls", async ({ page }) => {
  await page.goto("/")

  await expectRuntimeReady(page, "Search Interval", "State")
  await page.getByRole("button", { name: /audit/i }).click()

  const timeline = timelineSlider(page)
  await expect(timeline).toHaveValue("0")

  await page.getByRole("button", { name: "Inspect next frame", exact: true }).click()
  await expect(timeline).toHaveValue("1")

  await page.getByRole("button", { name: "Inspect previous frame", exact: true }).click()
  await expect(timeline).toHaveValue("0")
})

test("audits the live runtime through the audit timeline and primitive focus controls", async ({
  page,
}) => {
  await page.goto("/")

  await selectFooterOption(page, "Lesson", "Tree DFS Traversal with Stack")
  await expectRuntimeReady(page, "Traversal Tree", "DFS Stack")
  await page.getByRole("button", { name: /audit/i }).click()

  await expect(page.getByText("Issue Inbox", { exact: true })).toBeVisible()
  await expect(page.getByText("Event Timeline", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /^warnings /i })).toBeVisible()

  await page.getByRole("button", { name: "Focus primitive", exact: true }).first().click()
  await expect(page.locator("[data-selected-primitive='true']").first()).toBeVisible()

  const timeline = timelineSlider(page)
  await expect(timeline).toHaveValue("0")

  await page.getByRole("button", { name: "Inspect", exact: true }).first().click()
  await expect(timeline).toHaveValue("1")
})

test("opens task search through the command palette hotkey", async ({ page }) => {
  await page.goto("/")
  await expectRuntimeReady(page, "Search Interval", "State")

  await page.keyboard.press("Control+k")
  const dialog = page.getByRole("dialog", { name: "Command Palette" })
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder(/search tasks, playback, audit, and workspace actions/i).fill("House Robber")
  await dialog.getByText("House Robber", { exact: true }).click()

  await expectRuntimeReady(page, "House Values", "DP State")
})

test("ignores global shortcuts while editing custom input", async ({ page }) => {
  await page.goto("/")
  await expectRuntimeReady(page, "Search Interval", "State")

  await openCustomInput(page)
  await customInputEditor(page).fill("{}")

  const timeline = timelineSlider(page)
  await expect(timeline).toHaveValue("0")

  await page.keyboard.press("Q")
  await page.keyboard.press("W")
  await page.keyboard.press("Control+k")

  await expect(customInputEditor(page)).toBeFocused()
  await expect(timeline).toHaveValue("0")
  await expect(page.getByTestId("author-review-drawer")).toHaveCount(0)
  await expect(page.getByRole("dialog", { name: "Command Palette" })).toHaveCount(0)
})
