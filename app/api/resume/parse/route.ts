const LOG_PREFIX = "[api/resume/parse]";
const FLOW = "[parse-flow]";

export const runtime = "nodejs";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: Request): Promise<Response> {
  console.info(FLOW, "api · POST /api/resume/parse received");

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "INVALID_FORM_DATA", "Request must be multipart/form-data.");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError(400, "INVALID_FILE", "A valid file upload is required.");
  }

  console.info(FLOW, "api · forwarding to FastAPI backend /parse");

  try {
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const response = await fetch(`${BACKEND_URL}/api/resume/parse`, {
      method: "POST",
      body: backendFormData, 
      // Do NOT set Content-Type header manually when sending FormData via fetch
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
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
  return Response.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}
