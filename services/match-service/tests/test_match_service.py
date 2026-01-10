"""Unit tests for MatchService."""

from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.services.match_service import MatchService
from app.models.schemas import MatchCreate, MatchUpdate, MatchScoreRequest


@pytest.fixture
def mock_session():
    """Create a mock async session."""
    return AsyncMock()


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    redis = AsyncMock()
    redis.get_match_detail.return_value = None
    redis.get_top_matches_for_job.return_value = None
    redis.get_recommended_jobs_for_user.return_value = None
    return redis


@pytest.fixture
def match_service(mock_session, mock_redis):
    """Create MatchService with mocked dependencies."""
    return MatchService(mock_session, mock_redis)


@pytest.fixture
def sample_match():
    """Create a sample match object."""
    match = MagicMock()
    match.id = uuid4()
    match.job_id = uuid4()
    match.resume_id = uuid4()
    match.user_id = uuid4()
    match.overall_score = Decimal("0.85")
    match.skill_score = Decimal("0.90")
    match.experience_score = Decimal("0.80")
    match.culture_score = Decimal("0.85")
    match.is_recommended = True
    match.score_breakdown = {"skills": 0.9}
    match.ai_reasoning = "Good match based on skills"
    return match


class TestCreateMatch:
    """Tests for create_match method."""

    @pytest.mark.asyncio
    async def test_create_match_success(self, match_service, sample_match):
        """Should create match successfully."""
        create_data = MatchCreate(
            job_id=sample_match.job_id,
            resume_id=sample_match.resume_id,
            user_id=sample_match.user_id,
        )

        with patch.object(
            match_service.repository, "create", new_callable=AsyncMock
        ) as mock_create:
            mock_create.return_value = sample_match

            result = await match_service.create_match(create_data)

            mock_create.assert_called_once_with(create_data)
            assert result == sample_match


