import { expect, test } from "@playwright/test";

test("home redirects to resume upload", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/resume\/upload$/);
});
