"""PII detection and masking service using LangGraph pipeline with QWEN3 via vLLM."""

import time
from typing import List, Optional
from uuid import UUID

from app.models.schemas import (
    PIIMaskResponse,
    PIIDetectResponse,
    PIIMaskType,
)
from app.repositories.ai_task_repository import AITaskRepository
from app.services.pii_pipeline import get_pii_pipeline


class PIIService:
    """Service for PII detection and masking using LangGraph pipeline."""

    def __init__(self, repository: AITaskRepository):
        self.repository = repository
        self._pipeline = get_pii_pipeline()

    async def detect_pii(
        self,
        text: str,
        detect_types: Optional[List[PIIMaskType]] = None,
    ) -> PIIDetectResponse:
        """Detect PII entities in text using LangGraph pipeline."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="pii_detect",
            input_data={"text": text, "detect_types": detect_types},
        )

        try:
            # Run the LangGraph pipeline
            result = await self._pipeline.run_detect(text, detect_types)

            # Check for pipeline errors
            if result.get("error"):
                raise RuntimeError(f"Pipeline error: {result['error']}")

            entities = result["entities"]
            tokens_used = result["tokens_used"]
            model_used = result["model_used"]

            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"entities": [e.model_dump() for e in entities]},
                model_used=model_used,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return PIIDetectResponse(
                task_id=task.id,
                entities=entities,
                model_used=model_used,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def mask_pii(
        self,
        text: str,
        source_type: Optional[str] = None,
        source_id: Optional[UUID] = None,
        mask_types: Optional[List[PIIMaskType]] = None,
    ) -> PIIMaskResponse:
        """Mask PII in text using LangGraph pipeline."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="pii_mask",
            source_type=source_type,
            source_id=source_id,
            input_data={"text": text, "mask_types": mask_types},
        )

        try:
            # Run the LangGraph pipeline
            result = await self._pipeline.run_mask(text, mask_types)

            # Check for pipeline errors
            if result.get("error"):
                raise RuntimeError(f"Pipeline error: {result['error']}")

            masked_text = result["masked_text"]
            tokens_used = result["tokens_used"]
            model_used = result["model_used"]

            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"masked_text": masked_text},
                model_used=model_used,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return PIIMaskResponse(
                task_id=task.id,
                original_text=text,
                masked_text=masked_text,
                model_used=model_used,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise
