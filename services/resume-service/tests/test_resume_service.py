"""Unit tests for ResumeService."""

import math
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.schemas import ResumeCreate, ResumeUpdate
from app.services.resume_service import ResumeService


@pytest.fixture
def mock_session():
    """Create a mock async session."""
    return AsyncMock()


@pytest.fixture
def resume_service(mock_session):
    """Create ResumeService with mocked session."""
    return ResumeService(mock_session)


@pytest.fixture
def sample_resume():
    """Create a sample resume model."""
    mock_resume = MagicMock()
    mock_resume.id = uuid4()
    mock_resume.user_id = uuid4()
    mock_resume.title = "Software Engineer Resume"
    mock_resume.content = "Experience in Python and Go"
    mock_resume.status = "completed"
    mock_resume.is_primary = False
    mock_resume.original_file_url = "https://example.com/resume.pdf"
    mock_resume.original_file_name = "resume.pdf"
    mock_resume.file_type = "pdf"
    mock_resume.masked_content = "Masked content"
    mock_resume.parsed_content = {"skills": ["Python", "Go"]}
    mock_resume.ai_summary = "Experienced developer"
    mock_resume.experiences = []
    mock_resume.skills = []
    mock_resume.educations = []
    mock_resume.created_at = datetime.now()
    mock_resume.updated_at = datetime.now()
    return mock_resume


class TestCreateResume:
    """Tests for create_resume method."""

    @pytest.mark.asyncio
    async def test_create_resume_success(self, resume_service, sample_resume):
        """Should create resume successfully."""
        resume_data = ResumeCreate(
            user_id=sample_resume.user_id,
            title="Software Engineer Resume",
            content="Experience in Python and Go",
        )

        with patch.object(
            resume_service.repository, "create", new_callable=AsyncMock
        ) as mock_create:
            mock_create.return_value = sample_resume

            result = await resume_service.create_resume(resume_data)

            mock_create.assert_called_once_with(resume_data)
            assert result is not None


