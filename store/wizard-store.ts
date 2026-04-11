"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TailorResumeData } from "@/types/resume-tailor";

type WizardState = {
  jd: string;
  tailorData: TailorResumeData | null;
  setJd: (jd: string) => void;
  setTailorData: (data: TailorResumeData | null) => void;
  resetWizard: () => void;
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      jd: "",
      tailorData: null,
      setJd: (jd) => set({ jd }),
      setTailorData: (tailorData) => set({ tailorData }),
      resetWizard: () => set({ jd: "", tailorData: null }),
    }),
    {
      name: "resume-wizard-v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        jd: state.jd,
        tailorData: state.tailorData,
      }),
    }
  )
);
