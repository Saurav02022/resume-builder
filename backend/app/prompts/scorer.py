def get_score_prompt(resume_text: str, jd_text: str) -> str:
    return f"""<task>
Score the candidate resume against the job description and return one JSON
object matching `ScoreResponseData`.
</task>

<data>
  <job_description>
{jd_text}
  </job_description>

  <candidate_resume>
{resume_text}
  </candidate_resume>
</data>

<rubric>
Compute a single 0 to 100 ATS-style score using these weighted dimensions:
- Keyword and stack alignment: 40
  Coverage of must-have tools, languages, frameworks, and domain terms from the JD.
- Evidence and impact: 25
  Bullets that show ownership, scope, and outcomes that already exist in the
  resume. Do not reward absent metrics.
- Structure and readability: 20
  Section order, action-led bullets, density, and one-page hygiene.
- Seniority and scope match: 15
  Match between JD seniority signals and the resume's demonstrated scope.

Bands:
- 85 to 100: "Strong fit"
- 70 to 84:  "Good fit"
- 55 to 69:  "Moderate fit"
-  0 to 54:  "Needs work"

Tie-breakers:
- If a sub-total lands within 1 point of a band threshold, drop to the lower band
  unless every must-have keyword is covered with concrete resume evidence.
- Drop one full band if must-have coverage is below 60 percent.
- Raise one full band only if must-have coverage is 100 percent AND every claim
  has supporting evidence in bullets (not just a skills list).
</rubric>

<grounding_rules>
- Use the JD as the requirement source and the resume as the evidence source.
- Do not assume skills not stated in the resume.
- Tenure shortfall vs JD years is a secondary factor; surface it in `rationale`,
  not as the headline reason for a low score, when bullet evidence is strong.
</grounding_rules>

<output_format>
Return ONE JSON object matching `ScoreResponseData`:
{{
  "ats_score": {{
    "score": <int 0-100>,
    "band": "<Strong fit|Good fit|Moderate fit|Needs work>",
    "rationale": "<2 to 4 sentences: keyword fit, structure, evidence, gaps>"
  }}
}}
No markdown fences. No prose outside the JSON.
</output_format>
"""
