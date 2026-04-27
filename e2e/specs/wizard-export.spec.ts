import { expect, test } from "@playwright/test";

import {
  mockDownloadError,
  mockDownloadSuccess,
  mockParseSuccess,
  mockTailorSuccess,
} from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { fillJdAndGenerate, uploadResumeFromText } from "../helpers/wizard-actions";

test("shows export error when download fails", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await mockDownloadError(page, "PDF service unavailable");

  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);

  await page.getByRole("button", { name: "Go to export" }).click();
  await expect(page).toHaveURL(/\/resume\/export/);
  await page.getByRole("button", { name: "Download PDF" }).click();
  await expect(page.getByText("Export issue")).toBeVisible();
});

test("downloads pdf from export panel", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await mockDownloadSuccess(page, "resume.pdf");

  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);
  await page.getByRole("button", { name: "Go to export" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("Saurav+Kumar+Meta+Frontend+Engineer+Menlo+Park.pdf");
});
