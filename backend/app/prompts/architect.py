import datetime


def get_current_date_context() -> str:
    d = datetime.datetime.now()
    return (
        "<date_context>\n"
        f"  today_iso: {d.strftime('%Y-%m-%d')}\n"
        f"  current_year: {d.year}\n"
        "  Note: For any role marked 'Present', compute tenure through today_iso.\n"
        "</date_context>"
    )


def get_tailor_prompt(resume_text: str, jd_text: str, master_template: str) -> str:
    return f"""<task>
Tailor the candidate resume to the target role described below and return one JSON
object that exactly matches the `TailorResponseData` schema.
</task>

<input_contract>
- <job_description> is a structured digest produced by an upstream auditor pass.
  It contains: Title, Company, Location, Required Tech, Core Tasks, Culture.
  Do NOT re-derive these. Treat them as authoritative for those fields.
- Salary and years-of-experience may be absent from the digest. If absent, do
  not invent them; use the metadata fallbacks below.
- <candidate_resume> is the full original resume text and is the only source of
  truth for candidate facts.
- <master_latex_template> is the structural skeleton you must reuse verbatim
  except for the single addition allowed in <template_rules>.
</input_contract>

{get_current_date_context()}

<master_latex_template>
{master_template}
</master_latex_template>

<data>
  <job_description>
{jd_text}
  </job_description>

  <candidate_resume>
{resume_text}
  </candidate_resume>
</data>

<grounding_rules>
- Use only facts present in <candidate_resume>. Do not invent employers, titles,
  dates, tools, certifications, metrics, or outcomes.
- If a Required Tech item has no resume evidence, do not add it to `tailored_tex`.
  Surface it instead in `comparisonSummary` and `suggestions`.
- Do not introduce dollar amounts, percentages, user counts, or latency numbers
  unless that exact figure already appears in the resume.
</grounding_rules>

<template_rules>
- Reuse the document class, preamble, macros (\\resumeSubheading, \\resumeItem,
  etc.), section order, and spacing exactly as in <master_latex_template>.
- The only allowed structural addition is a single comment as the first line of
  `tailored_tex`:
  `% PDF_NAME: <CandidateName>_<CompanyName>_<RoleName>.pdf`
  Replacement rules:
    - Strip non-ASCII characters; transliterate if possible.
    - Replace any whitespace, punctuation, or symbol with `_`.
    - Collapse repeated underscores into one.
    - Keep the literal `.pdf` suffix.
- One US-Letter page only. Use these hard caps to enforce it:
    - At most 2 experience roles by default; if the resume has more, keep the 2
      most JD-relevant.
    - At most 4 bullets per role.
    - At most 3 projects.
    - Skills section: at most 6 lines.
- No \\newpage. No additional sections beyond what the template defines.
</template_rules>

<tailoring_rules>
1. Treat <job_description> Required Tech as the keyword target set.
2. For each Required Tech item, find the strongest truthful evidence in the
   resume and place it earlier in its section (top of bullets, front of skill
   line). If no evidence exists, leave it out of `tailored_tex` and record it
   as a gap.
3. Bullet style:
   - Start with a strong action verb (Built, Led, Migrated, Reduced, Shipped,
     Owned, Scaled).
   - Mirror Required Tech vocabulary only when the resume already supports the
     underlying work.
   - Preserve existing metrics verbatim. Do not add or modify metrics.
   - One line per bullet where possible.
4. Skills section: list only tools that appear in the resume. Order them so
   that Required Tech items appear first.
5. Keyword target: cover at least 70 percent of the Required Tech list inside
   `tailored_tex`, only where truthful.
</tailoring_rules>

<scoring_rules>
Produce two ATS-style scores in `ats_comparison`. Use this rubric for both
`original` and `tailored` (must match the standalone scorer's rubric):

Weighted dimensions (total 100):
- Keyword and stack alignment: 40
- Evidence and impact:         25
- Structure and readability:   20
- Seniority and scope match:   15

Bands:
- 85 to 100: "Strong fit"
- 70 to 84:  "Good fit"
- 55 to 69:  "Moderate fit"
-  0 to 54:  "Needs work"

Tie-breakers:
- Drop one band if Required Tech coverage in the scored text is below 60 percent.
- Raise one band only if every Required Tech item is supported by concrete
  resume evidence.

Each score returns: {{ score: int, band: str, rationale: 2-4 sentences }}.
`tailored.score` must be greater than or equal to `original.score`. If lower,
state the structural reason in `liftSummary`.
</scoring_rules>

<metadata_rules>
- candidate_name: extract from the resume header (full name, ASCII transliteration
  if needed).
- target_company: take from the digest's Company field; fallback "Unknown".
- target_role: take from the digest's Title field; fallback "Unknown".
- target_location: take from the digest's Location field; fallback "Unknown".
  Do not guess from company or culture.
- comparisonSummary: 2 to 4 sentences. Scope = how the candidate maps to this JD
  end to end (fit, evidence, gaps). Do not duplicate `liftSummary`.
- liftSummary: ONE sentence. Scope = the delta between original and tailored
  scores and the single biggest driver of that change.
- suggestions: 3 to 6 actionable, non-fabricating tips the candidate can act on
  (e.g., "Add a project demonstrating X", "Quantify impact in bullet Y").
</metadata_rules>

<output_format>
Return ONE JSON object satisfying `TailorResponseData`. Keys: tailored_tex,
candidate_name, target_company, target_role, target_location, ats_comparison
(original, tailored, liftSummary), comparisonSummary, suggestions.
No markdown fences. No prose outside the JSON.
</output_format>
"""
