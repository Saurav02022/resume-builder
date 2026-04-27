import { expect, test } from "@playwright/test";

import { mockParseSuccess, mockTailorDelayedSuccess } from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { uploadResumeFromText } from "../helpers/wizard-actions";

test("disables generate and shows loading while tailor request is in flight", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  const { requestCount } = await mockTailorDelayedSuccess(page, tailorData, 2500);
  await uploadResumeFromText(page, resumeText);

  await page.getByLabel("Posting text").fill(jdText);
  /** Same node; label changes to "Generating…" so locator must stay valid after click */
  const actionButton = page.getByRole("button", {
    name: /Start Tailoring|Update Tailoring|Generating/,
  });
  await actionButton.click();

  await expect(actionButton).toBeDisabled();
  await expect(actionButton).toHaveText(/Generating/);
  await expect(page).toHaveURL(/\/resume\/review/, { timeout: 15000 });
  expect(requestCount()).toBe(1);
});
