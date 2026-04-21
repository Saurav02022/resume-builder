def get_score_prompt(resume_text: str, jd_text: str) -> str:
    return f"""<data>
  <job_description>
{jd_text}
  </job_description>

  <candidate_resume>
{resume_text}
  </candidate_resume>
</data>

<constraints>
  - Base evaluation strictly on resume evidence.
  - Weight keywords, structure, and impact.
  - Return JSON matching ScoreResponseData.
</constraints>
"""
