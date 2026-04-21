const FLOW = "[download-flow]";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  console.info(FLOW, "api · POST /api/resume/download received");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400 });
  }

  const { resume_data, filename } = body as { resume_data: any; filename?: string };

  if (!resume_data) {
    return new Response(JSON.stringify({ success: false, error: "Missing resume data" }), { status: 400 });
  }

  console.info(FLOW, "api · forwarding to FastAPI backend", { filename });

  try {
    const response = await fetch(`${BACKEND_URL}/api/resume/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_data, filename })
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const blob = await response.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    // Preserve the filename from the backend if possible, or use the request one
    const contentDisposition = response.headers.get("Content-Disposition") || `attachment; filename=${filename || 'resume.docx'}`;
    headers.set("Content-Disposition", contentDisposition);

    return new Response(blob, {
      status: 200,
      headers
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Download proxy failed";
    console.error(FLOW, "api FAILED", message);
    return new Response(JSON.stringify({ success: false, error: message }), { status: 500 });
  }
}
