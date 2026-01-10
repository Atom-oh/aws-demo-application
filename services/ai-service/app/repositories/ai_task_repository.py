"""Repository for AI tasks and embeddings."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, delete, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_task import AITask, JobEmbedding


class AITaskRepository:
    """Repository for AI task and embedding operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        task_type: str,
        source_type: Optional[str] = None,
        source_id: Optional[UUID] = None,
        input_data: Optional[Dict[str, Any]] = None,
    ) -> AITask:
        """Create a new AI task."""
        task = AITask(
            task_type=task_type,
            source_type=source_type,
            source_id=source_id,
            status="pending",
            input_data=input_data,
        )
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def get_by_id(self, task_id: UUID) -> Optional[AITask]:
        """Get a task by ID."""
        result = await self.db.execute(
            select(AITask).where(AITask.id == task_id)
        )
        return result.scalar_one_or_none()

    async def update(
        self,
        task_id: UUID,
        status: Optional[str] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        model_used: Optional[str] = None,
        tokens_used: Optional[int] = None,
        processing_time_ms: Optional[int] = None,
    ) -> Optional[AITask]:
        """Update an AI task."""
        task = await self.get_by_id(task_id)
        if not task:
            return None

        if status is not None:
            task.status = status
        if output_data is not None:
            task.output_data = output_data
        if error_message is not None:
            task.error_message = error_message
        if model_used is not None:
            task.model_used = model_used
        if tokens_used is not None:
            task.tokens_used = tokens_used
        if processing_time_ms is not None:
            task.processing_time_ms = processing_time_ms

        if status == "completed" or status == "failed":
            task.completed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def list_tasks(
        self,
        task_type: Optional[str] = None,
        status: Optional[str] = None,
        source_type: Optional[str] = None,
        source_id: Optional[UUID] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[AITask]:
        """List AI tasks with optional filtering."""
        query = select(AITask)

        if task_type:
            query = query.where(AITask.task_type == task_type)
        if status:
            query = query.where(AITask.status == status)
        if source_type:
            query = query.where(AITask.source_type == source_type)
        if source_id:
            query = query.where(AITask.source_id == source_id)

        query = query.order_by(AITask.created_at.desc())
        query = query.limit(limit).offset(offset)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_job_embedding(
        self,
        job_id: UUID,
        chunk_index: int,
        chunk_text: str,
        embedding: List[float],
    ) -> JobEmbedding:
        """Create a job embedding record."""
        job_embedding = JobEmbedding(
            job_id=job_id,
            chunk_index=chunk_index,
            chunk_text=chunk_text,
            embedding=embedding,
        )
        self.db.add(job_embedding)
        await self.db.commit()
        await self.db.refresh(job_embedding)
        return job_embedding

    async def get_job_embeddings(self, job_id: UUID) -> List[JobEmbedding]:
        """Get all embeddings for a job."""
        result = await self.db.execute(
            select(JobEmbedding)
            .where(JobEmbedding.job_id == job_id)
            .order_by(JobEmbedding.chunk_index)
        )
        return list(result.scalars().all())

    async def delete_job_embeddings(self, job_id: UUID) -> int:
        """Delete all embeddings for a job."""
        result = await self.db.execute(
            delete(JobEmbedding).where(JobEmbedding.job_id == job_id)
        )
        await self.db.commit()
        return result.rowcount

    async def search_similar_embeddings(
        self,
        embedding: List[float],
        top_k: int = 10,
        threshold: float = 0.7,
    ) -> List[Dict[str, Any]]:
        """Search for similar embeddings using cosine similarity."""
        # Convert embedding to string for pgvector
        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

        # Use pgvector cosine distance operator
        query = text(
            """
            SELECT
                id,
                job_id,
                chunk_index,
                chunk_text,
                1 - (embedding <=> :embedding::vector) as similarity_score
            FROM job_embeddings
            WHERE 1 - (embedding <=> :embedding::vector) >= :threshold
            ORDER BY embedding <=> :embedding::vector
            LIMIT :top_k
            """
        )

        result = await self.db.execute(
            query,
            {
                "embedding": embedding_str,
                "threshold": threshold,
                "top_k": top_k,
            },
        )

        rows = result.fetchall()
        return [
            {
                "id": str(row[0]),
                "job_id": str(row[1]),
                "chunk_index": row[2],
                "chunk_text": row[3],
                "similarity_score": float(row[4]),
            }
            for row in rows
        ]
