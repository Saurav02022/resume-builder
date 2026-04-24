import { ApiErrorResponse } from "@/types/resume-tailor";

const FLOW = "[download-flow]";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const runtime = "nodejs";

type DownloadRequestBody = {
  latex?: string;
  filename?: string;
};



function jsonError(error: ApiErrorResponse["error"], status: number): Response {
  return Response.json({ success: false, error }, { status });
}

export async function POST(request: Request): Promise<Response> {
  console.info(FLOW, "api · POST /api/resume/download received");

  let body: DownloadRequestBody;
  try {
    body = await request.json() as DownloadRequestBody;
  } catch {
    return jsonError(
      { code: "INVALID_JSON", message: "Invalid JSON body." },
      400,
    );
  }

  const { latex, filename } = body;

  if (!latex?.trim()) {
    return jsonError(
      { code: "MISSING_LATEX", message: "Missing LaTeX source." },
      400,
    );
  }

  console.info(FLOW, "api · forwarding to FastAPI backend", { filename });

  try {
    const response = await fetch(`${BACKEND_URL}/api/resume/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latex, filename })
    });

    if (!response.ok) {
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        return new Response(await response.text(), {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const contentType = response.headers.get("Content-Type") || "";
    if (!contentType.includes("application/pdf")) {
      return new Response(await response.text(), {
        status: response.status,
        headers: {
          "Content-Type": contentType || "application/json",
        },
      });
    }

    const blob = await response.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    const contentDisposition = response.headers.get("Content-Disposition") || `attachment; filename="${filename || "Candidate+Company+Role+Location.pdf"}"`;
    headers.set("Content-Disposition", contentDisposition);

    return new Response(blob, {
      status: 200,
      headers
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Download proxy failed";
    console.error(FLOW, "api FAILED", message);
    return jsonError(
      { code: "PDF_DOWNLOAD_FAILED", message },
      500,
    );
  }
}
