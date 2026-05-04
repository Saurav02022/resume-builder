from app.services.ai.auditor import jd_auditor
from app.services.ai.architect import resume_architect
from app.services.document.template import template_loader

class TailorOrchestrator:
    @staticmethod
    def run_pipeline(resume_text: str, raw_jd: str) -> dict:
        # Stage 1: Auditor
        refined_jd = jd_auditor.refine(raw_jd)
        
        # Format for Architect
        cleaned_jd_summary = (
            f"Title: {refined_jd.get('role_title')}\n"
            f"Company: {refined_jd.get('company_name')}\n"
            f"Location: {refined_jd.get('location', 'Unknown')}\n"
            f"Required Tech: {', '.join(refined_jd.get('core_tech_stack', []))}\n"
            f"Core Tasks: {'; '.join(refined_jd.get('primary_responsibilities', []))}\n"
            f"Culture: {', '.join(refined_jd.get('tone_and_culture', []))}"
        )
        
        # Get Template
        template = template_loader.get_master_template()
        
        # Stage 2: Architect
        data = resume_architect.tailor(resume_text, cleaned_jd_summary, template)
        
        # Inject refined data for analytics
        data["refined_jd"] = refined_jd
        return data

tailor_orchestrator = TailorOrchestrator()
