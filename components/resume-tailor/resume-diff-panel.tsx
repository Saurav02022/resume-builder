"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const ReactDiffViewer = dynamic(
  () => import("react-diff-viewer-continued").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[min(70vh,560px)] w-full rounded-lg" />
    ),
  }
);

function usePrefersDark(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false
  );
}

type ResumeDiffPanelProps = {
  oldValue: string;
  newValue: string;
};

/**
 * Side-by-side diff (git-style) for base `.tex` vs tailored output.
 * Large files: `showDiffOnly` keeps the view usable.
 */
export function ResumeDiffPanel({ oldValue, newValue }: ResumeDiffPanelProps) {
  const useDarkTheme = usePrefersDark();

  return (
    <div className="resume-diff-viewer overflow-x-auto rounded-xl border border-border bg-card ring-1 ring-foreground/5">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView
        leftTitle="Current (base)"
        rightTitle="Tailored to JD"
        useDarkTheme={useDarkTheme}
        showDiffOnly
        extraLinesSurroundingDiff={5}
          hideLineNumbers={false}
        />
      </div>
  );
}
