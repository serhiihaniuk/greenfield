import { expect, type Locator, type Page } from "@playwright/test"

export async function selectFooterOption(
  page: Page,
  label: string,
  option: string
) {
  await page.getByRole("combobox", { name: label, exact: true }).click()
  await page.getByRole("option", { name: option, exact: true }).click()
}

export async function openCustomInput(page: Page) {
  await page.getByRole("button", { name: "Custom input", exact: true }).click()
}

export function customInputEditor(page: Page): Locator {
  return page.getByLabel("Custom input editor", { exact: true })
}

export function timelineSlider(page: Page): Locator {
  return page.getByLabel("Timeline", { exact: true })
}

export async function expectRuntimeReady(
  page: Page,
  primaryHeading: string,
  secondaryHeading: string
) {
  await expect(
    page.getByRole("button", { name: "Play", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: primaryHeading, exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: secondaryHeading, exact: true })
  ).toBeVisible()
  await expect(page.getByText(/Runtime failure/i)).toHaveCount(0)
}

export async function expectNoVerticalPageScroll(page: Page) {
  const metrics = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    docHeight: document.documentElement.scrollHeight,
  }))

  expect(metrics.docHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1)
}
