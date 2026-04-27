import { expect, test } from "@playwright/test";

import { mockDownloadSuccess, mockParseSuccess, mockTailorSuccess } from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { fillJdAndGenerate, uploadResumeFromText } from "../helpers/wizard-actions";

test("copy LaTeX writes tailored source to clipboard", async ({ page }) => {
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
  const jdText = await loadFixtureText("fixtures/jd/meta-frontend-engineer.txt");
  const tailorData = await loadFixtureJson<Record<string, unknown>>("mocks/tailor-success.meta.json");
  const expectedTex = String(tailorData.tailoredTex ?? "");

  await mockParseSuccess(page, resumeText);
  await mockTailorSuccess(page, tailorData);
  await mockDownloadSuccess(page);
  await uploadResumeFromText(page, resumeText);
  await fillJdAndGenerate(page, jdText);

  await page.getByRole("button", { name: "Go to export" }).click();
  await expect(page).toHaveURL(/\/resume\/export/);

  await page.getByRole("button", { name: "Copy LaTeX" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toBe(expectedTex);
  expect(clipboard).toContain("Meta tailored resume content");
});
