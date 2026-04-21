"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { TailorResumeData } from "@/types/resume-tailor";

type WizardState = {
  originalText: string;
  originalFileName: string;
  jd: string;
  tailorData: TailorResumeData | null;
  setOriginalText: (text: string) => void;
  setOriginalFileName: (name: string) => void;
  setJd: (jd: string) => void;
  setTailorData: (data: TailorResumeData | null) => void;
  resetWizard: () => void;
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      originalText: "",
      originalFileName: "",
      jd: "",
      tailorData: null,
      setOriginalText: (originalText) => set({ originalText }),
      setOriginalFileName: (originalFileName) => set({ originalFileName }),
      setJd: (jd) => set({ jd }),
      setTailorData: (tailorData) => set({ tailorData }),
      resetWizard: () => set({ originalText: "", originalFileName: "", jd: "", tailorData: null }),
    }),
    {
      name: "resume-wizard-v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        originalText: state.originalText,
        originalFileName: state.originalFileName,
        jd: state.jd,
        tailorData: state.tailorData,
      }),
    }
  )
);
