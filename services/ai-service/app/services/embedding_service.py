"""Embedding service using Amazon Bedrock Titan."""

import time
from typing import List, Optional
from uuid import UUID

from app.core.config import settings
from app.core.bedrock import BedrockClient
from app.models.schemas import (
    EmbeddingResponse,
    BatchEmbeddingResponse,
    JobEmbeddingResponse,
    SimilaritySearchResponse,
    SimilarityResult,
)
from app.repositories.ai_task_repository import AITaskRepository


class EmbeddingService:
    """Service for generating and managing vector embeddings."""

    CHUNK_SIZE = 512  # Characters per chunk
    CHUNK_OVERLAP = 50  # Overlap between chunks

    def __init__(self, repository: AITaskRepository):
        self.repository = repository
        self.bedrock = BedrockClient()
        self.model_id = settings.BEDROCK_EMBEDDING_MODEL

    def _chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks."""
        if len(text) <= self.CHUNK_SIZE:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + self.CHUNK_SIZE
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - self.CHUNK_OVERLAP

        return chunks

    async def generate_embedding(
        self,
        text: str,
        model: Optional[str] = None,
    ) -> EmbeddingResponse:
        """Generate embedding for a single text."""
        start_time = time.time()
        model_id = model or self.model_id

        task = await self.repository.create(
            task_type="embedding",
            input_data={"text": text[:200], "model": model_id},  # Truncate for storage
        )

        try:
            embedding = await self.bedrock.generate_embedding(text, model_id)
            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"dimensions": len(embedding)},
                model_used=model_id,
                processing_time_ms=processing_time_ms,
            )

            return EmbeddingResponse(
                task_id=task.id,
                embedding=embedding,
                dimensions=len(embedding),
                model_used=model_id,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def generate_batch_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None,
    ) -> BatchEmbeddingResponse:
        """Generate embeddings for multiple texts."""
        start_time = time.time()
        model_id = model or self.model_id

        task = await self.repository.create(
            task_type="batch_embedding",
            input_data={"text_count": len(texts), "model": model_id},
        )

        try:
            embeddings = []
            for text in texts:
                embedding = await self.bedrock.generate_embedding(text, model_id)
                embeddings.append(embedding)

            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"count": len(embeddings), "dimensions": len(embeddings[0])},
                model_used=model_id,
                processing_time_ms=processing_time_ms,
            )

            return BatchEmbeddingResponse(
                task_id=task.id,
                embeddings=embeddings,
                count=len(embeddings),
                dimensions=len(embeddings[0]) if embeddings else 0,
                model_used=model_id,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def create_job_embedding(
        self,
        job_id: UUID,
        title: str,
        description: str,
        requirements: Optional[str] = None,
    ) -> JobEmbeddingResponse:
        """Create and store embeddings for a job posting."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="job_embedding",
            source_type="job",
            source_id=job_id,
            input_data={"job_id": str(job_id), "title": title},
        )

        try:
            # Combine job content
            full_text = f"Title: {title}\n\nDescription: {description}"
            if requirements:
                full_text += f"\n\nRequirements: {requirements}"

            # Chunk the text
            chunks = self._chunk_text(full_text)

            # Generate embeddings for each chunk
            chunk_embeddings = []
            for idx, chunk in enumerate(chunks):
                embedding = await self.bedrock.generate_embedding(chunk, self.model_id)

                # Store in database
                await self.repository.create_job_embedding(
                    job_id=job_id,
                    chunk_index=idx,
                    chunk_text=chunk,
                    embedding=embedding,
                )

                chunk_embeddings.append(embedding)

            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={
                    "chunk_count": len(chunks),
                    "dimensions": len(chunk_embeddings[0]) if chunk_embeddings else 0,
                },
                model_used=self.model_id,
                processing_time_ms=processing_time_ms,
            )

            return JobEmbeddingResponse(
                task_id=task.id,
                job_id=job_id,
                chunk_count=len(chunks),
                dimensions=len(chunk_embeddings[0]) if chunk_embeddings else 0,
                model_used=self.model_id,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def similarity_search(
        self,
        query_text: str,
        top_k: int = 10,
        threshold: float = 0.7,
    ) -> SimilaritySearchResponse:
        """Search for similar job embeddings."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="similarity_search",
            input_data={
                "query_text": query_text[:200],
                "top_k": top_k,
                "threshold": threshold,
            },
        )

        try:
            # Generate query embedding
            query_embedding = await self.bedrock.generate_embedding(
                query_text, self.model_id
            )

            # Search for similar embeddings
            results = await self.repository.search_similar_embeddings(
                embedding=query_embedding,
                top_k=top_k,
                threshold=threshold,
            )

            processing_time_ms = int((time.time() - start_time) * 1000)

            similarity_results = [
                SimilarityResult(
                    job_id=r["job_id"],
                    chunk_index=r["chunk_index"],
                    chunk_text=r["chunk_text"],
                    similarity_score=r["similarity_score"],
                )
                for r in results
            ]

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"result_count": len(similarity_results)},
                model_used=self.model_id,
                processing_time_ms=processing_time_ms,
            )

            return SimilaritySearchResponse(
                task_id=task.id,
                results=similarity_results,
                query_embedding_dimensions=len(query_embedding),
                model_used=self.model_id,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def delete_job_embeddings(self, job_id: UUID) -> int:
        """Delete all embeddings for a job posting."""
        return await self.repository.delete_job_embeddings(job_id)
