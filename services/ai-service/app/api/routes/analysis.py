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
    AgentMatchRequest,
    AgentMatchResponse,
    AgentFollowupRequest,
    AgentFollowupResponse,
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

    Uses simple model invocation to provide matching analysis.
    For AgentCore-powered matching, use /match/agent endpoint.
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


@router.post("/match/agent", response_model=AgentMatchResponse)
async def match_job_with_agent(
    request: AgentMatchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Match a resume against job requirements using AgentCore.

    This endpoint uses Bedrock AgentCore for intelligent matching analysis.
    It supports multi-turn conversations via session_id for follow-up questions.

    If AgentCore is not configured (AGENTCORE_AGENT_ID, AGENTCORE_ALIAS_ID),
    it falls back to standard model invocation.

    Returns a session_id that can be used for follow-up questions.
    """
    repository = AITaskRepository(db)
    service = AnalysisService(repository)

    try:
        result = await service.match_with_agent(
            resume_id=request.resume_id,
            job_id=request.job_id,
            resume_text=request.resume_text,
            job_description=request.job_description,
            session_id=request.session_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent matching failed: {str(e)}",
        )


@router.post("/match/agent/followup", response_model=AgentFollowupResponse)
async def agent_match_followup(
    request: AgentFollowupRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Ask a follow-up question about a previous agent match analysis.

    Requires a valid session_id from a previous /match/agent call.
    Sessions expire after 1 hour of inactivity.
    """
    repository = AITaskRepository(db)
    service = AnalysisService(repository)

    try:
        result = await service.followup_match_question(
            session_id=request.session_id,
            question=request.question,
        )
        return AgentFollowupResponse(
            task_id=result["task_id"],
            session_id=result["session_id"],
            response=result["response"],
            model_used=result["model_used"],
            tokens_used=result["tokens_used"],
            processing_time_ms=result["processing_time_ms"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Follow-up question failed: {str(e)}",
        )


@router.delete("/match/agent/session/{session_id}")
async def end_agent_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    End an agent matching session.

    Cleans up session resources. The session_id will no longer be valid
    for follow-up questions after this call.
    """
    repository = AITaskRepository(db)
    service = AnalysisService(repository)

    try:
        service.matching_agent.end_session(session_id)
        return {"message": f"Session {session_id} ended successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to end session: {str(e)}",
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
