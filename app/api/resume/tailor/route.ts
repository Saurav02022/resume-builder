import type { ApiResponse } from "@/types/resume-tailor";

const FLOW = "[tailor-flow]";

export const runtime = "nodejs";
export const maxDuration = 300; // Timeout set to 300 seconds (5 minutes)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: Request): Promise<Response> {
  console.info(FLOW, "api · POST /api/resume/tailor received");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be JSON");
  }

  const jd =
    typeof body === "object" && body !== null && "jd" in body && typeof (body as Record<string, unknown>).jd === "string"
      ? (body as Record<string, string>).jd.trim()
      : "";

  const resume_text =
    typeof body === "object" && body !== null && "resume_text" in body && typeof (body as Record<string, unknown>).resume_text === "string"
      ? (body as Record<string, string>).resume_text.trim()
      : "";

  if (!jd || jd.length < 40) {
    return jsonError(400, "INVALID_JD", "Paste a job description (min ~40 chars).");
  }

  if (!resume_text) {
    return jsonError(400, "INVALID_RESUME", "Original resume text is missing.");
  }

  console.info(FLOW, "api · forwarding to FastAPI backend");

  try {
    const response = await fetch(`${BACKEND_URL}/api/resume/tailor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resume_text,
        jd
      })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const result = await response.json();
    
    // Map backend snake_case to frontend camelCase
    if (result.success && result.data) {
      const backendData = result.data;
      const mappedData = {
        ...backendData,
        tailoredTex: backendData.tailored_tex,
        atsScores: backendData.ats_comparison,
        candidateName: backendData.candidate_name,
        targetCompany: backendData.target_company,
        targetRole: backendData.target_role,
        targetLocation: backendData.target_location,
      };

      return Response.json({
        success: true,
        data: mappedData,
      });
    }

    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Proxy failed";
    console.error(FLOW, "api FAILED · Proxy to FastAPI backend threw", message);
    return jsonError(500, "PROXY_FAILED", message, e);
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
