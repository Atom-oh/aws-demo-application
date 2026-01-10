"""PII detection and masking service using QWEN3 via vLLM."""

import json
import time
from typing import List, Optional, Dict, Any
from uuid import UUID

import httpx

from app.core.config import settings
from app.models.schemas import (
    PIIMaskResponse,
    PIIDetectResponse,
    PIIEntity,
    PIIMaskType,
)
from app.repositories.ai_task_repository import AITaskRepository


class PIIService:
    """Service for PII detection and masking using QWEN3 via vLLM."""

    SYSTEM_PROMPT = """You are a PII (Personally Identifiable Information) detection and masking assistant.
Your task is to identify and mask sensitive personal information in text.

PII types to detect:
- NAME: Personal names (first name, last name, full name)
- EMAIL: Email addresses
- PHONE: Phone numbers
- SSN: Social Security Numbers
- ADDRESS: Physical addresses
- DOB: Date of birth
- CREDIT_CARD: Credit card numbers
- PASSPORT: Passport numbers
- ID_NUMBER: National ID numbers

When masking, replace the PII with appropriate placeholders like [NAME], [EMAIL], etc.
"""

    DETECT_PROMPT = """Analyze the following text and identify all PII entities.
Return a JSON object with a list of detected entities, each containing:
- type: The type of PII (NAME, EMAIL, PHONE, etc.)
- value: The actual PII value found
- start: Starting character position
- end: Ending character position

Text to analyze:
{text}

Return only valid JSON in this format:
{{"entities": [{{"type": "...", "value": "...", "start": 0, "end": 10}}]}}
"""

    MASK_PROMPT = """Mask all PII in the following text by replacing sensitive information with placeholders.
Replace:
- Names with [NAME]
- Email addresses with [EMAIL]
- Phone numbers with [PHONE]
- SSN with [SSN]
- Addresses with [ADDRESS]
- Dates of birth with [DOB]
- Credit card numbers with [CREDIT_CARD]
- Passport numbers with [PASSPORT]
- ID numbers with [ID_NUMBER]

Text to mask:
{text}

Return only the masked text without any explanation.
"""

    def __init__(self, repository: AITaskRepository):
        self.repository = repository
        self.vllm_url = settings.VLLM_URL
        self.model_name = settings.QWEN3_MODEL

    async def _call_vllm(
        self,
        prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.1,
    ) -> tuple[str, int]:
        """Call vLLM API with QWEN3 model."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.vllm_url}/v1/completions",
                json={
                    "model": self.model_name,
                    "prompt": f"{self.SYSTEM_PROMPT}\n\n{prompt}",
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "stop": ["</s>"],
                },
            )
            response.raise_for_status()
            result = response.json()

            text = result["choices"][0]["text"].strip()
            tokens_used = result.get("usage", {}).get("total_tokens", 0)

            return text, tokens_used

    async def detect_pii(
        self,
        text: str,
        detect_types: Optional[List[PIIMaskType]] = None,
    ) -> PIIDetectResponse:
        """Detect PII entities in text."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="pii_detect",
            input_data={"text": text, "detect_types": detect_types},
        )

        try:
            prompt = self.DETECT_PROMPT.format(text=text)
            response_text, tokens_used = await self._call_vllm(prompt)

            # Parse JSON response
            try:
                result = json.loads(response_text)
                entities = [
                    PIIEntity(
                        type=PIIMaskType(e["type"]),
                        value=e["value"],
                        start=e.get("start"),
                        end=e.get("end"),
                    )
                    for e in result.get("entities", [])
                ]
            except (json.JSONDecodeError, KeyError, ValueError):
                entities = []

            # Filter by requested types
            if detect_types:
                entities = [e for e in entities if e.type in detect_types]

            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"entities": [e.model_dump() for e in entities]},
                model_used=self.model_name,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return PIIDetectResponse(
                task_id=task.id,
                entities=entities,
                model_used=self.model_name,
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
        """Mask PII in text."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="pii_mask",
            source_type=source_type,
            source_id=source_id,
            input_data={"text": text, "mask_types": mask_types},
        )

        try:
            prompt = self.MASK_PROMPT.format(text=text)
            masked_text, tokens_used = await self._call_vllm(prompt)

            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"masked_text": masked_text},
                model_used=self.model_name,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return PIIMaskResponse(
                task_id=task.id,
                original_text=text,
                masked_text=masked_text,
                model_used=self.model_name,
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
