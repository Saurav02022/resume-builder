import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function uploadResumeFromText(page: Page, resumeText: string) {
  await page.goto("/resume/upload");
  await page.setInputFiles("#resume-file-upload", {
    name: "original-resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(resumeText, "utf8"),
  });
  await page.getByRole("button", { name: "Upload & Continue" }).click();
  await expect(page).toHaveURL(/\/resume\/job/);
}

export async function fillJdAndGenerate(page: Page, jdText: string) {
  await page.getByLabel("Posting text").fill(jdText);
  await page.getByRole("button", { name: /Start Tailoring|Update Tailoring/ }).click();
  await expect(page.getByRole("heading", { name: "Review what changed" })).toBeVisible();
}
