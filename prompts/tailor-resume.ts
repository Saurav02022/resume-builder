/**
 * User prompt for Gemini resume tailoring.
 *
 * Follows Gemini prompt-design best practices (ai.google.dev/gemini-api/docs/prompting-strategies):
 *   - Context first, task last (long context → anchor → instructions at the end).
 *   - Markdown headings as delimiters (`# Identity`, `# Constraints`, `# Output format`).
 *   - Grounding: "use ONLY the provided resume; do not use your own knowledge."
 *   - Few-shot: one abbreviated JSON example so the model locks format.
 *   - Negative instructions: explicit "do not" list.
 *
 * System instruction + generationConfig (temperature, responseSchema) live in `lib/tailor-resume.ts`.
 */

export function buildTailorResumePrompt(
  baseResumeTex: string,
  jobDescription: string
): string {
  return `
# Context — Base resume (LaTeX source, complete file)

\`\`\`latex
${baseResumeTex}
\`\`\`

# Context — Job description

\`\`\`
${jobDescription}
\`\`\`

---

Based on the two context blocks above, perform the task below.

---

# Identity

You are a **senior technical recruiter and ATS analyst** who has reviewed 10,000+ resumes. You never skim — you read every section, every date, every bullet before forming any judgment.

# Objective

Produce a single JSON object (no markdown fences, no text outside the JSON) that:

1. **Scores** the original resume against the job description (ATS-style estimate, not a real vendor score).
2. **Tailors** the resume LaTeX for maximum honest alignment with the JD.
3. **Scores** the tailored version against the same JD.
4. **Lists** gaps, fixes, and actionable suggestions.

# Constraints

- **Grounding (critical):** Use ONLY facts from the base resume above. Do not access your own knowledge to add employers, titles, dates, certifications, tools, or metrics that are not present in the LaTeX source.
- **No hallucination:** If a JD requirement has no evidence in the resume, report it as an \`issue\` — do NOT fabricate it in \`tailoredTex\`.
- **One page:** \`tailoredTex\` must compile to exactly one US-Letter page. No \`\\newpage\`. Shorten bullets if needed.
- **Same macros:** Keep the same LaTeX commands (\`\\resumeSubheading\`, \`\\resumeItem\`, etc.) and preamble.
- **Keywords — quality over stuffing:** Weave roughly 8–15 strong JD terms where truthfully supported. Do not repeat the same keyword excessively.

# How to compute "years of experience" (important — read carefully)

The job description may ask for "N+ years" of experience. Follow these rules:

1. Open the \`\\section{Experience}\` in the resume. Each \`\\resumeSubheading\` has \`{Title}{Date range}\` then employer.
2. Parse **every** role's date range. "Present" means today's date.
3. **Cumulative experience = sum of each role's individual span.** Gaps between jobs do not erase prior tenure.
4. **Never** report only the current/Present role's duration as the candidate's total experience when other roles exist.

**Example from this resume:**
- Nuveb — Full Stack Developer — May 2023 to Sep 2024
- Shikha Learning Labs — Next.js Developer — Nov 2024 to Present
- Total: compute each span from its dates, then sum them. The result is well over 2.5 years and continues to grow.

Use this cumulative figure in \`atsScores.*.rationale\`, \`issues\`, and \`comparisonSummary\`.

# Step-by-step execution (internal reasoning — do not output these steps as separate JSON keys)

1. **Read the full resume** — build an internal inventory: Education, Training, every Experience role (employer + verbatim dates), Projects, Technical Skills.
2. **Read the job description** — extract must-haves, nice-to-haves, tools, seniority, N+ years rules, keywords.
3. **Map JD → resume** — for each JD requirement, find specific resume evidence (section + bullet). No evidence = gap.
4. **Score original** → \`atsScores.original\` (score 0–100, band, rationale 2–4 sentences).
5. **Edit LaTeX** → \`tailoredTex\` (full file \\documentclass…\\end{document}). Reorder bullets to front-load JD-relevant wins. Mirror JD language where truthful. Tighten for one page.
6. **Score tailored** → \`atsScores.tailored\`. Should be ≥ original unless explained.
7. **Fill remaining fields** — \`liftSummary\`, \`comparisonSummary\`, \`suggestions\`, \`issues\`, \`fixes\`.

# Output format

Return exactly one JSON object. Required shape:

\`\`\`
{
  "comparisonSummary": "2–4 sentences: before vs after tailoring.",
  "atsScores": {
    "original": { "score": 72, "band": "Moderate fit", "rationale": "..." },
    "tailored": { "score": 88, "band": "Good fit", "rationale": "..." },
    "liftSummary": "One sentence: what changed and why."
  },
  "suggestions": ["tip 1", "tip 2"],
  "issues": [
    { "issue": "Short description", "whyItMatters": "Why recruiters care" }
  ],
  "fixes": [
    {
      "whatChanged": "Short title",
      "why": "Why it improves JD fit",
      "beforeSnippet": "EXACT substring from the base resume above",
      "afterSnippet": "EXACT matching substring from your tailoredTex"
    }
  ],
  "tailoredTex": "\\\\documentclass... full file ...\\\\end{document}"
}
\`\`\`

# Do NOT

- Do not output markdown fences around the JSON.
- Do not add text before or after the JSON object.
- Do not invent experience, dates, employers, or tools.
- Do not report ~1.5–1.8 years of total experience when multiple Experience roles exist (see "How to compute years" above).
- Do not inflate \`tailored.score\` past 90 if hard must-haves (specific tools or years) are truly absent.
- Do not add a second page to \`tailoredTex\`.
`;
}
