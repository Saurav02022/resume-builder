/**
 * User prompt for Gemini resume tailoring.
 *
 * Follows Gemini prompt-design best practices (ai.google.dev/gemini-api/docs/prompting-strategies):
 *   - Context first (resume + JD), then role, objective, constraints, **ground truth tenure**, JD-years philosophy, execution steps, output shape, Do NOT.
 *   - Markdown headings as delimiters (`# Identity`, `# Constraints`, `# Ground truth`, `# Output format`).
 *   - Grounding: "use ONLY the provided resume; do not use your own knowledge."
 *   - Few-shot: one abbreviated JSON example so the model locks format.
 *   - Negative instructions: explicit "do not" list.
 *
 * **Hardcoded tenure & employer rows live only in this file** (`buildAuthoritativeExperience`). Do not duplicate years/employers in `lib/tailor-resume.ts`.
 * Keep the table in sync with `\\section{Experience}` in `public/original-resume.tex`.
 * **Today's date** is injected at runtime so "Present" tenure uses the actual calendar year/day.
 *
 * System instruction + generationConfig (temperature, responseSchema) live in `lib/tailor-resume.ts`.
 */

/** Local YYYY-MM-DD + year (server timezone) so "Present" matches the day the user runs Generate. */
function formatLocalCalendarDate(d: Date): { isoDate: string; year: number } {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { isoDate: `${year}-${month}-${day}`, year };
}

/** Hard anchor for JD "N+ years" — edit table if `public/original-resume.tex` Experience changes. */
function buildAuthoritativeExperience(asOf: Date): string {
  const { isoDate, year } = formatLocalCalendarDate(asOf);

  return `
# Reference date (for "Present" and tenure math)

- **Today's date (when this API runs):** ${isoDate}
- **Current year:** ${year}

Interpret \`Nov 2024 -- Present\` as **through ${isoDate}** (year **${year}**) when you count months or years for the Shikha role and when you sum cumulative Experience time. **Do not** assume a different year or an old "today" from training.

---

# Authoritative professional experience (must use in scores & gaps)

These rows are fixed from the candidate's resume. **You must treat this cumulative tenure as ground truth** when the JD mentions "N+ years" or when writing \`atsScores.*.rationale\`, \`issues\`, \`suggestions\`, or \`comparisonSummary\` about years — do not substitute a lower number from only the "Present" role.

| Employer | Role | Dates |
|----------|------|--------|
| **Nuveb** | Full Stack Developer | May 2023 -- Sep 2024 |
| **Shikha Learning Labs** | Next.js Developer | Nov 2024 -- Present |

**Cumulative professional software experience (Experience section): approximately 2.8--3.0+ years** when both roles are summed (Nuveb ~16 months + Shikha from Nov 2024 through **${isoDate}**). For a typical "3+ years" JD requirement, frame this as **at or very near** that bar — **not** as ~1.5--2.0 years total and **not** as only the current role's length.

**How to report this vs a "3+ years" JD (no contradiction):**
- In \`atsScores.*.rationale\` and \`comparisonSummary\`, you may note that some ATS or recruiters apply **strict numeric filters** — that is **nuance**, not proof that the candidate "fails" the requirement.
- **Do not** add an \`issues[]\` item whose main point is "slightly under 3 years" / "under 3 years" / "years shortfall" when the authoritative cumulative above already places the candidate **at or very near** 3+ years — that duplicates and contradicts this section. Put optional interview/ATS-filter advice in \`suggestions\` instead.
- **Do** use \`issues[]\` for **clear** gaps (e.g. no Headless CMS evidence when the JD asks for it).
`.trim();
}

