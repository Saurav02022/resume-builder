import datetime

def get_current_date_context() -> str:
    d = datetime.datetime.now()
    return f"""<date_context>
  Today's Date: {d.strftime("%Y-%m-%d")}
  Current Year: {d.year}
  Note: When calculating durations for roles marked 'Present', use Today's Date.
</date_context>
"""

def get_tailor_prompt(resume_text: str, jd_text: str, master_template: str) -> str:
    return f"""<strict_template_mandate>
THIS IS THE ONE AND ONLY MASTER TEMPLATE YOU ARE ALLOWED TO USE. IT IS SACRED AND UNCHANGEABLE.

The exact LaTeX code inside <master_latex_template> below is your absolute skeleton.

You MUST:
- Copy the entire <master_latex_template> verbatim as the foundation of your output.
- Insert a comment on the VERY FIRST LINE of the LaTeX code: `% PDF_NAME: {{candidate_name}}_{{company_name}}_{{role}}.pdf`.
- Change ONLY the data/content.
- Keep every single character of the LaTeX structure byte-for-byte identical.
</strict_template_mandate>

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

<recruiter_optimization_rules>
1. **THE 6-SECOND SIGNAL**: Start every bullet with the most impressive word/number. No 'Responsible for' or 'Helped with'. Lead with 'Architected,' 'Scaled,' 'Saved $XM,' or 'Delivered.'
2. **TOP 1% KEYWORDS**: Dynamically extract every tool/skill from the JD. Inject them into the Skills section.
3. **QUANTITATIVE DOMINANCE**: Induce metrics from context if missing.
4. **OWNERSHIP NARRATIVE**: Frame all work as 'End-to-End Ownership'.
5. **ELITE SIMPLICITY**: Use punchy, jargon-free narratives.
6. **JSON INTEGRITY**: You MUST output the full text. Do NOT truncate. Ensure every newline is escaped as `\n` and double quotes inside the text as `\"`. 
</recruiter_optimization_rules>

<constraints>
  - **SIGNAL DENSITY**: Every character must justify its presence. No filler.
  - **AUTHORITATIVE TONE**: Use verbs that signal seniority and confidence.
  - **TRUTH WITH POLISH**: Stick to history but use aggressive recruiting strategy.
  - **TEMPLATE FIDELITY**: LaTeX skeleton must remain 100% byte-for-byte identical.
  - **NO TRUNCATION**: You are permitted to use up to 16,384 tokens. Use them to ensure the JSON is complete and valid.
</constraints>

<output_format>
Return ONLY a valid JSON object matching the TailorResponseData schema.
</output_format>
"""
