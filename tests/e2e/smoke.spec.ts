import { expect, test } from "@playwright/test"

test("renders the phase 1 scaffold", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", {
      name: /greenfield visualization runtime scaffold/i,
    })
  ).toBeVisible()
})
