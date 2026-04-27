import { expect, test } from "@playwright/test";

import { mockParseError, mockParseSuccess, mockTailorError } from "../helpers/api-mocks";
import { loadFixtureText } from "../helpers/fixtures-loader";
import { uploadResumeFromText } from "../helpers/wizard-actions";

test("keeps generate disabled for short JD", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  await mockParseSuccess(page, resumeText);
  await uploadResumeFromText(page, resumeText);

  await page.getByLabel("Posting text").fill("short jd text");
  await expect(page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ })).toBeDisabled();
});

test("shows error when tailor api fails", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");

  await mockParseSuccess(page, resumeText);
  await mockTailorError(page, "Backend unavailable");
  await uploadResumeFromText(page, resumeText);

  await page.getByLabel("Posting text").fill(jdText);
  await page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ }).click();

  await expect(page.getByText("Could not generate")).toBeVisible();
  await expect(page).toHaveURL(/\/resume\/job/);
});

test("shows parse error alert on upload page", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");

  await mockParseError(page, "Could not parse resume file");
  await page.goto("/resume/upload");
  await page.setInputFiles("#resume-file-upload", {
    name: "original-resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(resumeText, "utf8"),
  });
  await page.getByRole("button", { name: "Upload & Continue" }).click();

  await expect(page.getByText("Extraction Failed")).toBeVisible();
  await expect(page).toHaveURL(/\/resume\/upload/);
});
