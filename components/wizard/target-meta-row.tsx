import { Briefcase, Building2, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TailorResumeData } from "@/types/resume-tailor";

type TargetMetaRowProps = {
  data: Pick<TailorResumeData, "targetCompany" | "targetRole" | "targetLocation">;
  className?: string;
};

type Pill = {
  icon: typeof Briefcase;
  label: string;
  value: string | undefined;
};

function isMeaningful(value: string | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return trimmed.toLowerCase() !== "unknown";
}

/**
 * Tailoring target chip row for wizard hero blocks.
 * Hides any pill whose value is missing or "Unknown" (matches the backend
 * fallback contract in `RefinedJD`).
 */
export function TargetMetaRow({ data, className }: TargetMetaRowProps) {
  const pills: Pill[] = [
    { icon: Briefcase, label: "Role", value: data.targetRole },
    { icon: Building2, label: "Company", value: data.targetCompany },
    { icon: MapPin, label: "Location", value: data.targetLocation },
  ];

  const visible = pills.filter((p) => isMeaningful(p.value));
  if (visible.length === 0) return null;

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-2 pt-1",
        className
      )}
      aria-label="Tailoring target"
    >
      {visible.map(({ icon: Icon, label, value }) => (
        <li key={label}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground/80"
            title={`${label}: ${value}`}
          >
            <Icon className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="sr-only">{label}: </span>
            <span className="truncate max-w-56">{value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
