import { renderTexToPdfWithPuppeteer } from "@/lib/render-resume-pdf-puppeteer";

export const runtime = "nodejs";

/** Allow slow Chromium launch on first run */
export const maxDuration = 120;

/** POST body: `{ tex: string }` — PDF via Puppeteer (Chromium print). */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_JSON",
          message: "Request body must be JSON",
        },
      },
      { status: 400 }
    );
  }

  const tex =
    typeof body === "object" &&
    body !== null &&
    "tex" in body &&
    typeof (body as { tex: unknown }).tex === "string"
      ? (body as { tex: string }).tex
      : "";

  if (!tex || tex.length < 50) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_TEX",
          message: "Missing or too-short tex field",
        },
      },
      { status: 400 }
    );
  }

  if (tex.length > 600_000) {
    return Response.json(
      {
        success: false,
        error: { code: "TEX_TOO_LONG", message: "TeX source too large" },
      },
      { status: 400 }
    );
  }

  try {
    const pdf = await renderTexToPdfWithPuppeteer(tex);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume-tailored.pdf"',
      },
    });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : "PDF generation failed (Puppeteer / Chromium).";
    return Response.json(
      {
        success: false,
        error: {
          code: "PDF_RENDER_FAILED",
          message: `${message} If this persists, use Download .tex and compile on Overleaf.`,
        },
      },
      { status: 500 }
    );
  }
}
