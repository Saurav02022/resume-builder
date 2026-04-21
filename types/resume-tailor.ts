export type ResumeIssue = {
  issue: string;
  whyItMatters: string;
};

export type ResumeFix = {
  whatChanged: string;
  why: string;
  /** Verbatim LaTeX excerpt from the base file that this change replaces (multi-line OK). */
  beforeSnippet: string;
  /** Verbatim LaTeX excerpt from tailoredTex after the change (multi-line OK). */
  afterSnippet: string;
};

/** Model-derived estimate vs JD — not a score from a real ATS vendor. */
export type AtsScore = {
  /** 0–100 */
  score: number;
  /** Short label, e.g. Strong fit / Moderate / Needs work */
  band: string;
  /** Keywords, structure, gaps; be honest about limits of estimation */
  rationale: string;
};

/** Before (base resume) vs after (tailored) — same rubric for both. */
export type AtsComparison = {
  original: AtsScore;
  tailored: AtsScore;
  /** One line: what changed between the two scores (delta, main driver). */
  liftSummary: string;
};

export type TailorResumeData = {
  comparisonSummary: string;
  /** Before/after vs this JD — always set after API normalize; may be missing in older persisted sessions. */
  atsScores?: AtsComparison;
  /** Legacy single-score shape — use `lib/tailor-ats` `resolveAtsComparison()` at read time. */
  atsScore?: AtsScore;
  suggestions: string[];
  issues: ResumeIssue[];
  fixes: ResumeFix[];
  tailoredTex: string;
  candidateName?: string;
  targetCompany?: string;
  targetRole?: string;
  targetLocation?: string;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
