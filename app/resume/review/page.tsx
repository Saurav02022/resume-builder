"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import {
  ReviewPanel,
  type ReviewSubStep,
} from "@/components/wizard/review-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useWizardGuard } from "@/hooks/use-wizard-guard";
import { useWizardStore } from "@/store/wizard-store";

function parseReviewSubStep(search: string | null): ReviewSubStep {
  return search === "analysis" ? "analysis" : "diff";
}

function ReviewPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <Skeleton className="h-12 w-full max-w-md rounded-lg" />
      <Skeleton className="h-[min(65vh,520px)] w-full rounded-xl" />
    </div>
  );
}

function ResumeReviewPageInner() {
  useWizardGuard("review");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tailorData = useWizardStore((s) => s.tailorData);

  const subStep = parseReviewSubStep(searchParams.get("step"));

  const goStep = (step: ReviewSubStep) => {
    const q = step === "analysis" ? "?step=analysis" : "";
    router.push(`${routes.resume.review}${q}`);
  };

  if (!tailorData) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/80 pb-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Step 2 of 3 — Review
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Review what changed
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Start with the <strong className="font-medium text-foreground">diff</strong>, then{" "}
            <strong className="font-medium text-foreground">analytics &amp; tips</strong> for
            before/after ATS-style scores and coaching. Export when you are happy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.push(routes.resume.job)}
          >
            <ArrowLeft className="size-4" />
            Edit JD
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={() => router.push(routes.resume.export)}
          >
            Go to export
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <ReviewPanel
        data={tailorData}
        subStep={subStep}
        onGoToAnalysis={() => goStep("analysis")}
        onGoToDiff={() => goStep("diff")}
      />
    </div>
  );
}

export default function ResumeReviewPage() {
  return (
    <Suspense fallback={<ReviewPageSkeleton />}>
      <ResumeReviewPageInner />
    </Suspense>
  );
}
