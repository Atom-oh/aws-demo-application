"""Unit tests for PIIService."""

import json
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
import httpx

from app.services.pii_service import PIIService
from app.models.schemas import PIIMaskType


@pytest.fixture
def mock_repository():
    """Create a mock AI task repository."""
    repo = AsyncMock()
    mock_task = MagicMock()
    mock_task.id = uuid4()
    repo.create.return_value = mock_task
    repo.update.return_value = mock_task
    return repo


@pytest.fixture
def pii_service(mock_repository):
    """Create PIIService with mocked repository."""
    return PIIService(mock_repository)


class TestDetectPII:
    """Tests for detect_pii method."""

    @pytest.mark.asyncio
    async def test_detect_pii_success(self, pii_service, mock_repository):
        """Should detect PII entities successfully."""
        text = "Contact John Doe at john.doe@example.com"
        expected_response = {
            "entities": [
                {"type": "NAME", "value": "John Doe", "start": 8, "end": 16},
                {"type": "EMAIL", "value": "john.doe@example.com", "start": 20, "end": 40},
            ]
        }

        with patch.object(
            pii_service, "_call_vllm", new_callable=AsyncMock
        ) as mock_vllm:
            mock_vllm.return_value = (json.dumps(expected_response), 100)

            result = await pii_service.detect_pii(text)

            assert result is not None
            assert result.task_id == mock_repository.create.return_value.id
            mock_vllm.assert_called_once()

    @pytest.mark.asyncio
    async def test_detect_pii_with_type_filter(self, pii_service, mock_repository):
        """Should filter entities by type."""
        text = "John Doe email: john@test.com phone: 123-456-7890"
        expected_response = {
            "entities": [
                {"type": "NAME", "value": "John Doe", "start": 0, "end": 8},
                {"type": "EMAIL", "value": "john@test.com", "start": 16, "end": 29},
                {"type": "PHONE", "value": "123-456-7890", "start": 37, "end": 49},
            ]
        }

        with patch.object(
            pii_service, "_call_vllm", new_callable=AsyncMock
        ) as mock_vllm:
            mock_vllm.return_value = (json.dumps(expected_response), 100)

            result = await pii_service.detect_pii(
                text, detect_types=[PIIMaskType.EMAIL]
            )

            # Only EMAIL should remain after filtering
            assert len(result.entities) == 1
            assert result.entities[0].type == PIIMaskType.EMAIL

    @pytest.mark.asyncio
    async def test_detect_pii_invalid_json_response(self, pii_service, mock_repository):
        """Should handle invalid JSON response gracefully."""
        text = "Some text"

        with patch.object(
            pii_service, "_call_vllm", new_callable=AsyncMock
        ) as mock_vllm:
            mock_vllm.return_value = ("invalid json", 50)

            result = await pii_service.detect_pii(text)

            # Should return empty entities list
            assert result.entities == []

    @pytest.mark.asyncio
    async def test_detect_pii_error_handling(self, pii_service, mock_repository):
        """Should update task status on error."""
        text = "Some text"

        with patch.object(
            pii_service, "_call_vllm", new_callable=AsyncMock
        ) as mock_vllm:
            mock_vllm.side_effect = httpx.HTTPError("Connection failed")

            with pytest.raises(httpx.HTTPError):
                await pii_service.detect_pii(text)

            # Verify task was marked as failed
            mock_repository.update.assert_called()
            call_args = mock_repository.update.call_args
            assert call_args.kwargs["status"] == "failed"


class TestMaskPII:
    """Tests for mask_pii method."""

    @pytest.mark.asyncio
    async def test_mask_pii_success(self, pii_service, mock_repository):
        """Should mask PII successfully."""
        text = "Contact John Doe at john.doe@example.com"
        masked_text = "Contact [NAME] at [EMAIL]"

        with patch.object(
            pii_service, "_call_vllm", new_callable=AsyncMock
        ) as mock_vllm:
            mock_vllm.return_value = (masked_text, 150)

            result = await pii_service.mask_pii(text)

            assert result.original_text == text
            assert result.masked_text == masked_text
            assert result.tokens_used == 150
            mock_vllm.assert_called_once()

    @pytest.mark.asyncio
    async def test_mask_pii_with_source(self, pii_service, mock_repository):
        """Should track source type and ID."""
        text = "Resume content with PII"
        source_id = uuid4()

        with patch.object(
            pii_service, "_call_vllm", new_callable=AsyncMock
        ) as mock_vllm:
            mock_vllm.return_value = ("Masked content", 100)

            result = await pii_service.mask_pii(
                text, source_type="resume", source_id=source_id
            )

            # Verify repository was called with source info
            mock_repository.create.assert_called_once()
            call_args = mock_repository.create.call_args
            assert call_args.kwargs["source_type"] == "resume"
            assert call_args.kwargs["source_id"] == source_id


class TestCallVLLM:
    """Tests for _call_vllm method."""

    @pytest.mark.asyncio
    async def test_call_vllm_success(self, pii_service):
        """Should call vLLM API successfully."""
        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "choices": [{"text": "test response"}],
                "usage": {"total_tokens": 50},
            }
            mock_response.raise_for_status = MagicMock()

            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            text, tokens = await pii_service._call_vllm("test prompt")

            assert text == "test response"
            assert tokens == 50


class TestPromptTemplates:
    """Tests for prompt templates."""

    def test_system_prompt_contains_pii_types(self, pii_service):
        """Should include all PII types in system prompt."""
        pii_types = [
            "NAME", "EMAIL", "PHONE", "SSN", "ADDRESS",
            "DOB", "CREDIT_CARD", "PASSPORT", "ID_NUMBER"
        ]
        for pii_type in pii_types:
            assert pii_type in pii_service.SYSTEM_PROMPT

    def test_detect_prompt_format(self, pii_service):
        """Should format detect prompt correctly."""
        text = "Sample text"
        prompt = pii_service.DETECT_PROMPT.format(text=text)
        assert text in prompt
        assert "JSON" in prompt

    def test_mask_prompt_format(self, pii_service):
        """Should format mask prompt correctly."""
        text = "Sample text"
        prompt = pii_service.MASK_PROMPT.format(text=text)
        assert text in prompt
        assert "[NAME]" in prompt
        assert "[EMAIL]" in prompt