export function buildTailorResumePrompt(
  baseResumeTex: string,
  jobDescription: string
): string {
  const authoritativeExperience = buildAuthoritativeExperience(new Date());

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

**North star:** Always be clear on **what the JD asks for** vs **what the resume honestly shows** (stack, scope, outcomes, tenure). Then **make the tailored resume so compelling** — tight ordering, JD language, concrete proof — that a **human or ATS-style read** leads with **fit and impact**, not with “they wanted N years vs I have M years.” You cannot fabricate time on the job; you **can** make the **substance** hard to ignore.

# Constraints

- **Grounding (critical):** Use ONLY facts from the base resume above. Do not access your own knowledge to add employers, titles, dates, certifications, tools, or metrics that are not present in the LaTeX source.
- **No hallucination:** If a JD requirement has no evidence in the resume, report it as an \`issue\` — do NOT fabricate it in \`tailoredTex\`.
- **One page:** \`tailoredTex\` must compile to exactly one US-Letter page. No \`\\newpage\`. Shorten bullets if needed.
- **Same macros:** Keep the same LaTeX commands (\`\\resumeSubheading\`, \`\\resumeItem\`, etc.) and preamble.
- **Keywords — quality over stuffing:** Weave roughly 8–15 strong JD terms where truthfully supported. Do not repeat the same keyword excessively.

---

# Ground truth — tenure & dates (read this before scoring or tailoring)

${authoritativeExperience}

# Reconcile tenure from the LaTeX (must match the table above)

If you reconcile dates from the LaTeX yourself, you must still reach **the same conclusion** as the authoritative table: **two** Experience roles, cumulative **~2.8--3.0+ years**, never "~2 years" or "~1.5 years" total from one role only.

1. Open \`\\section{Experience}\`. Each \`\\resumeSubheading\` has \`{Title}{Date range}\` then employer.
2. Parse every role. "Present" means **through the reference date** in the **Ground truth** section above (same as server "today").
3. **Cumulative = sum of each role's span.** Gaps do not erase prior roles.
4. **Never** use only the Present role as total experience when Nuveb is also listed.

# JD “N+ years” vs resume tenure — substance over calendar

Apply **after** you have absorbed the **Ground truth** section above.

1. **Want vs have (always):** Internally list what this JD **emphasizes** (must-haves, nice-to-haves, tools, seniority, keywords) and what the resume **actually contains** — then tailor and score from that map. **Goal:** after tailoring, the **resume narrative** should be **so JD-aligned and evidence-rich** that a fair reviewer’s attention goes to **what you did and how it matches the role**, not to a raw year-count comparison. **Never** invent tenure; **do** maximize truthful signal per line.
2. From the job description, note any **explicit year requirement** (e.g. “5+ years”, “3+ years of frontend”). From the resume and the **Authoritative professional experience** block in **Ground truth** above, note **honest cumulative tenure** — never inflated.
3. **Does the gap matter for “fit”?** Distinguish:
   - **Automated / strict numeric filters** — Some ATS or forms reject below a threshold. That is an **employer-side process constraint**, not proof the candidate is unqualified. You may mention it briefly as **risk** or in \`suggestions\` (“some systems filter on X years”). **Do not** write as if that filter mistake is the candidate’s fault or the main story of the resume.
   - **Substance** — Ownership, complexity, stack match, scope, and **measurable outcomes in bullets** can show readiness that **calendar years alone** do not capture. When bullets support strong relevant work, **do not** declare the candidate a **poor fit primarily because** tenure is below the JD number.
4. **Tailoring priority:** Improve **bullet strength, order, and JD-aligned evidence** (what they built, scale, outcomes, keywords). **Never** invent employers, dates, or extra years. Honest reframing and emphasis are encouraged; fabrication is forbidden. The **tailored** version should read like a **strong case for this role** — not a defense of years of service.
5. **Scoring (\`atsScores\`):** Weight **keyword fit, structure, and evidence** above a simple “JD asks N years, resume shows M” comparison. If M < N, you may note it as **one factor** or **filter nuance**, but **not** as the headline reason for a low score when skills and evidence align well. **Reserve \`issues[]\`** for missing **tools, skills, or domain evidence** with no honest anchor — **not** for “JD wants 5 years, we have 3–4” as a standalone \`issue\` unless you are also clearly separating **missing skill evidence** from years (years alone → suggestions or rationale nuance, not a fake “gap” issue).
6. The **Ground truth** / **Authoritative professional experience** section adds **candidate-specific** rules (cumulative math, “at or very near” thresholds, reporting Headless CMS vs years). **Do not contradict** it.

# Step-by-step execution (internal reasoning — do not output these steps as separate JSON keys)

1. **Read the full resume** — build an internal inventory: Education, Training, every Experience role (employer + verbatim dates), Projects, Technical Skills.
2. **Read the job description** — extract must-haves, nice-to-haves, tools, seniority, N+ years rules, keywords.
3. **Map JD → resume** — for each JD requirement, find specific resume evidence (section + bullet). No evidence for a **tool/skill** = good \`issues[]\` candidate. For **years**: follow the authoritative block — if cumulative is **at or very near** the JD threshold, do **not** invent a separate "years gap" \`issue\` (see authoritative rules above).
4. **Score original** → \`atsScores.original\` (score 0–100, band, rationale 2–4 sentences).
5. **Edit LaTeX** → \`tailoredTex\` (full file \\documentclass…\\end{document}). Reorder bullets to front-load JD-relevant wins. Mirror JD language where truthful. Tighten for one page. Prefer **stronger bullets** over apologizing for years; if JD asks more years than the resume shows, **do not** waste space on excuses — show **impact and scope** that support the application.
6. **Score tailored** → \`atsScores.tailored\`. Should be ≥ original unless explained.
7. **Fill remaining fields** — \`liftSummary\`, \`comparisonSummary\`, \`suggestions\`, \`issues\`, \`fixes\`. For \`suggestions\`, prioritize **skills, impact, collaboration, and honest prep for real gaps** — not a list about how to verbally justify years of experience.

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
- Do not report ~1.5--2.0 years of **total** professional experience — the authoritative cumulative is **~2.8--3.0+ years** (see table above).
- Do not inflate \`tailored.score\` past 90 if hard must-haves (e.g. specific tools with zero resume evidence) are truly absent. **Do not** treat "3+ years" as failed if authoritative cumulative is **~2.8--3.0+ years** — that is **near** the bar, not a missing credential in the same sense as a missing tool.
- Do not write \`atsScores.*.rationale\` or \`comparisonSummary\` that sound like “only M years on the resume vs N in the JD, therefore not a good candidate” when **keywords, structure, and bullet evidence** support a stronger story — acknowledge numeric mismatch only as **secondary** nuance or filter risk, not as the verdict.
- Do not add a second page to \`tailoredTex\`.
- Do not center \`suggestions\` on "how many years to claim" or "how to explain the year gap" **unless** one short tip is truly additive; the resume’s job is to make **years a side note** when evidence is strong.
`;
}
