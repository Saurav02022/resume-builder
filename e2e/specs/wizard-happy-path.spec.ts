import { expect, test } from "@playwright/test";

import { mockDownloadSuccess, mockParseSuccess, mockTailorSuccess } from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { fillJdAndGenerate, uploadResumeFromText } from "../helpers/wizard-actions";

test("completes upload -> job -> review -> export flow", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await mockDownloadSuccess(page, "Saurav+Meta+Frontend+Engineer.pdf");

  await uploadResumeFromText(page, resumeText);
  await expect(page.getByText("Reference your resume & paste the role")).toBeVisible();

  await fillJdAndGenerate(page, jdText);
  await expect(page.getByRole("heading", { name: "Review what changed" })).toBeVisible();
  await expect(page.getByText("Meta tailored resume content")).toBeVisible();

  await page.getByRole("button", { name: "Go to export" }).click();
  await expect(page).toHaveURL(/\/resume\/export/);
  await expect(page.getByText("Saurav+Kumar+Meta+Frontend+Engineer+Menlo+Park.pdf")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("Saurav+Kumar+Meta+Frontend+Engineer+Menlo+Park.pdf");
});
