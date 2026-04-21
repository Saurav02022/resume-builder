"use client";

/**
 * Wizard step 1: user pastes the JD here → POST `/api/resume/tailor` (server reads
 * `public/original-resume.tex` + this JD) → Gemini → result stored in Zustand → redirect `/resume/review`.
 */

import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { FileText, Loader2, Sparkles, AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WizardInputCard } from "@/components/wizard/wizard-input-card";
import { apiRoutes, routes } from "@/config/routes";
import { useWizardStore } from "@/store/wizard-store";
import type { TailorResumeData } from "@/types/resume-tailor";

const LOG_PREFIX = "[resume/job]";
const FLOW = "[tailor-flow]";

export default function ResumeJobPage() {
  const router = useRouter();
  const jd = useWizardStore((s) => s.jd);
  const tailorData = useWizardStore((s) => s.tailorData);
  const originalText = useWizardStore((s) => s.originalText);
  const originalFileName = useWizardStore((s) => s.originalFileName);

  const setJd = useWizardStore((s) => s.setJd);
  const setOriginalText = useWizardStore((s) => s.setOriginalText);
  const setTailorData = useWizardStore((s) => s.setTailorData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = jd.trim().length >= 40 && originalText.length > 50;

  const runTailor = useCallback(async () => {
    setError(null);
    setLoading(true);
    setTailorData(null);
    const jdChars = jd.trim().length;
    console.info(
      FLOW,
      "client · Generate clicked → will POST JSON { resume_text, jd } to Next.js API"
    );
    console.info(LOG_PREFIX, "tailor started", { jdChars, endpoint: apiRoutes.resume.tailor });
    try {
      console.info(
        FLOW,
        "client · fetch POST",
        apiRoutes.resume.tailor,
        "(watch terminal for api + gemini logs)"
      );
      const res = await fetch(apiRoutes.resume.tailor, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: originalText, jd }),
      });
      console.info(FLOW, "client · fetch response", { httpStatus: res.status });
      const json = (await res.json()) as
        | { success: true; data: TailorResumeData }
        | { success: false; error: { message: string; code?: string } };

      if (!res.ok || !json.success) {
        const msg =
          !json.success ? json.error.message : `HTTP ${res.status}`;
        console.warn(LOG_PREFIX, "tailor rejected", {
          httpStatus: res.status,
          code: json.success ? undefined : json.error.code,
        });
        throw new Error(msg);
      }
      setTailorData(json.data);
      console.info(FLOW, "client · success · setTailorData + navigate", {
        to: routes.resume.review,
        tailoredTexChars: json.data.tailoredTex?.length ?? 0,
      });
      console.info(LOG_PREFIX, "tailor success, navigating", {
        to: routes.resume.review,
        tailoredTexChars: json.data.tailoredTex?.length ?? 0,
      });
      router.push(routes.resume.review);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      console.error(FLOW, "client FAILED", message);
      console.error(LOG_PREFIX, "tailor failed", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jd, originalText, router, setTailorData]);

  // Security layer: enforce sequence via useEffect to avoid "render phase update" error
  useEffect(() => {
    if (!originalText) {
      console.warn("No parsed resume context in memory. Kicking user to upload step.");
      router.replace(routes.resume.upload);
    }
  }, [originalText, router]);

  if (!originalText) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Step 2 of 4 — Job description
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Reference your resume & paste the role
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          We&apos;ve extracted the text from{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
            {originalFileName || "your file"}
          </code>. 
          Use the preview below to ensure we have the right context while you paste the target JD.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:gap-8">
        <WizardInputCard
          id="resume-base-text"
          title="Your Resume Base"
          description={`Extracted from ${originalFileName || "your file"}. Feel free to edit or paste updates.`}
          label="Source text"
          value={originalText}
          onChange={setOriginalText}
          placeholder="Paste your resume text here if extraction was imperfect..."
          icon={FileText}
          variant="muted"
          disabled={loading}
        />

        <div className="flex flex-col gap-4">
          <WizardInputCard
            id="resume-job-jd"
            title="Target Job Description"
            description="Paste the full posting below. We require at least 40 characters for the AI to provide a high-quality tailoring pass."
            label="Posting text"
            value={jd}
            onChange={setJd}
            placeholder="Role, responsibilities, tech stack, must-haves…"
            icon={Sparkles}
            disabled={loading}
          />

          <div className="flex flex-col gap-4 px-1">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Could not generate</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {jd.trim().length} characters
                  {!canGenerate ? " · please add more detail" : ""}
                </p>
                {tailorData && !loading ? (
                  <p className="text-[10px] leading-tight text-muted-foreground">
                    Regenerating will replace your current tailored version.
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                disabled={!canGenerate || loading}
                onClick={() => void runTailor()}
                className="h-11 gap-2 px-8 shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                {loading
                  ? "Generating…"
                  : tailorData
                    ? "Update Tailoring"
                    : "Start Tailoring"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
