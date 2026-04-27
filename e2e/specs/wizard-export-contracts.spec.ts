import { expect, test, type Page } from "@playwright/test";

import {
  mockDownloadNonPdf,
  mockDownloadSuccessFalse,
  mockParseSuccess,
  mockTailorSuccess,
} from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { fillJdAndGenerate, uploadResumeFromText } from "../helpers/wizard-actions";

async function openExportPage(page: Page) {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);
  await page.getByRole("button", { name: "Go to export" }).click();
  await expect(page).toHaveURL(/\/resume\/export/);
}

test("export shows error when download returns 200 with success false envelope", async ({ page }) => {
  await openExportPage(page);
  await mockDownloadSuccessFalse(page, "Download contract failed");

  await page.getByRole("button", { name: "Download PDF" }).click();
  await expect(page.getByText("Export issue")).toBeVisible();
  await expect(page.getByText("Download contract failed")).toBeVisible();
});

test("export shows error when download returns non-PDF content", async ({ page }) => {
  await openExportPage(page);
  await mockDownloadNonPdf(page);

  await page.getByRole("button", { name: "Download PDF" }).click();
  await expect(page.getByText("Export issue")).toBeVisible();
});
