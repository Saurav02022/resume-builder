import { expect, test } from "@playwright/test";

import { mockParseNonJson, mockParseSuccessFalse } from "../helpers/api-mocks";
import { loadFixtureText } from "../helpers/fixtures-loader";

test("upload button stays disabled until a file is selected", async ({ page }) => {
  await page.goto("/resume/upload");
  await expect(page.getByRole("button", { name: "Upload & Continue" })).toBeDisabled();
});

test("shows extraction error when parse returns 200 with success false", async ({ page }) => {
  await mockParseSuccessFalse(page, "Parser could not read document structure");
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");

  await page.goto("/resume/upload");
  await page.setInputFiles("#resume-file-upload", {
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(resumeText, "utf8"),
  });
  await page.getByRole("button", { name: "Upload & Continue" }).click();

  const errorAlert = page.getByRole("alert").filter({ hasText: "Extraction Failed" });
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert.getByText("Parser could not read document structure")).toBeVisible();
  await expect(page).toHaveURL(/\/resume\/upload/);
});

test("shows extraction error when parse returns non-JSON body", async ({ page }) => {
  await mockParseNonJson(page);
  const resumeText = await loadFixtureText("fixtures/resume/original-resume.tex");

  await page.goto("/resume/upload");
  await page.setInputFiles("#resume-file-upload", {
    name: "resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(resumeText, "utf8"),
  });
  await page.getByRole("button", { name: "Upload & Continue" }).click();

  await expect(page.getByText("Extraction Failed")).toBeVisible();
  await expect(page).toHaveURL(/\/resume\/upload/);
});
