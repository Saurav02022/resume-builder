import { expect, test } from "@playwright/test";

import { mockParseSuccess, mockTailorSuccess } from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { fillJdAndGenerate, uploadResumeFromText } from "../helpers/wizard-actions";

test("review: switches between LaTeX preview and analytics sub-steps", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);

  await expect(page.getByRole("heading", { name: "Review what changed" })).toBeVisible();
  await expect(page.getByText("Meta tailored resume content")).toBeVisible();

  await page.getByRole("button", { name: "Analytics & tips", exact: true }).click();
  await expect(page).toHaveURL(/\/resume\/review\?step=analysis/);
  await expect(page.getByText("Before tailoring", { exact: false })).toBeVisible();

  await page.getByRole("button", { name: "Tailored LaTeX Code" }).click();
  await expect(page).toHaveURL(/\/resume\/review$/);
  await expect(page.getByText("Meta tailored resume content")).toBeVisible();
});

test("review: Continue to analytics CTA from diff view", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);

  await page.getByRole("button", { name: "Continue to analytics & tips" }).click();
  await expect(page).toHaveURL(/\/resume\/review\?step=analysis/);
});

test("review: Edit JD returns to job step with context preserved", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);

  await page.getByRole("button", { name: "Edit JD" }).click();
  await expect(page).toHaveURL(/\/resume\/job/);
  await expect(page.getByLabel("Posting text")).toHaveValue(jdText);
  await expect(page.locator("#resume-base-text")).toHaveValue(resumeText);
});

test("export: Back to review returns to review page", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);

  await page.getByRole("button", { name: "Go to export" }).click();
  await expect(page).toHaveURL(/\/resume\/export/);
  await page.getByRole("button", { name: "Back to review" }).click();
  await expect(page).toHaveURL(/\/resume\/review/);
  await expect(page.getByRole("heading", { name: "Review what changed" })).toBeVisible();
});