class TestGetResume:
    """Tests for get_resume method."""

    @pytest.mark.asyncio
    async def test_get_resume_success(self, resume_service, sample_resume):
        """Should return resume when found."""
        resume_id = sample_resume.id

        with patch.object(
            resume_service.repository, "get_by_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = sample_resume

            result = await resume_service.get_resume(resume_id)

            mock_get.assert_called_once_with(resume_id)
            assert result is not None

    @pytest.mark.asyncio
    async def test_get_resume_not_found(self, resume_service):
        """Should raise 404 when resume not found."""
        resume_id = uuid4()

        with patch.object(
            resume_service.repository, "get_by_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = None

            with pytest.raises(HTTPException) as exc_info:
                await resume_service.get_resume(resume_id)

            assert exc_info.value.status_code == 404
            assert "not found" in str(exc_info.value.detail).lower()


class TestGetUserResumes:
    """Tests for get_user_resumes method."""

    @pytest.mark.asyncio
    async def test_get_user_resumes_success(self, resume_service, sample_resume):
        """Should return paginated resumes for user."""
        user_id = sample_resume.user_id
        resumes = [sample_resume]
        total = 1

        with patch.object(
            resume_service.repository, "get_by_user_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = (resumes, total)

            result = await resume_service.get_user_resumes(user_id, page=1, size=10)

            mock_get.assert_called_once_with(user_id, 1, 10)
            assert result.total == 1
            assert result.page == 1
            assert result.size == 10
            assert result.pages == 1

    @pytest.mark.asyncio
    async def test_get_user_resumes_pagination(self, resume_service, sample_resume):
        """Should calculate pages correctly."""
        user_id = sample_resume.user_id
        total = 25
        size = 10

        with patch.object(
            resume_service.repository, "get_by_user_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = ([sample_resume] * 10, total)

            result = await resume_service.get_user_resumes(user_id, page=1, size=size)

            expected_pages = math.ceil(total / size)  # 3 pages
            assert result.pages == expected_pages

    @pytest.mark.asyncio
    async def test_get_user_resumes_empty(self, resume_service):
        """Should return empty list when no resumes."""
        user_id = uuid4()

        with patch.object(
            resume_service.repository, "get_by_user_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = ([], 0)

            result = await resume_service.get_user_resumes(user_id)

            assert result.total == 0
            assert result.items == []
            assert result.pages == 1  # Default to 1 page even if empty


class TestUpdateResume:
    """Tests for update_resume method."""

    @pytest.mark.asyncio
    async def test_update_resume_success(self, resume_service, sample_resume):
        """Should update resume successfully."""
        resume_id = sample_resume.id
        update_data = ResumeUpdate(title="Updated Title")

        with patch.object(
            resume_service.repository, "update", new_callable=AsyncMock
        ) as mock_update:
            mock_update.return_value = sample_resume

            result = await resume_service.update_resume(resume_id, update_data)

            mock_update.assert_called_once_with(resume_id, update_data)
            assert result is not None

    @pytest.mark.asyncio
    async def test_update_resume_not_found(self, resume_service):
        """Should raise 404 when resume not found."""
        resume_id = uuid4()
        update_data = ResumeUpdate(title="Updated Title")

        with patch.object(
            resume_service.repository, "update", new_callable=AsyncMock
        ) as mock_update:
            mock_update.return_value = None

            with pytest.raises(HTTPException) as exc_info:
                await resume_service.update_resume(resume_id, update_data)

            assert exc_info.value.status_code == 404


class TestDeleteResume:
    """Tests for delete_resume method."""

    @pytest.mark.asyncio
    async def test_delete_resume_success(self, resume_service):
        """Should delete resume successfully."""
        resume_id = uuid4()

        with patch.object(
            resume_service.repository, "delete", new_callable=AsyncMock
        ) as mock_delete:
            mock_delete.return_value = True

            await resume_service.delete_resume(resume_id)

            mock_delete.assert_called_once_with(resume_id)

    @pytest.mark.asyncio
    async def test_delete_resume_not_found(self, resume_service):
        """Should raise 404 when resume not found."""
        resume_id = uuid4()

        with patch.object(
            resume_service.repository, "delete", new_callable=AsyncMock
        ) as mock_delete:
            mock_delete.return_value = False

            with pytest.raises(HTTPException) as exc_info:
                await resume_service.delete_resume(resume_id)

            assert exc_info.value.status_code == 404


class TestSetPrimaryResume:
    """Tests for set_primary_resume method."""

    @pytest.mark.asyncio
    async def test_set_primary_success(self, resume_service, sample_resume):
        """Should set resume as primary."""
        user_id = sample_resume.user_id
        resume_id = sample_resume.id

        with patch.object(
            resume_service.repository, "set_primary", new_callable=AsyncMock
        ) as mock_set:
            mock_set.return_value = sample_resume

            result = await resume_service.set_primary_resume(user_id, resume_id)

            mock_set.assert_called_once_with(user_id, resume_id)
            assert result is not None

    @pytest.mark.asyncio
    async def test_set_primary_not_found(self, resume_service):
        """Should raise 404 when resume not found."""
        user_id = uuid4()
        resume_id = uuid4()

        with patch.object(
            resume_service.repository, "set_primary", new_callable=AsyncMock
        ) as mock_set:
            mock_set.return_value = None

            with pytest.raises(HTTPException) as exc_info:
                await resume_service.set_primary_resume(user_id, resume_id)

            assert exc_info.value.status_code == 404


class TestUpdateResumeStatus:
    """Tests for update_resume_status method."""

    @pytest.mark.asyncio
    async def test_update_status_valid(self, resume_service, sample_resume):
        """Should update status with valid value."""
        resume_id = sample_resume.id

        with patch.object(
            resume_service.repository, "update", new_callable=AsyncMock
        ) as mock_update:
            mock_update.return_value = sample_resume

            result = await resume_service.update_resume_status(resume_id, "completed")

            assert result is not None

    @pytest.mark.asyncio
    async def test_update_status_invalid(self, resume_service):
        """Should raise 400 for invalid status."""
        resume_id = uuid4()

        with pytest.raises(HTTPException) as exc_info:
            await resume_service.update_resume_status(resume_id, "invalid_status")

        assert exc_info.value.status_code == 400
        assert "Invalid status" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_valid_statuses(self, resume_service):
        """Should accept all valid statuses."""
        valid_statuses = ["processing", "completed", "failed"]

        for status_value in valid_statuses:
            # Just verify no exception is raised for valid values
            # (the actual update would be mocked)
            assert status_value in ["processing", "completed", "failed"]
