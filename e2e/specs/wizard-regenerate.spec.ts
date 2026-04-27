import { expect, test } from "@playwright/test";

import { mockParseSuccess, mockTailorSuccessSequence } from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { uploadResumeFromText } from "../helpers/wizard-actions";

test("second tailoring run replaces tailored output on review", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdMeta = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const jdGoogle = await loadFixtureText("fixtures/jd/google-software-engineer-web.txt");
  const metaPayload = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");
  const googlePayload = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.google.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccessSequence(page, [metaPayload, googlePayload]);
  await uploadResumeFromText(page, resumeText);

  await page.getByLabel("Posting text").fill(jdMeta);
  await page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ }).click();
  await expect(page).toHaveURL(/\/resume\/review/);
  await expect(page.getByText("Meta tailored resume content")).toBeVisible();

  await page.getByRole("button", { name: "Edit JD" }).click();
  await expect(page).toHaveURL(/\/resume\/job/);
  await page.getByLabel("Posting text").fill(jdGoogle);
  await page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ }).click();
  await expect(page).toHaveURL(/\/resume\/review/);
  await expect(page.getByText("Google tailored resume content")).toBeVisible();
  await expect(page.getByText("Meta tailored resume content")).not.toBeVisible();
});
