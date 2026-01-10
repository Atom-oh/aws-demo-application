"""AI analysis routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    JobMatchRequest,
    JobMatchResponse,
    SkillExtractionRequest,
    SkillExtractionResponse,
    AITaskResponse,
)
from app.services.analysis_service import AnalysisService
from app.repositories.ai_task_repository import AITaskRepository

router = APIRouter()


@router.post("/resume", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    request: ResumeAnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze a resume using AgentCore.

    Extracts skills, experience, education, and provides a structured analysis.
    """
    repository = AITaskRepository(db)
    service = AnalysisService(repository)

    try:
        result = await service.analyze_resume(
            resume_id=request.resume_id,
            resume_text=request.resume_text,
            analysis_type=request.analysis_type,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Resume analysis failed: {str(e)}",
        )


@router.post("/match", response_model=JobMatchResponse)
async def match_job(
    request: JobMatchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Match a resume against job requirements.

    Uses AgentCore with RAG to provide detailed matching analysis.
    """
    repository = AITaskRepository(db)
    service = AnalysisService(repository)

    try:
        result = await service.match_resume_to_job(
            resume_id=request.resume_id,
            job_id=request.job_id,
            resume_text=request.resume_text,
            job_description=request.job_description,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job matching failed: {str(e)}",
        )


@router.post("/skills", response_model=SkillExtractionResponse)
async def extract_skills(
    request: SkillExtractionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Extract skills from text.

    Uses AgentCore to identify technical skills, soft skills, and certifications.
    """
    repository = AITaskRepository(db)
    service = AnalysisService(repository)

    try:
        result = await service.extract_skills(
            text=request.text,
            skill_categories=request.skill_categories,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Skill extraction failed: {str(e)}",
        )


@router.get("/tasks/{task_id}", response_model=AITaskResponse)
async def get_analysis_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get analysis task status and result by task ID."""
    repository = AITaskRepository(db)
    task = await repository.get_by_id(task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    return AITaskResponse.model_validate(task)


@router.get("/tasks")
async def list_analysis_tasks(
    task_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """List analysis tasks with optional filtering."""
    repository = AITaskRepository(db)

    tasks = await repository.list_tasks(
        task_type=task_type,
        status=status,
        limit=limit,
        offset=offset,
    )

    return {
        "tasks": [AITaskResponse.model_validate(task) for task in tasks],
        "limit": limit,
        "offset": offset,
    }
