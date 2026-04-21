from app.services.ai.client import ai_client
from app.prompts.architect import get_tailor_prompt
from app.models.resume import TailorResponseData
from app.core.prompts.personas import RECRUITER_SYSTEM_INSTRUCTION

class ResumeArchitect:
    @staticmethod
    def tailor(resume_text: str, jd_text: str, master_template: str) -> dict:
        prompt = get_tailor_prompt(resume_text, jd_text, master_template)
        return ai_client.call_genai(
            prompt=prompt,
            schema=TailorResponseData,
            system_instruction=RECRUITER_SYSTEM_INSTRUCTION
        )

resume_architect = ResumeArchitect()
