import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { tailorResumeWithGemini } from "@/lib/tailor-resume";
import type { ApiResponse, TailorResumeData } from "@/types/resume-tailor";

const LOG_PREFIX = "[api/resume/tailor]";
const FLOW = "[tailor-flow]";

export const runtime = "nodejs";

/**
 * POST body: `{ jd: string }`.
 * Loads the full base file from disk, forwards it with the JD to Gemini (`lib/tailor-resume`), returns structured JSON.
 */
export async function POST(request: Request): Promise<Response> {
  console.info(FLOW, "api · POST /api/resume/tailor received");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.warn(FLOW, "api FAILED · invalid JSON body");
    console.warn(LOG_PREFIX, "reject: invalid JSON body");
    return jsonError(400, "INVALID_JSON", "Request body must be JSON");
  }

  const jd =
    typeof body === "object" &&
    body !== null &&
    "jd" in body &&
    typeof (body as { jd: unknown }).jd === "string"
      ? (body as { jd: string }).jd.trim()
      : "";

  console.info(FLOW, "api · JSON body parsed", { jdChars: jd.length });

  if (!jd || jd.length < 40) {
    console.warn(FLOW, "api FAILED · JD too short", { jdChars: jd.length });
    console.warn(LOG_PREFIX, "reject: invalid JD", { jdChars: jd.length });
    return jsonError(
      400,
      "INVALID_JD",
      "Paste a job description (at least a few lines, min ~40 characters)."
    );
  }

  if (jd.length > 80_000) {
    console.warn(FLOW, "api FAILED · JD too long", { jdChars: jd.length });
    console.warn(LOG_PREFIX, "reject: JD too long", { jdChars: jd.length });
    return jsonError(400, "JD_TOO_LONG", "Job description is too long.");
  }

  const basePath = join(process.cwd(), "public", "original-resume.tex");
  let baseResumeTex: string;
  try {
    baseResumeTex = await readFile(basePath, "utf-8");
  } catch (e) {
    console.error(FLOW, "api FAILED · cannot read base resume", { basePath });
    console.error(LOG_PREFIX, "could not read base resume", { basePath }, e);
    return jsonError(
      500,
      "BASE_RESUME_MISSING",
      "Could not read public/original-resume.tex"
    );
  }

  console.info(FLOW, "api · JD validated", { jdChars: jd.length });
  console.info(FLOW, "api · base resume loaded from disk", {
    path: "public/original-resume.tex",
    chars: baseResumeTex.length,
  });
  console.info(
    FLOW,
    "api · invoking tailorResumeWithGemini (Gemini SDK inside)"
  );

  try {
    const data: TailorResumeData = await tailorResumeWithGemini(
      baseResumeTex,
      jd
    );
    console.info(FLOW, "api · tailor OK; responding 200 JSON to client", {
      tailoredTexChars: data.tailoredTex.length,
      fixesCount: data.fixes?.length ?? 0,
    });
    console.info(LOG_PREFIX, "tailor ok", {
      tailoredTexChars: data.tailoredTex.length,
      fixesCount: data.fixes?.length ?? 0,
    });
    const res: ApiResponse<TailorResumeData> = {
      success: true,
      data,
      message: "Tailored resume generated",
    };
    return Response.json(res);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Tailor failed";
    console.error(FLOW, "api FAILED · tailorResumeWithGemini threw", message);
    console.error(LOG_PREFIX, "tailor failed", message, e);
    return jsonError(500, "TAILOR_FAILED", message, e);
  }
}

function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  const body: ApiResponse<never> = {
    success: false,
    error: { code, message, details },
  };
  return Response.json(body, { status });
}
