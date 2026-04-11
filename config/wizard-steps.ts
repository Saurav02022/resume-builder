import type { LucideIcon } from "lucide-react";
import { FileDown, GitCompare, Sparkles } from "lucide-react";

import { routes } from "@/config/routes";

/**
 * One entry = one screen. Add a route under `app/resume/` + entry here.
 */
export type WizardStepId = "job" | "review" | "export";

export type WizardStepMeta = {
  id: WizardStepId;
  path: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
};

export const WIZARD_STEPS: WizardStepMeta[] = [
  {
    id: "job",
    path: routes.resume.job,
    title: "Job description & generate",
    shortTitle: "Job",
    description: "Paste posting and generate",
    icon: Sparkles,
  },
  {
    id: "review",
    path: routes.resume.review,
    title: "Review",
    shortTitle: "Review",
    description: "Diff and analytics",
    icon: GitCompare,
  },
  {
    id: "export",
    path: routes.resume.export,
    title: "Export",
    shortTitle: "Export",
    description: "Download files",
    icon: FileDown,
  },
];
