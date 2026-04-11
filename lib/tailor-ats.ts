import type { AtsComparison, AtsScore, TailorResumeData } from "@/types/resume-tailor";

export function clampAtsScore(n: unknown): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function normalizeAts(raw: Partial<AtsScore> | undefined): AtsScore {
  return {
    score: clampAtsScore(raw?.score),
    band: raw?.band?.trim() || "—",
    rationale: raw?.rationale?.trim() || "",
  };
}

/** API normalization + legacy single-score sessions (Zustand). */
export function resolveAtsComparison(data: {
  atsScores?: AtsComparison;
  atsScore?: AtsScore;
}): AtsComparison {
  const raw = data.atsScores;
  const legacy = data.atsScore;

  if (raw?.original && raw?.tailored) {
    return {
      original: normalizeAts(raw.original),
      tailored: normalizeAts(raw.tailored),
      liftSummary: raw.liftSummary?.trim() || "",
    };
  }
  if (legacy) {
    const t = normalizeAts(legacy);
    return {
      original: {
        ...t,
        rationale:
          t.rationale ||
          "Legacy run — only a single score was stored. Regenerate for distinct before/after estimates.",
      },
      tailored: t,
      liftSummary:
        "Regenerate to see separate original vs tailored ATS-style scores.",
    };
  }
  return {
    original: {
      score: 0,
      band: "—",
      rationale: "Run generate on step 1 to load ATS-style estimates.",
    },
    tailored: {
      score: 0,
      band: "—",
      rationale: "Run generate on step 1 to load ATS-style estimates.",
    },
    liftSummary: "Regenerate to refresh analysis.",
  };
}

/** Normalize API payload (drops legacy field). */
export function normalizeTailorPayload(
  raw: TailorResumeData & { atsScore?: AtsScore }
): TailorResumeData {
  const { atsScore: legacy, atsScores: rawScores, fixes, ...rest } = raw;
  const normalizedFixes = (fixes ?? []).map((f) => ({
    whatChanged: typeof f.whatChanged === "string" ? f.whatChanged : "",
    why: typeof f.why === "string" ? f.why : "",
    beforeSnippet:
      typeof f.beforeSnippet === "string" ? f.beforeSnippet : "",
    afterSnippet: typeof f.afterSnippet === "string" ? f.afterSnippet : "",
  }));
  return {
    ...rest,
    fixes: normalizedFixes,
    atsScores: resolveAtsComparison({ atsScores: rawScores, atsScore: legacy }),
  };
}
