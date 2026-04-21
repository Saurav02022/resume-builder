"use client";

import {
  ArrowRight,
  LayoutList,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  ArrowLeft,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
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
import { resolveAtsComparison } from "@/lib/tailor-ats";
import type { TailorResumeData } from "@/types/resume-tailor";
import { cn } from "@/lib/utils";
import { wizardTextBlockHeightClass } from "@/config/wizard-ui";

export type ReviewSubStep = "diff" | "analysis";

type ReviewPanelProps = {
  data: TailorResumeData;
  subStep: ReviewSubStep;
  onGoToAnalysis: () => void;
  onGoToDiff: () => void;
};

export function ReviewPanel({
  data,
  subStep,
  onGoToAnalysis,
  onGoToDiff,
}: ReviewPanelProps) {
  const ats = resolveAtsComparison(data);

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-xl bg-muted/50 p-1.5 shadow-inner">
          <button
            onClick={onGoToDiff}
            className={cn(
              "flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all",
              subStep === "diff"
                ? "bg-background text-primary shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-muted font-medium"
            )}
          >
            <LayoutList className="size-4" />
            Tailored LaTeX Code
          </button>
          <button
            onClick={onGoToAnalysis}
            className={cn(
              "flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all",
              subStep === "analysis"
                ? "bg-background text-primary shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-muted font-medium"
            )}
          >
            <TrendingUp className="size-4" />
            Analytics & tips
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8">
          {subStep === "diff" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-foreground">LaTeX Source</h3>
                <p className="text-sm text-muted-foreground">This is the tailored LaTeX code based on your original template.</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-slate-500/5 shadow-inner">
                <ScrollArea className={cn("rounded-lg border bg-muted/40", wizardTextBlockHeightClass, "h-[600px] lg:h-[800px]")}>
                  <pre className="p-4 font-mono text-[11px] leading-relaxed text-foreground/90">
                    {data.tailoredTex}
                  </pre>
                </ScrollArea>
              </div>
              <div className="flex justify-end border-t border-border/80 pt-6">
                <Button
                  type="button"
                  onClick={onGoToAnalysis}
                  className="gap-2 px-6 shadow-sm"
                >
                  Continue to analytics & tips
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Score Cards (Before vs After) */}
              <div className="grid gap-6 sm:grid-cols-2">
                <AtsScoreCard
                  title="Before tailoring"
                  subtitle="Original resume"
                  score={ats.original.score}
                  band={ats.original.band}
                  rationale={ats.original.rationale}
                />
                <AtsScoreCard
                  title="After this run"
                  subtitle="Tailored resume"
                  score={ats.tailored.score}
                  band={ats.tailored.band}
                  rationale={ats.tailored.rationale}
                  isPrimary
                />
              </div>

              {/* Fixes / Changes applied */}
              {data.fixes && data.fixes.length > 0 && (
                <Card className="border-border/80 bg-muted/10 shadow-sm transition-all hover:border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10">
                        <Wrench className="size-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Optimization Log</CardTitle>
                        <CardDescription>Direct improvements made by the AI.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {data.fixes.map((fix, idx) => (
                        <div key={idx} className="group relative rounded-xl border border-border bg-background p-4 shadow-sm transition-all hover:border-primary/30 hover:bg-muted/30">
                          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                              {idx + 1}
                            </span>
                            {fix.whatChanged}
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground">{fix.why}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {ats.liftSummary ? (
                <Alert className="border-primary/25 bg-background shadow-sm ring-1 ring-primary/20">
                  <Sparkles className="size-4 text-primary" />
                  <AlertTitle className="text-foreground font-bold">What moved</AlertTitle>
                  <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
                    {ats.liftSummary}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="secondary" className="border-border">
                  <AlertTitle className="text-muted-foreground">What moved</AlertTitle>
                  <AlertDescription className="text-sm text-muted-foreground italic">
                    Regenerate to refresh analysis.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between border-t border-border/80 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onGoToDiff}
                  className="gap-2"
                >
                  <ArrowLeft className="size-4" />
                  Back to preview
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar / Insights Panel */}
        <div className="lg:col-span-4">
          <Card className="sticky top-24 border-primary/10 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="size-5 text-amber-500" />
                AI Match Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Match Summary */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">The Assessment</p>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {data.comparisonSummary || "Assessment complete. See the preview for specific improvements."}
                </p>
              </div>

              <Separator className="bg-border/60" />

              {/* Suggestions */}
              {data.suggestions && data.suggestions.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next Moves</p>
                  <div className="grid gap-3">
                    {data.suggestions.map((tip, idx) => (
                      <div key={idx} className="flex gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                        <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {idx + 1}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground font-medium">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AtsScoreCard({ 
  title, 
  subtitle, 
  score, 
  band, 
  rationale, 
  isPrimary 
}: { 
  title: string;
  subtitle: string;
  score: number;
  band: string;
  rationale: string;
  isPrimary?: boolean;
}) {
  return (
    <Card className={cn(
      "border-border shadow-sm overflow-hidden transition-all",
      isPrimary && "ring-2 ring-primary/20 border-primary/40 shadow-md bg-primary/[0.02]"
    )}>
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
            <CardTitle className="text-sm font-bold">{subtitle}</CardTitle>
          </div>
          {isPrimary ? (
             <TrendingUp className="size-5 text-primary" />
          ) : (
             <Target className="size-5 text-muted-foreground" aria-hidden />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black tracking-tight">{score}</span>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">/ 100</span>
          <Badge variant={score > 70 ? "default" : "secondary"} className="ml-2 uppercase text-[10px] tracking-widest font-bold">
            {band}
          </Badge>
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {rationale}
        </p>
      </CardContent>
    </Card>
  );
}
