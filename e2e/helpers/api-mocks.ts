import type { Page } from "@playwright/test";

type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
};

type ApiErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export async function mockParseSuccess(page: Page, parsedText: string) {
  const response: ApiSuccessEnvelope<{ text: string }> = {
    success: true,
    data: { text: parsedText },
  };

  await page.route("**/api/resume/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

export async function mockParseError(page: Page, message: string) {
  const response: ApiErrorEnvelope = {
    success: false,
    error: {
      code: "PARSE_FAILED",
      message,
    },
  };

  await page.route("**/api/resume/parse", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/** HTTP 200 but envelope says failure — client must still treat as error */
export async function mockParseSuccessFalse(page: Page, message: string) {
  const response: ApiErrorEnvelope = {
    success: false,
    error: { code: "PARSE_FAILED", message },
  };

  await page.route("**/api/resume/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

export async function mockParseNonJson(page: Page) {
  await page.route("**/api/resume/parse", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "not-json",
    });
  });
}

export async function mockTailorSuccess<T>(page: Page, payload: T) {
  const response: ApiSuccessEnvelope<T> = { success: true, data: payload };

  await page.route("**/api/resume/tailor", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

export async function mockTailorError(page: Page, message: string) {
  const response: ApiErrorEnvelope = {
    success: false,
    error: {
      code: "TAILOR_FAILED",
      message,
    },
  };

  await page.route("**/api/resume/tailor", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/** HTTP 200 but envelope says failure */
export async function mockTailorSuccessFalse(page: Page, message: string) {
  const response: ApiErrorEnvelope = {
    success: false,
    error: { code: "TAILOR_FAILED", message },
  };

  await page.route("**/api/resume/tailor", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

export async function mockTailorNonJson(page: Page) {
  await page.route("**/api/resume/tailor", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "unexpected-body",
    });
  });
}

/** Each tailor request gets the next payload (last one repeats if more calls). */
export async function mockTailorSuccessSequence(page: Page, payloads: readonly unknown[]) {
  if (payloads.length === 0) {
    throw new Error("mockTailorSuccessSequence requires at least one payload");
  }
  let index = 0;

  await page.route("**/api/resume/tailor", async (route) => {
    const payload = payloads[Math.min(index, payloads.length - 1)]!;
    index += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: payload }),
    });
  });
}

export async function mockTailorDelayedSuccess<T>(
  page: Page,
  payload: T,
  delayMs: number,
): Promise<{ requestCount: () => number }> {
  let count = 0;

  await page.route("**/api/resume/tailor", async (route) => {
    count += 1;
    await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: payload }),
    });
  });

  return {
    requestCount: () => count,
  };
}

function buildPdfBuffer(): Buffer {
  return Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 40 100 Td (Resume Builder) Tj ET\nendstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF",
    "utf8"
  );
}

export async function mockDownloadSuccess(page: Page, filename = "resume.pdf") {
  await page.route("**/api/resume/download", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      body: buildPdfBuffer(),
    });
  });
}

export async function mockDownloadError(page: Page, message: string) {
  const response: ApiErrorEnvelope = {
    success: false,
    error: {
      code: "PDF_DOWNLOAD_FAILED",
      message,
    },
  };

  await page.route("**/api/resume/download", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/** HTTP 200 but invalid payload contract for download endpoint */
export async function mockDownloadSuccessFalse(page: Page, message: string) {
  const response: ApiErrorEnvelope = {
    success: false,
    error: {
      code: "PDF_DOWNLOAD_FAILED",
      message,
    },
  };

  await page.route("**/api/resume/download", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/** 200 response with non-PDF/non-JSON payload */
export async function mockDownloadNonPdf(page: Page) {
  await page.route("**/api/resume/download", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/plain",
      body: "unexpected-download-response",
    });
  });
}
