def get_jd_refinement_prompt(raw_jd: str) -> str:
    return f"""<data>
  <raw_job_description>
{raw_jd}
  </raw_job_description>
</data>

<filtering_rules>
1. **DE-NOISING**: Remove all legal boilerplates, diversity statements, office perks, benefits, and generic company history.
2. **SIGNAL EXTRACTION**: Identify the MUST-HAVE technical stack, specific frameworks, and the core engineering problems they are trying to solve.
3. **TONE AUDIT**: Identify if they value "Speed of Delivery", "Scalability", "Security", or "Innovation".
4. **SENIORITY CALCULATION**: Determine the true level (Junior, Mid, Senior, Lead, Staff) regardless of the title.
</filtering_rules>

<output_format>
Return a structured JSON object as defined by the RefinedJD schema. Be concise. No filler.
</output_format>
"""
