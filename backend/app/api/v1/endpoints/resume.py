from fastapi import APIRouter, UploadFile, File
import logging

from app.models.resume import ScoreRequest, TailorRequest, CompareRequest, ApiResponse
from app.services.ai.orchestrator import tailor_orchestrator
from app.services.ai.scorer import resume_scorer
from app.services.document.parser import parse_pdf_to_text, parse_docx_to_text

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/parse", response_model=ApiResponse)
async def parse_document(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        if file.content_type == "application/pdf":
            text = parse_pdf_to_text(file_bytes)
        elif "word" in file.content_type:
            text = parse_docx_to_text(file_bytes)
        else:
            return ApiResponse(success=False, error={"code": "INVALID_TYPE", "message": "Only PDF/DOCX allowed."})
            
        return ApiResponse(success=True, data={"text": text})
    except Exception as e:
        return ApiResponse(success=False, error={"code": "PARSE_FAILED", "message": str(e)})

@router.post("/score", response_model=ApiResponse)
async def get_ats_score(request: ScoreRequest):
    try:
        data = resume_scorer.score(request.resume_text, request.jd)
        return ApiResponse(success=True, data=data)
    except Exception as e:
        return ApiResponse(success=False, error={"code": "SCORE_FAILED", "message": str(e)})

@router.post("/tailor", response_model=ApiResponse)
async def create_tailored_resume(request: TailorRequest):
    try:
        data = tailor_orchestrator.run_pipeline(request.resume_text, request.jd)
        return ApiResponse(success=True, data=data)
    except Exception as e:
        return ApiResponse(success=False, error={"code": "TAILOR_FAILED", "message": str(e)})
