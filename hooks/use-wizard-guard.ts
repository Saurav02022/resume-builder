"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { routes } from "@/config/routes";
import { useWizardStore } from "@/store/wizard-store";

/**
 * Sends user back to the job step if review/export is opened without generated data.
 */
export function useWizardGuard(requires: "review" | "export") {
  const router = useRouter();
  const tailorData = useWizardStore((s) => s.tailorData);

  useEffect(() => {
    if ((requires === "review" || requires === "export") && !tailorData) {
      router.replace(routes.resume.job);
    }
  }, [requires, tailorData, router]);
}
