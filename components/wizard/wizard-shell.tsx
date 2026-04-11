"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";

import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { useWizardStore } from "@/store/wizard-store";

export function WizardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const resetWizard = useWizardStore((s) => s.resetWizard);

  return (
    <div className="relative min-h-full bg-background">
      {/* Ultra-subtle warmth — no purple / no “AI glow” band */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_-30%,oklch(0.55_0.06_255/0.06),transparent_55%)]"
        aria-hidden
      />

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/85">
        <div className="mx-auto flex w-full max-w-[min(100%,1920px)] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={routes.resume.job}
              className="group flex min-w-0 items-start gap-3 sm:items-center"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted ring-1 ring-border transition-shadow group-hover:shadow-md sm:size-11">
                <Bot
                  className="size-5 text-primary sm:size-[22px]"
                  aria-hidden
                />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    Resume AI Agent
                  </span>
                  <Badge
                    variant="secondary"
                    className="hidden font-sans text-xs font-medium sm:inline-flex"
                  >
                    AI resume expert
                  </Badge>
                </span>
                <span className="font-sans text-xs leading-snug text-muted-foreground sm:text-[13px]">
                  Tailor your resume to each role — clear, recruiter-ready framing.
                </span>
              </span>
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 font-sans"
              onClick={() => {
                resetWizard();
                router.push(routes.resume.job);
              }}
            >
              Start fresh
            </Button>
          </div>
          <WizardStepper />
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-[min(100%,1920px)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10 2xl:px-12">
        {children}
      </div>
    </div>
  );
}
