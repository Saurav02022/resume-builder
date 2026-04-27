import { expect, test } from "@playwright/test";

import { mockParseSuccess, mockTailorSuccess } from "../helpers/api-mocks";
import { loadFixtureJson, loadFixtureText } from "../helpers/fixtures-loader";
import { fillJdAndGenerate, uploadResumeFromText } from "../helpers/wizard-actions";

const cases = [
  {
    jdFixture: "fixtures/jd/apple-senior-frontend-engineer.txt",
    responseFixture: "mocks/tailor-success.apple.json",
    company: "Apple",
  },
  {
    jdFixture: "fixtures/jd/netflix-ui-engineer.txt",
    responseFixture: "mocks/tailor-success.netflix.json",
    company: "Netflix",
  },
  {
    jdFixture: "fixtures/jd/amazon-sde-frontend.txt",
    responseFixture: "mocks/tailor-success.amazon.json",
    company: "Amazon",
  },
  {
    jdFixture: "fixtures/jd/google-software-engineer-web.txt",
    responseFixture: "mocks/tailor-success.google.json",
    company: "Google",
  },
] as const;

for (const testCase of cases) {
  test(`generates tailored output for ${testCase.company} JD`, async ({ page }) => {
    const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");
    const jdText = await loadFixtureText(testCase.jdFixture);
    const tailorData = await loadFixtureJson<Record<string, unknown>>(testCase.responseFixture);

    await mockParseSuccess(page, resumeText);
    await mockTailorSuccess(page, tailorData);

    await uploadResumeFromText(page, resumeText);
    await fillJdAndGenerate(page, jdText);

    await expect(page.getByText(`${testCase.company} tailored resume content`)).toBeVisible();
    await page.getByRole("button", { name: "Go to export" }).click();
    await expect(page.getByRole("heading", { name: "Download your tailored resume" })).toBeVisible();
    await expect(page.getByText(new RegExp(`\\+${testCase.company}\\+`, "i"))).toBeVisible();
  });
}
