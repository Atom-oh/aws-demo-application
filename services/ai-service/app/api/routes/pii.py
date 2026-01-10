"""PII masking routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import (
    PIIMaskRequest,
    PIIMaskResponse,
    PIIDetectRequest,
    PIIDetectResponse,
    AITaskResponse,
)
from app.services.pii_service import PIIService
from app.repositories.ai_task_repository import AITaskRepository

router = APIRouter()


@router.post("/mask", response_model=PIIMaskResponse)
async def mask_pii(
    request: PIIMaskRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Mask PII (Personally Identifiable Information) from text.

    Uses QWEN3 via vLLM for PII detection and masking.
    """
    repository = AITaskRepository(db)
    service = PIIService(repository)

    try:
        result = await service.mask_pii(
            text=request.text,
            source_type=request.source_type,
            source_id=request.source_id,
            mask_types=request.mask_types,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PII masking failed: {str(e)}",
        )


@router.post("/detect", response_model=PIIDetectResponse)
async def detect_pii(
    request: PIIDetectRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Detect PII entities in text without masking.

    Returns a list of detected PII entities with their types and positions.
    """
    repository = AITaskRepository(db)
    service = PIIService(repository)

    try:
        result = await service.detect_pii(
            text=request.text,
            detect_types=request.detect_types,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PII detection failed: {str(e)}",
        )


@router.get("/tasks/{task_id}", response_model=AITaskResponse)
async def get_pii_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get PII task status and result by task ID."""
    repository = AITaskRepository(db)
    task = await repository.get_by_id(task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    return AITaskResponse.model_validate(task)
