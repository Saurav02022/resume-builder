def get_jd_refinement_prompt(raw_jd: str) -> str:
    return f"""<task>
Reduce the raw job description below to a structured `RefinedJD` JSON object.
</task>

<data>
  <raw_job_description>
{raw_jd}
  </raw_job_description>
</data>

<extraction_rules>
1. role_title (string):
   - Use the exact title in the JD if stated. If multiple, pick the primary one.
   - Fallback: "Unknown".
2. company_name (string):
   - Use the company name as written.
   - Fallback: "Unknown".
3. location (string):
   - Use the location as written (e.g., "Bengaluru", "Remote", "Hybrid - Berlin").
   - If the JD lists multiple, pick the primary one.
   - Fallback: "Unknown".
4. core_tech_stack (List[str]):
   - Include only must-have items. A must-have is anything the JD lists under
     "Requirements", "Must have", "You will need", or phrases like "required",
     "experience with X", "proficient in X", "strong knowledge of X".
   - Exclude items framed as "nice to have", "a plus", "bonus", "preferred",
     "experience in any of", or generic adjectives ("modern", "cloud").
   - Deduplicate. Use canonical names (e.g., "Node.js", "PostgreSQL", "AWS").
   - Fallback: [].
5. is_senior_role (bool):
   - true if any of these hold:
     a. Title contains Senior, Lead, Staff, Principal, Architect, or Manager.
     b. JD requires 6 or more years of experience.
     c. JD lists ownership of services, mentorship, technical leadership,
        or cross-team scope as a core responsibility.
   - false otherwise. If the JD says "4-6 years" and no leadership signals
     are present, set false.
6. primary_responsibilities (List[str]):
   - 3 to 6 items. Each starts with a present-tense verb (e.g., "Build",
     "Own", "Lead", "Design", "Ship", "Operate", "Mentor").
   - Drop legal, EEO, perks, benefits, history, and culture filler.
   - Fallback: [].
7. required_years (Optional[str]):
   - Copy the exact phrase if present (e.g., "5+ years", "3-5 years").
   - Fallback: null.
8. tone_and_culture (List[str]):
   - 0 to 4 short tags inferred from the JD itself
     (e.g., "Fast-paced", "Scalable systems", "Product-led", "Security-first").
   - Fallback: [] (empty list, not omitted).
</extraction_rules>

<constraints>
- Use only what is stated or directly implied in the JD.
- Do not invent companies, technologies, seniority signals, or culture tags.
- If the JD is not in English, translate values to English while preserving
  technology names (do not translate "Node.js", "Kubernetes").
- Be concise. No marketing language.
</constraints>

<output_format>
Return one JSON object matching `RefinedJD`. Keys must match the schema exactly.
No markdown fences. No prose outside the JSON.
</output_format>
"""