class TestGetMatch:
    """Tests for get_match method."""

    @pytest.mark.asyncio
    async def test_get_match_success(self, match_service, sample_match):
        """Should return match when found."""
        with patch.object(
            match_service.repository, "get_by_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = sample_match

            result = await match_service.get_match(sample_match.id)

            assert result == sample_match

    @pytest.mark.asyncio
    async def test_get_match_not_found(self, match_service):
        """Should return None when match not found."""
        with patch.object(
            match_service.repository, "get_by_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = None

            result = await match_service.get_match(uuid4())

            assert result is None


class TestGetMatchesForJob:
    """Tests for get_matches_for_job method."""

    @pytest.mark.asyncio
    async def test_get_matches_pagination(self, match_service, sample_match):
        """Should return paginated matches for job."""
        job_id = sample_match.job_id

        with patch.object(
            match_service.repository, "get_by_job_id", new_callable=AsyncMock
        ) as mock_get, patch.object(
            match_service.repository, "count_by_job_id", new_callable=AsyncMock
        ) as mock_count:
            mock_get.return_value = [sample_match]
            mock_count.return_value = 1

            matches, total = await match_service.get_matches_for_job(
                job_id, page=1, page_size=20
            )

            assert len(matches) == 1
            assert total == 1
            mock_get.assert_called_once_with(
                job_id, limit=20, offset=0, min_score=None
            )

    @pytest.mark.asyncio
    async def test_get_matches_with_min_score(self, match_service, sample_match):
        """Should filter by minimum score."""
        job_id = sample_match.job_id

        with patch.object(
            match_service.repository, "get_by_job_id", new_callable=AsyncMock
        ) as mock_get, patch.object(
            match_service.repository, "count_by_job_id", new_callable=AsyncMock
        ) as mock_count:
            mock_get.return_value = [sample_match]
            mock_count.return_value = 1

            matches, total = await match_service.get_matches_for_job(
                job_id, min_score=0.8
            )

            mock_get.assert_called_once()
            call_kwargs = mock_get.call_args.kwargs
            assert call_kwargs["min_score"] == 0.8


class TestCalculateMatchScore:
    """Tests for calculate_match_score method."""

    @pytest.mark.asyncio
    async def test_calculate_score_cached(self, match_service, mock_redis, sample_match):
        """Should return cached score if available."""
        cached_data = {
            "match_id": str(sample_match.id),
            "overall_score": 0.85,
            "skill_score": 0.9,
            "experience_score": 0.8,
            "culture_score": 0.85,
            "score_breakdown": {},
            "ai_reasoning": "Cached reasoning",
            "is_recommended": True,
        }
        mock_redis.get_match_detail.return_value = cached_data

        request = MatchScoreRequest(
            job_id=sample_match.job_id,
            resume_id=sample_match.resume_id,
            user_id=sample_match.user_id,
            force_recalculate=False,
        )

        result = await match_service.calculate_match_score(request)

        assert result.is_cached is True
        assert result.overall_score == Decimal("0.85")

    @pytest.mark.asyncio
    async def test_calculate_score_force_recalculate(
        self, match_service, mock_redis, sample_match
    ):
        """Should bypass cache when force_recalculate is True."""
        request = MatchScoreRequest(
            job_id=sample_match.job_id,
            resume_id=sample_match.resume_id,
            user_id=sample_match.user_id,
            force_recalculate=True,
        )

        ai_response = {
            "overall_score": 0.9,
            "skill_score": 0.95,
            "experience_score": 0.85,
            "culture_score": 0.9,
            "score_breakdown": {"skills": 0.95},
            "ai_reasoning": "Excellent match",
        }

        with patch.object(
            match_service.repository, "get_by_job_and_resume", new_callable=AsyncMock
        ) as mock_get, patch.object(
            match_service.repository, "create", new_callable=AsyncMock
        ) as mock_create, patch.object(
            match_service.repository, "update", new_callable=AsyncMock
        ) as mock_update, patch.object(
            match_service, "_call_ai_service", new_callable=AsyncMock
        ) as mock_ai:
            mock_get.return_value = None
            mock_create.return_value = sample_match
            mock_update.return_value = sample_match
            mock_ai.return_value = ai_response

            result = await match_service.calculate_match_score(request)

            # Should not check cache
            mock_redis.get_match_detail.assert_not_called()
            assert result.is_cached is False


class TestGetTopMatchesForJob:
    """Tests for get_top_matches_for_job method."""

    @pytest.mark.asyncio
    async def test_get_top_matches_from_cache(self, match_service, mock_redis):
        """Should return cached top matches."""
        job_id = uuid4()
        cached_matches = [
            (str(uuid4()), 0.95),
            (str(uuid4()), 0.90),
            (str(uuid4()), 0.85),
        ]
        mock_redis.get_top_matches_for_job.return_value = cached_matches

        result = await match_service.get_top_matches_for_job(job_id, limit=10)

        assert result.total == 3
        assert len(result.matches) == 3
        assert result.matches[0].score == 0.95

    @pytest.mark.asyncio
    async def test_get_top_matches_from_database(
        self, match_service, mock_redis, sample_match
    ):
        """Should fallback to database when cache is empty."""
        job_id = uuid4()
        mock_redis.get_top_matches_for_job.return_value = None

        with patch.object(
            match_service.repository, "get_by_job_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = [sample_match]

            result = await match_service.get_top_matches_for_job(job_id, limit=10)

            assert result.total == 1
            mock_get.assert_called_once_with(job_id, limit=10)


class TestAddFeedback:
    """Tests for add_feedback method."""

    @pytest.mark.asyncio
    async def test_add_feedback_success(self, match_service, sample_match):
        """Should add feedback successfully."""
        from app.models.schemas import MatchFeedbackCreate

        feedback = MatchFeedbackCreate(
            match_id=sample_match.id,
            user_id=sample_match.user_id,
            rating=5,
            feedback_type="helpful",
            feedback_by=sample_match.user_id,
            comment="Great match!",
        )

        with patch.object(
            match_service.repository, "get_by_id", new_callable=AsyncMock
        ) as mock_get, patch.object(
            match_service.repository, "create_feedback", new_callable=AsyncMock
        ) as mock_create:
            mock_get.return_value = sample_match

            result = await match_service.add_feedback(feedback)

            assert result is True
            mock_create.assert_called_once_with(feedback)

    @pytest.mark.asyncio
    async def test_add_feedback_match_not_found(self, match_service):
        """Should return False when match not found."""
        from app.models.schemas import MatchFeedbackCreate

        user_id = uuid4()
        feedback = MatchFeedbackCreate(
            match_id=uuid4(),
            user_id=user_id,
            rating=5,
            feedback_type="helpful",
            feedback_by=user_id,
        )

        with patch.object(
            match_service.repository, "get_by_id", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = None

            result = await match_service.add_feedback(feedback)

            assert result is False


class TestCallAIService:
    """Tests for _call_ai_service method."""

    @pytest.mark.asyncio
    async def test_ai_service_call_success(self, match_service):
        """Should return AI service response."""
        request = MatchScoreRequest(
            job_id=uuid4(),
            resume_id=uuid4(),
            user_id=uuid4(),
        )

        expected_response = {
            "overall_score": 0.85,
            "skill_score": 0.9,
            "experience_score": 0.8,
            "culture_score": 0.85,
            "score_breakdown": {},
            "ai_reasoning": "Test reasoning",
        }

        with patch("httpx.AsyncClient") as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = expected_response
            mock_response.raise_for_status = MagicMock()

            mock_client_instance = AsyncMock()
            mock_client_instance.post.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            result = await match_service._call_ai_service(request)

            assert result == expected_response

    @pytest.mark.asyncio
    async def test_ai_service_call_failure(self, match_service):
        """Should return default scores on failure."""
        import httpx

        request = MatchScoreRequest(
            job_id=uuid4(),
            resume_id=uuid4(),
            user_id=uuid4(),
        )

        with patch("httpx.AsyncClient") as mock_client:
            mock_client_instance = AsyncMock()
            mock_client_instance.post.side_effect = httpx.HTTPError("Connection failed")
            mock_client.return_value.__aenter__.return_value = mock_client_instance

            result = await match_service._call_ai_service(request)

            assert result["overall_score"] == 0.0
            assert "unavailable" in result["ai_reasoning"].lower()
