import os
from app.core.config import settings

class TemplateLoader:
    @staticmethod
    def get_master_template() -> str:
        template_path = os.path.join(settings.ASSETS_DIR, "original-resume.tex")
        try:
            if os.path.exists(template_path):
                with open(template_path, "r") as f:
                    return f.read()
            return "Standard LaTeX Resume Format"
        except Exception:
            return "Standard LaTeX Resume Format"

template_loader = TemplateLoader()
