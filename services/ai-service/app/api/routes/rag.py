"""RAG (Retrieval-Augmented Generation) routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.bedrock import BedrockClient
from app.services.embedding_service import EmbeddingService
from app.repositories.ai_task_repository import AITaskRepository

router = APIRouter()


# Request/Response Models
class RAGQueryRequest(BaseModel):
    """RAG query request."""
    query: str = Field(..., description="User's query or question")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of relevant chunks to retrieve")
    threshold: float = Field(default=0.6, ge=0.0, le=1.0, description="Similarity threshold")
    include_context: bool = Field(default=True, description="Include retrieved context in response")
    model: Optional[str] = Field(default=None, description="LLM model for answer generation")


class RetrievedContext(BaseModel):
    """Retrieved context from RAG search."""
    job_id: UUID
    chunk_index: int
    chunk_text: str
    similarity_score: float


class RAGQueryResponse(BaseModel):
    """RAG query response."""
    answer: str
    contexts: Optional[List[RetrievedContext]] = None
    query: str
    model_used: str
    processing_time_ms: int


class RAGIndexRequest(BaseModel):
    """RAG document indexing request."""
    document_id: UUID = Field(..., description="Unique document ID")
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Document content to index")
    metadata: Optional[dict] = Field(default=None, description="Additional metadata")
    document_type: str = Field(default="resume", description="Type: resume, job, etc.")


class RAGIndexResponse(BaseModel):
    """RAG indexing response."""
    document_id: UUID
    chunk_count: int
    dimensions: int
    model_used: str
    processing_time_ms: int


class RAGDeleteResponse(BaseModel):
    """RAG document deletion response."""
    document_id: UUID
    deleted_chunks: int


@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(
    request: RAGQueryRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    RAG Query - Retrieve relevant context and generate an answer.

    This endpoint:
    1. Converts the query to a vector embedding
    2. Retrieves the most similar document chunks from the vector store
    3. Uses the retrieved context to generate a contextual answer via Claude

    Use cases:
    - "Find candidates with Python experience"
    - "What jobs match my resume skills?"
    - "Summarize the requirements for this position"
    """
    import time
    start_time = time.time()

    repository = AITaskRepository(db)
    embedding_service = EmbeddingService(repository)
    bedrock = BedrockClient()

    try:
        # Step 1: Retrieve relevant chunks
        search_result = await embedding_service.similarity_search(
            query_text=request.query,
            top_k=request.top_k,
            threshold=request.threshold,
        )

        # Step 2: Build context from retrieved chunks
        contexts = []
        context_text = ""

        for result in search_result.results:
            contexts.append(RetrievedContext(
                job_id=result.job_id,
                chunk_index=result.chunk_index,
                chunk_text=result.chunk_text,
                similarity_score=result.similarity_score,
            ))
            context_text += f"\n---\n{result.chunk_text}"

        # Step 3: Generate answer using Claude with retrieved context
        model_id = request.model or "anthropic.claude-3-sonnet-20240229-v1:0"

        if contexts:
            prompt = f"""Based on the following context, answer the user's question.

Context:
{context_text}

Question: {request.query}

Instructions:
- Use the context to provide a relevant answer
- If the context doesn't contain relevant information, say so
- Be concise and helpful
- Reference specific information from the context when applicable

Answer:"""
        else:
            prompt = f"""The user asked: {request.query}

No relevant context was found in the database. Please provide a helpful response
explaining that no matching documents were found, and suggest what they might search for instead.

Answer:"""

        # Call Claude for answer generation
        answer = await bedrock.generate_text(
            prompt=prompt,
            model_id=model_id,
            max_tokens=1024,
            temperature=0.7,
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return RAGQueryResponse(
            answer=answer,
            contexts=contexts if request.include_context else None,
            query=request.query,
            model_used=model_id,
            processing_time_ms=processing_time_ms,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query failed: {str(e)}",
        )


@router.post("/index", response_model=RAGIndexResponse)
async def rag_index(
    request: RAGIndexRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Index a document for RAG retrieval.

    This endpoint:
    1. Chunks the document content
    2. Generates vector embeddings for each chunk
    3. Stores the embeddings in the vector database

    Supported document types:
    - resume: Candidate resumes
    - job: Job postings
    """
    repository = AITaskRepository(db)
    embedding_service = EmbeddingService(repository)

    try:
        # Use the existing job embedding logic (can be extended for other types)
        result = await embedding_service.create_job_embedding(
            job_id=request.document_id,
            title=request.title,
            description=request.content,
            requirements=None,  # Could add metadata parsing here
        )

        return RAGIndexResponse(
            document_id=request.document_id,
            chunk_count=result.chunk_count,
            dimensions=result.dimensions,
            model_used=result.model_used,
            processing_time_ms=result.processing_time_ms,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG indexing failed: {str(e)}",
        )


@router.delete("/{document_id}", response_model=RAGDeleteResponse)
async def rag_delete(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a document from the RAG index.

    Removes all vector embeddings associated with the document.
    """
    repository = AITaskRepository(db)
    embedding_service = EmbeddingService(repository)

    try:
        deleted_count = await embedding_service.delete_job_embeddings(document_id)

        return RAGDeleteResponse(
            document_id=document_id,
            deleted_chunks=deleted_count,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG deletion failed: {str(e)}",
        )


@router.get("/health")
async def rag_health():
    """RAG service health check."""
    return {
        "status": "healthy",
        "service": "rag",
        "capabilities": [
            "query",
            "index",
            "delete",
        ],
    }
