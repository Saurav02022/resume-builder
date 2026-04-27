import { expect, test } from "@playwright/test";

import { mockParseSuccess, mockTailorSuccess } from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { fillJdAndGenerate, uploadResumeFromText } from "../helpers/wizard-actions";

test("review state survives a full page reload (sessionStorage)", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);

  await expect(page.getByRole("heading", { name: "Review what changed" })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/resume\/review/);
  await expect(page.getByRole("heading", { name: "Review what changed" })).toBeVisible();
  await expect(page.getByText("Meta tailored resume content")).toBeVisible();
});
