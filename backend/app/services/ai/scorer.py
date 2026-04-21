from app.services.ai.client import ai_client
from app.prompts.scorer import get_score_prompt
from app.models.resume import ScoreResponseData
from app.core.prompts.personas import RECRUITER_SYSTEM_INSTRUCTION

class ResumeScorer:
    @staticmethod
    def score(resume_text: str, jd_text: str) -> dict:
        prompt = get_score_prompt(resume_text, jd_text)
        return ai_client.call_genai(
            prompt=prompt,
            schema=ScoreResponseData,
            system_instruction=RECRUITER_SYSTEM_INSTRUCTION
        )

resume_scorer = ResumeScorer()
Broadway_scorer = resume_scorer # Legacy alias
