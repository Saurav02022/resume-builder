import { expect, test } from "@playwright/test";

import { mockParseSuccess, mockTailorNonJson, mockTailorSuccessFalse } from "../helpers/api-mocks";
import { loadFixtureText } from "../helpers/fixtures-loader";
import { uploadResumeFromText } from "../helpers/wizard-actions";

test("shows error when tailor returns 200 with success false", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccessFalse(page, "Policy rejected tailoring request");
  await uploadResumeFromText(page, resumeText);

  await page.getByLabel("Posting text").fill(jdText);
  await page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ }).click();

  const errorAlert = page.getByRole("alert").filter({ hasText: "Could not generate" });
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert.getByText("Policy rejected tailoring request")).toBeVisible();
  await expect(page).toHaveURL(/\/resume\/job/);
});

test("shows error when tailor returns non-JSON body", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");

  await mockParseSuccess(page, resumeText);
  await mockTailorNonJson(page);
  await uploadResumeFromText(page, resumeText);

  await page.getByLabel("Posting text").fill(jdText);
  await page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ }).click();

  await expect(page.getByText("Could not generate")).toBeVisible();
  await expect(page).toHaveURL(/\/resume\/job/);
});
