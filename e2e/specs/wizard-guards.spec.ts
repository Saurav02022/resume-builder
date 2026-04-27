import { expect, test } from "@playwright/test";

test("redirects /resume/review to upload when wizard state is empty (no resume, no tailor)", async ({
  page,
}) => {
  await page.goto("/resume/review");
  await expect(page).toHaveURL(/\/resume\/upload/);
});

test("redirects /resume/export to upload when wizard state is empty (no resume, no tailor)", async ({
  page,
}) => {
  await page.goto("/resume/export");
  await expect(page).toHaveURL(/\/resume\/upload/);
});

test("redirects /resume/job to /resume/upload when no parsed resume", async ({ page }) => {
  await page.goto("/resume/job");
  await expect(page).toHaveURL(/\/resume\/upload/);
});
