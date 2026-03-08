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
  await expect(customInputDialog(page)).toBeVisible()
}

export async function applyCustomInput(page: Page, rawInput: string) {
  await openCustomInput(page)
  await customInputEditor(page).fill(rawInput)
  await customInputDialog(page)
    .getByRole("button", { name: "Apply", exact: true })
    .press("Enter")
}

export function customInputDialog(page: Page): Locator {
  return page.getByRole("dialog", { name: "Custom Input", exact: true })
}

export async function closeCustomInput(page: Page) {
  await page.keyboard.press("Escape")
  await expect(customInputDialog(page)).toBeHidden()
}

export function customInputEditor(page: Page): Locator {
  return customInputDialog(page).getByLabel("Custom input editor", { exact: true })
}

export function timelineSlider(page: Page): Locator {
  return page.getByLabel("Timeline", { exact: true })
}

export function testRegion(page: Page, testId: string): Locator {
  return page.getByTestId(testId)
}

export function primitiveRegion(page: Page, primitiveId: string): Locator {
  return testRegion(page, `primitive-${primitiveId}`)
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

export async function expectNoVerticalRegionOverflow(
  page: Page,
  testId: string,
  tolerance = 1
) {
  const region = testRegion(page, testId)
  await expect(region).toBeVisible()

  const metrics = await region.evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }))

  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + tolerance)
}

export async function expectRegionMinHeight(
  page: Page,
  testId: string,
  minimumHeight: number
) {
  const region = testRegion(page, testId)
  await expect(region).toBeVisible()

  const metrics = await region.evaluate((node) => ({
    clientHeight: node.clientHeight,
  }))

  expect(metrics.clientHeight).toBeGreaterThanOrEqual(minimumHeight)
}

export async function expectPrimitiveCanvasFits(
  page: Page,
  canvasTestId: string,
  tolerance = 1
) {
  const region = testRegion(page, canvasTestId)
  await expect(region).toBeVisible()

  const metrics = await region.evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }))

  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.clientHeight + tolerance)
}
