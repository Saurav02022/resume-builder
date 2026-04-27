import { expect, test } from "@playwright/test";

import { mockParseSuccess, mockTailorSuccess } from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { uploadResumeFromText } from "../helpers/wizard-actions";

const JD_39 = "x".repeat(39);
const JD_40 = "y".repeat(40);

test("disables generate when JD has fewer than 40 characters", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  await mockParseSuccess(page, resumeText);

  await uploadResumeFromText(page, resumeText);
  await page.getByLabel("Posting text").fill(JD_39);
  await expect(page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ })).toBeDisabled();
});

test("enables generate at exactly 40 JD characters when resume text is long enough", async ({
  page,
}) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);

  await uploadResumeFromText(page, resumeText);
  await page.getByLabel("Posting text").fill(JD_40);
  await expect(page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ })).toBeEnabled();
  await page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ }).click();
  await expect(page).toHaveURL(/\/resume\/review/);
});

test("disables generate when source resume text has 50 or fewer characters", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, await loadFixtureJson("mocks/tailor-success.meta.json"));

  await uploadResumeFromText(page, resumeText);
  await page.getByLabel("Source text").fill("a".repeat(50));
  await page.getByLabel("Posting text").fill(JD_40);
  await expect(page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ })).toBeDisabled();
});
