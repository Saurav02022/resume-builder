"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  GitCompare,
  LayoutList,
  Lightbulb,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { MiniGitDiff } from "@/components/resume-tailor/mini-git-diff";
import { ResumeDiffPanel } from "@/components/resume-tailor/resume-diff-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveAtsComparison } from "@/lib/tailor-ats";
import type { AtsScore, TailorResumeData } from "@/types/resume-tailor";
import { cn } from "@/lib/utils";

export type ReviewSubStep = "diff" | "analysis";

type ReviewPanelProps = {
  data: TailorResumeData;
  subStep: ReviewSubStep;
  onGoToAnalysis: () => void;
  onGoToDiff: () => void;
};

function ScoreMeter({ score, className }: { score: number; className?: string }) {
  const w = Math.min(100, Math.max(0, score));
  return (
    <div
      className={cn("h-2.5 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={w}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-primary/80 to-primary transition-[width] duration-500"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

function AtsScoreCard({
  title,
  subtitle,
  score,
  variant,
}: {
  title: string;
  subtitle: string;
  score: AtsScore;
  variant: "original" | "tailored";
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-5 shadow-sm",
        variant === "original" &&
          "border-border/80 bg-muted/25 dark:bg-muted/15",
        variant === "tailored" &&
          "border-primary/25 bg-linear-to-br from-primary/10 via-background to-background ring-1 ring-primary/15"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {subtitle}
          </p>
          <p className="mt-1 font-heading text-lg font-bold tracking-tight">
            {title}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 font-normal text-xs sm:text-sm"
        >
          {score.band}
        </Badge>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-5xl font-bold tabular-nums tracking-tight text-foreground">
          {score.score}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      <ScoreMeter score={score.score} className="mt-4" />
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {score.rationale}
      </p>
    </div>
  );
}

export function ReviewPanel({
  data,
  subStep,
  onGoToAnalysis,
  onGoToDiff,
}: ReviewPanelProps) {
  const [baseTex, setBaseTex] = useState<string | null>(null);
  const [baseTexError, setBaseTexError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/original-resume.tex")
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load base file (${r.status})`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setBaseTex(text);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setBaseTexError(
            e instanceof Error ? e.message : "Could not load base resume"
          );
          setBaseTex("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [data.tailoredTex]);

  const ats = resolveAtsComparison(data);
  const delta = ats.tailored.score - ats.original.score;
  const nIssues = data.issues.length;
  const nFixes = data.fixes.length;
  const nTips = data.suggestions.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex rounded-2xl border border-border/70 bg-muted/45 p-1 text-sm shadow-inner backdrop-blur-sm dark:bg-muted/30"
          role="navigation"
          aria-label="Review substeps"
        >
          <button
            type="button"
            onClick={onGoToDiff}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-all sm:rounded-2xl",
              subStep === "diff"
                ? "bg-background text-foreground shadow-sm ring-1 ring-primary/20 dark:ring-primary/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-[11px] font-semibold text-primary/80">1</span>
            <GitCompare className="size-4" />
            Diff
          </button>
          <button
            type="button"
            onClick={onGoToAnalysis}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 font-medium transition-all sm:rounded-2xl",
              subStep === "analysis"
                ? "bg-background text-foreground shadow-sm ring-1 ring-primary/20 dark:ring-primary/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-[11px] font-semibold text-primary/80">2</span>
            <LayoutList className="size-4" />
            Analytics &amp; tips
          </button>
        </div>
      </div>

      {subStep === "diff" ? (
        <div className="space-y-4">
          <p className="text-base leading-relaxed text-muted-foreground">
            Left: your <strong className="font-medium text-foreground">original</strong>{" "}
            file. Right: <strong className="font-medium text-foreground">tailored</strong>{" "}
            for this JD. Then open analytics for{" "}
            <strong className="font-medium text-foreground">before &amp; after</strong>{" "}
            ATS-style scores and coaching.
          </p>
          {baseTexError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Base file</AlertTitle>
              <AlertDescription>{baseTexError}</AlertDescription>
            </Alert>
          ) : baseTex === null ? (
            <Skeleton className="h-[min(65vh,520px)] w-full rounded-xl" />
          ) : (
            <ResumeDiffPanel oldValue={baseTex} newValue={data.tailoredTex} />
          )}
          <div className="flex justify-end border-t border-border/80 pt-6">
            <Button
              type="button"
              onClick={onGoToAnalysis}
              className="gap-2 px-6 shadow-sm"
            >
              Continue to analytics &amp; tips
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* ATS before / after */}
          <section className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                  ATS-style alignment
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight">
                  Original vs tailored
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Same rubric for both: keyword fit, structure, evidence — estimated
                  from text vs this JD, not a vendor ATS score.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {delta !== 0 ? (
                  <Badge
                    variant={delta > 0 ? "default" : "secondary"}
                    className={cn(
                      "gap-1.5 px-3 py-1 text-sm font-medium",
                      delta > 0 &&
                        "bg-[#1aae39] text-white hover:bg-[#179a33] dark:bg-[#1aae39]"
                    )}
                  >
                    {delta > 0 ? (
                      <TrendingUp className="size-3.5" aria-hidden />
                    ) : (
                      <TrendingDown className="size-3.5" aria-hidden />
                    )}
                    {delta > 0 ? "+" : ""}
                    {delta} vs original
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm">
                    No change in score
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <AtsScoreCard
                variant="original"
                subtitle="Before tailoring"
                title="Original resume"
                score={ats.original}
              />
              <AtsScoreCard
                variant="tailored"
                subtitle="After this run"
                title="Tailored resume"
                score={ats.tailored}
              />
            </div>

            {ats.liftSummary ? (
              <Alert className="border-primary/25 bg-primary/5 dark:bg-primary/10">
                <Sparkles className="size-4 text-primary" />
                <AlertTitle className="text-foreground">What moved</AlertTitle>
                <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
                  {ats.liftSummary}
                </AlertDescription>
              </Alert>
            ) : null}
          </section>

          <Separator className="bg-border/80" />

          {/* Match summary + glance */}
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Target className="size-5 text-primary" aria-hidden />
                  </span>
                  How you match this JD
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Narrative from this generation — read alongside the diff.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {data.comparisonSummary}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-muted/30 shadow-inner lg:sticky lg:top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">This run</CardTitle>
                <CardDescription className="text-xs">
                  Counts from the agent output
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-0">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Gaps flagged</span>
                  <span className="font-medium tabular-nums">{nIssues}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Fixes applied</span>
                  <span className="font-medium tabular-nums text-[#158a32] dark:text-[#4ade80]">
                    {nFixes}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Extra tips</span>
                  <span className="font-medium tabular-nums">{nTips}</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Tips */}
          {data.suggestions.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-5 text-primary" aria-hidden />
                <h3 className="font-heading text-lg font-bold tracking-tight">
                  Tips for this role
                </h3>
              </div>
              <ul className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                {data.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm ring-1 ring-border/30"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-sm font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {s}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Issues */}
          {data.issues.length > 0 ? (
            <section className="space-y-4">
              <h3 className="font-heading text-lg font-bold tracking-tight">
                Gaps vs this JD
              </h3>
              <ul className="space-y-3">
                {data.issues.map((row, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 dark:bg-amber-500/10"
                  >
                    <p className="font-medium leading-snug text-foreground">
                      {row.issue}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {row.whyItMatters}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Fixes */}
          {data.fixes.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Wrench className="size-5 text-[#1aae39] dark:text-[#4ade80]" />
                <h3 className="font-heading text-lg font-bold tracking-tight">
                  What we changed
                </h3>
              </div>
              <ul className="space-y-4">
                {data.fixes.map((row, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-[#1aae39]/30 bg-[#1aae39]/5 p-4 dark:bg-[#1aae39]/10"
                  >
                    <p className="font-medium leading-snug text-[#0d4d1f] dark:text-[#b6f0c4]">
                      {row.whatChanged}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {row.why}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Git-style diff (base → tailored)
                      </p>
                      <MiniGitDiff
                        before={row.beforeSnippet ?? ""}
                        after={row.afterSnippet ?? ""}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!data.suggestions.length &&
          !data.issues.length &&
          !data.fixes.length ? (
            <p className="text-center text-sm text-muted-foreground">
              No extra coaching bullets this run — check the diff for edits.
            </p>
          ) : null}

          <div className="flex flex-wrap border-t border-border/80 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onGoToDiff}
              className="gap-2"
            >
              Back to diff
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
