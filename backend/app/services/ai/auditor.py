from app.services.ai.client import ai_client
from app.prompts.auditor import get_jd_refinement_prompt
from app.models.resume import RefinedJD
from app.core.prompts.personas import AUDITOR_SYSTEM_INSTRUCTION

class JDAuditor:
    @staticmethod
    def refine(jd_text: str) -> dict:
        prompt = get_jd_refinement_prompt(jd_text)
        return ai_client.call_genai(
            prompt=prompt,
            schema=RefinedJD,
            system_instruction=AUDITOR_SYSTEM_INSTRUCTION
        )

jd_auditor = JDAuditor()
