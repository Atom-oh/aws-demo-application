"""Vector embedding routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.schemas import (
    EmbeddingRequest,
    EmbeddingResponse,
    BatchEmbeddingRequest,
    BatchEmbeddingResponse,
    SimilaritySearchRequest,
    SimilaritySearchResponse,
    JobEmbeddingCreate,
    JobEmbeddingResponse,
)
from app.services.embedding_service import EmbeddingService
from app.repositories.ai_task_repository import AITaskRepository

router = APIRouter()


@router.post("/generate", response_model=EmbeddingResponse)
async def generate_embedding(
    request: EmbeddingRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate vector embedding for text.

    Uses Amazon Bedrock Titan Embeddings model.
    """
    repository = AITaskRepository(db)
    service = EmbeddingService(repository)

    try:
        result = await service.generate_embedding(
            text=request.text,
            model=request.model,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Embedding generation failed: {str(e)}",
        )


@router.post("/batch", response_model=BatchEmbeddingResponse)
async def generate_batch_embeddings(
    request: BatchEmbeddingRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate vector embeddings for multiple texts.

    Uses Amazon Bedrock Titan Embeddings model.
    """
    repository = AITaskRepository(db)
    service = EmbeddingService(repository)

    try:
        result = await service.generate_batch_embeddings(
            texts=request.texts,
            model=request.model,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch embedding generation failed: {str(e)}",
        )


@router.post("/job", response_model=JobEmbeddingResponse)
async def create_job_embedding(
    request: JobEmbeddingCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create and store embedding for a job posting.

    Chunks the job description and creates embeddings for each chunk.
    """
    repository = AITaskRepository(db)
    service = EmbeddingService(repository)

    try:
        result = await service.create_job_embedding(
            job_id=request.job_id,
            title=request.title,
            description=request.description,
            requirements=request.requirements,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job embedding creation failed: {str(e)}",
        )


@router.post("/search", response_model=SimilaritySearchResponse)
async def similarity_search(
    request: SimilaritySearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Search for similar job embeddings.

    Uses cosine similarity to find the most similar job embeddings.
    """
    repository = AITaskRepository(db)
    service = EmbeddingService(repository)

    try:
        result = await service.similarity_search(
            query_text=request.query_text,
            top_k=request.top_k,
            threshold=request.threshold,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similarity search failed: {str(e)}",
        )


@router.delete("/job/{job_id}")
async def delete_job_embeddings(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete all embeddings for a job posting."""
    repository = AITaskRepository(db)
    service = EmbeddingService(repository)

    try:
        deleted_count = await service.delete_job_embeddings(job_id)
        return {"deleted_count": deleted_count, "job_id": str(job_id)}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job embeddings: {str(e)}",
        )
