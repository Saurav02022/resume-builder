"use client";

import { diffLines } from "diff";

import { cn } from "@/lib/utils";

type MiniGitDiffProps = {
  before: string;
  after: string;
  className?: string;
};

/**
 * Compact unified diff (line-based) for a single change — same spirit as `git diff`.
 */
export function MiniGitDiff({ before, after, className }: MiniGitDiffProps) {
  const a = before ?? "";
  const b = after ?? "";

  if (!a.trim() && !b.trim()) {
    return (
      <p className="text-xs text-muted-foreground">
        No snippet — regenerate to capture before/after LaTeX for this fix.
      </p>
    );
  }

  const parts = diffLines(a, b);

  return (
    <div
      className={cn(
        "max-h-56 overflow-auto rounded-md border border-border/80 bg-muted/25 font-mono text-[11px] leading-snug",
        className
      )}
    >
      {parts.flatMap((part, partIndex) => {
        const raw = part.value.endsWith("\n")
          ? part.value.slice(0, -1)
          : part.value;
        const lines = raw === "" ? [] : raw.split("\n");
        return lines.map((line, lineIndex) => {
          const isAdd = Boolean(part.added);
          const isRem = Boolean(part.removed);
          const prefix = isAdd ? "+" : isRem ? "-" : " ";
          return (
            <div
              key={`${partIndex}-${lineIndex}`}
              className={cn(
                "flex gap-1 border-b border-border/30 px-2 py-0.5 last:border-b-0",
                isAdd &&
                  "bg-emerald-500/15 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-100",
                isRem &&
                  "bg-red-500/12 text-red-950 dark:bg-red-500/10 dark:text-red-100",
                !isAdd &&
                  !isRem &&
                  "text-muted-foreground/90 dark:text-muted-foreground"
              )}
            >
              <span
                className="w-4 shrink-0 select-none text-center font-sans text-[10px] opacity-70"
                aria-hidden
              >
                {prefix}
              </span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">
                {line}
              </span>
            </div>
          );
        });
      })}
    </div>
  );
}
