"use client";

/**
 * Wizard step 1: user pastes the JD here → POST `/api/resume/tailor` (server reads
 * `public/original-resume.tex` + this JD) → Gemini → result stored in Zustand → redirect `/resume/review`.
 */

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRoutes, routes } from "@/config/routes";
import { wizardTextBlockHeightClass } from "@/config/wizard-ui";
import { useWizardStore } from "@/store/wizard-store";
import type { TailorResumeData } from "@/types/resume-tailor";
import { cn } from "@/lib/utils";

const LOG_PREFIX = "[resume/job]";
const FLOW = "[tailor-flow]";

export default function ResumeJobPage() {
  const router = useRouter();
  const jd = useWizardStore((s) => s.jd);
  const tailorData = useWizardStore((s) => s.tailorData);
  const setJd = useWizardStore((s) => s.setJd);
  const setTailorData = useWizardStore((s) => s.setTailorData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = jd.trim().length >= 40;

  const runTailor = useCallback(async () => {
    setError(null);
    setLoading(true);
    setTailorData(null);
    const jdChars = jd.trim().length;
    console.info(
      FLOW,
      "client · Generate clicked → will POST JSON { jd } to Next.js API"
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
        body: JSON.stringify({ jd }),
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
  }, [jd, router, setTailorData]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Step 1 — Job description
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Share the role you are targeting
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          Paste the full posting. We tailor{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
            public/original-resume.tex
          </code>{" "}
          to this JD, then walk you through diff, ATS-style score, and export.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" aria-hidden />
            </span>
            Job description
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            At least 40 characters so the agent has enough context. One click
            runs the full tailor pass.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="resume-job-jd">Posting text</Label>
            <Textarea
              id="resume-job-jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Role, responsibilities, tech stack, must-haves…"
              rows={12}
              className={cn(
                "field-sizing-fixed resize-none overflow-y-auto font-mono text-sm leading-relaxed",
                wizardTextBlockHeightClass
              )}
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Could not generate</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
                {error}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {jd.trim().length} characters
                {!canGenerate ? " · add a bit more text" : ""}
              </p>
              {tailorData && !loading ? (
                <p className="text-xs text-muted-foreground">
                  You already have a tailored run in this session.{" "}
                  <strong className="font-medium text-foreground">
                    Generate again
                  </strong>{" "}
                  replaces it — there is no separate version history.
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              disabled={!canGenerate || loading}
              onClick={() => void runTailor()}
              className="gap-2 px-6 shadow-sm"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {loading
                ? "Generating…"
                : tailorData
                  ? "Regenerate tailored resume"
                  : "Generate tailored resume"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
