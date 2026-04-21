from typing import List, Optional
from pydantic import BaseModel, Field

# -------------------------
# Shared sub-models
# -------------------------

class ResumeIssue(BaseModel):
    issue: str = Field(description="What was weak or misaligned vs the JD.")
    whyItMatters: str = Field(description="Why recruiters or ATS care for this JD.")

class ResumeFix(BaseModel):
    whatChanged: str = Field(description="Short title: what changed (section/bullet level).")
    why: str = Field(description="Why this improves JD fit while staying truthful.")

class AtsScore(BaseModel):
    score: int = Field(description="0-100 ATS-style alignment of the resume vs the JD.")
    band: str = Field(description="Short label, e.g. Strong fit / Moderate / Needs work.")
    rationale: str = Field(description="2-4 sentences: keywords, structure, gaps.")

class AtsComparison(BaseModel):
    original: AtsScore = Field(description="ATS-style score for the resume BEFORE tailoring.")
    tailored: AtsScore = Field(description="ATS-style score for the resume AFTER tailoring.")
    liftSummary: str = Field(description="One line: what changed between the two scores (delta, main driver).")

class RefinedJD(BaseModel):
    role_title: str = Field(description="The formal title of the role (e.g., Senior Software Engineer).")
    company_name: str = Field(description="The name of the company.")
    core_tech_stack: List[str] = Field(description="Clean list of required languages, frameworks, and tools.")
    is_senior_role: bool = Field(description="Whether the JD implies Senior, Lead, or Staff level responsibility.")
    primary_responsibilities: List[str] = Field(description="High-signal list of what the person actually does (no fluff).")
    required_years: Optional[str] = Field(description="Experience required (e.g. '5+ years').")
    tone_and_culture: List[str] = Field(description="Keywords describing the company's engineering culture (e.g. Fast-paced, Scalable, Product-led).")

# -------------------------
# API 2 & 4: Score Response
# -------------------------
class ScoreResponseData(BaseModel):
    ats_score: AtsScore

# -------------------------
# API 3: Tailor Response
# -------------------------
class TailorResponseData(BaseModel):
    tailored_tex: str = Field(description="The full, tailored resume in raw LaTeX code.")
    candidate_name: str = Field(description="The full name of the candidate extracted from the resume.")
    target_company: str = Field(description="The name of the company from the JD.")
    target_role: str = Field(description="The target role name from the JD.")
    target_location: str = Field(description="The location/city for the role (e.g. Remote, New York).")
    ats_comparison: AtsComparison = Field(description="Dual-pass ATS assessment (before vs after).")
    comparisonSummary: str = Field(description="2-4 sentences: how the candidate maps to this JD.")
    suggestions: List[str] = Field(description="Actionable tips for the candidate.")

# -------------------------
# API 5: Compare Response
# -------------------------
class CompareResponseData(BaseModel):
    comparisonSummary: str = Field(description="2-4 sentences: how the candidate maps to this JD before vs after tailoring.")
    liftSummary: str = Field(description="One line: what changed between the two versions.")
    suggestions: List[str] = Field(description="Actionable tips for the candidate.")
    issues: List[ResumeIssue] = Field(description="Issues still remaining or missing skills compared to JD.")

# -------------------------
# Request Models
# -------------------------

class ScoreRequest(BaseModel):
    resume_text: str
    jd: str

class TailorRequest(BaseModel):
    resume_text: str
    jd: str

class CompareRequest(BaseModel):
    original_text: str
    tailored_text: str
    jd: str

class DownloadRequest(BaseModel):
    resume_markdown: str
    filename: Optional[str] = None

class ApiResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
    error: Optional[dict] = None
