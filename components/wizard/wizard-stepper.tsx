"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { WIZARD_STEPS } from "@/config/wizard-steps";
import { cn } from "@/lib/utils";

export function WizardStepper() {
  const pathname = usePathname();
  const activeIndex = WIZARD_STEPS.findIndex(
    (s) => pathname === s.path || pathname.startsWith(`${s.path}/`)
  );

  return (
    <nav
      aria-label="Workflow steps"
      className="w-full rounded-xl border border-border bg-muted p-2 sm:p-1.5"
    >
      {/* Flex row: [step][stretching bar][step][bar][step] — no floating short segments */}
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
        {WIZARD_STEPS.map((step, i) => {
          const isActive = i === activeIndex;
          const isDone = activeIndex > i;
          const Icon = step.icon;
          const segmentComplete = activeIndex > i;

          return (
            <Fragment key={step.id}>
              <Link
                href={step.path}
                className={cn(
                  "flex min-w-0 shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition-all sm:rounded-2xl sm:px-3.5 sm:py-2 sm:text-[13px]",
                  isActive &&
                    "bg-card text-foreground shadow-sm ring-1 ring-primary/18 dark:ring-primary/28",
                  !isActive &&
                    isDone &&
                    "text-foreground hover:bg-background/80",
                  !isActive &&
                    !isDone &&
                    "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold sm:size-9 sm:rounded-xl sm:text-xs",
                    isActive &&
                      "bg-primary text-primary-foreground shadow-sm",
                    !isActive &&
                      isDone &&
                      "bg-[#1aae39]/15 text-[#1aae39] dark:text-[#4ade80]",
                    !isActive &&
                      !isDone &&
                      "bg-background/80 text-muted-foreground ring-1 ring-border/60"
                  )}
                >
                  {isDone ? "✓" : <Icon className="size-3.5 sm:size-4" />}
                </span>
                <span className="max-w-[92px] truncate sm:max-w-none">
                  {step.shortTitle}
                </span>
              </Link>

              {i < WIZARD_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "hidden h-0.5 sm:mx-2 sm:block sm:min-w-[1rem] sm:flex-1 sm:self-center",
                    segmentComplete ? "bg-primary/45" : "bg-border"
                  )}
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
