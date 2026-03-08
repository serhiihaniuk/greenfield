import { expect, test, type Page } from "@playwright/test"

async function selectOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click()
  await page.getByRole("option", { name: option }).click()
}

test("loads the real lesson runtime and opens author review", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Search Interval", exact: true })
  ).toBeVisible()

  await page.getByRole("button", { name: /author/i }).click()

  await expect(page.getByText("Execution Context", { exact: true })).toBeVisible()
  await expect(page.getByText("Frame Contract", { exact: true })).toBeVisible()
})

test("switches lessons and presets through the footer controls", async ({ page }) => {
  await page.goto("/")

  await selectOption(page, "Lesson", "Graph BFS Frontier")
  await expect(
    page.getByRole("heading", { name: "Graph Frontier", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Frontier Queue", exact: true })
  ).toBeVisible()

  await selectOption(page, "Preset", "Blocked Z")
  await page.getByRole("button", { name: "Custom input" }).click()

  await expect(page.getByLabel("Custom input editor")).toContainText('"targetId": "Z"')
})

test("surfaces custom input parse failures in the live runtime", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("button", { name: "Custom input" }).click()
  await page.getByLabel("Custom input editor").fill("{")
  await page.getByRole("button", { name: /apply/i }).click()

  await expect(
    page.getByText(/Binary search input must be valid JSON/i)
  ).toBeVisible()
  await expect(page.getByText(/Runtime failure/i)).toBeVisible()
})
