"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { ExportPanel } from "@/components/wizard/export-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useWizardGuard } from "@/hooks/use-wizard-guard";
import { useWizardStore } from "@/store/wizard-store";

export default function ResumeExportPage() {
  useWizardGuard("export");
  const router = useRouter();
  const tailorData = useWizardStore((s) => s.tailorData);
  const [error, setError] = useState<string | null>(null);

  if (!tailorData) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Step 3 of 3 — Export
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Download your files
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Get the <code className="rounded-md bg-muted px-1 py-0.5 font-mono text-[0.85em]">.tex</code>{" "}
            source or a quick PDF. The first PDF run may install Chromium in the
            background — give it a moment if it feels slow.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => router.push(routes.resume.review)}
        >
          <ArrowLeft className="size-4" />
          Back to review
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>PDF issue</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap text-xs">
            {error}
          </AlertDescription>
        </Alert>
      ) : null}

      <ExportPanel data={tailorData} onError={setError} />
    </div>
  );
}
