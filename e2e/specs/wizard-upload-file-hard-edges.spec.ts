import { expect, test } from "@playwright/test";

import { mockParseError } from "../helpers/api-mocks";
import { loadFixtureText } from "../helpers/fixtures-loader";

test("upload handles unsupported extension with parse error", async ({ page }) => {
  await mockParseError(page, "Unsupported file type. Please upload PDF or DOCX.");
  const payload = await loadFixtureText("fixtures/resume/original-resume.tex");

  await page.goto("/resume/upload");
  await page.setInputFiles("#resume-file-upload", {
    name: "resume.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(payload, "utf8"),
  });
  await page.getByRole("button", { name: "Upload & Continue" }).click();

  const alert = page.getByRole("alert").filter({ hasText: "Extraction Failed" });
  await expect(alert).toBeVisible();
  await expect(alert.getByText("Unsupported file type. Please upload PDF or DOCX.")).toBeVisible();
  await expect(page).toHaveURL(/\/resume\/upload/);
});

test("upload handles empty file with parse error", async ({ page }) => {
  await mockParseError(page, "Uploaded file is empty.");

  await page.goto("/resume/upload");
  await page.setInputFiles("#resume-file-upload", {
    name: "empty.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("", "utf8"),
  });
  await page.getByRole("button", { name: "Upload & Continue" }).click();

  const alert = page.getByRole("alert").filter({ hasText: "Extraction Failed" });
  await expect(alert).toBeVisible();
  await expect(alert.getByText("Uploaded file is empty.")).toBeVisible();
  await expect(page).toHaveURL(/\/resume\/upload/);
});
