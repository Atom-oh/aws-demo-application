import datetime

from google.protobuf import timestamp_pb2 as _timestamp_pb2
from common.v1 import common_pb2 as _common_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class FeedbackType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    FEEDBACK_TYPE_UNSPECIFIED: _ClassVar[FeedbackType]
    FEEDBACK_TYPE_POSITIVE: _ClassVar[FeedbackType]
    FEEDBACK_TYPE_NEGATIVE: _ClassVar[FeedbackType]
    FEEDBACK_TYPE_HIRED: _ClassVar[FeedbackType]
    FEEDBACK_TYPE_NOT_FIT: _ClassVar[FeedbackType]
    FEEDBACK_TYPE_APPLIED: _ClassVar[FeedbackType]
    FEEDBACK_TYPE_SAVED: _ClassVar[FeedbackType]

class MatchStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    MATCH_STATUS_UNSPECIFIED: _ClassVar[MatchStatus]
    MATCH_STATUS_PENDING: _ClassVar[MatchStatus]
    MATCH_STATUS_PROCESSING: _ClassVar[MatchStatus]
    MATCH_STATUS_COMPLETED: _ClassVar[MatchStatus]
    MATCH_STATUS_FAILED: _ClassVar[MatchStatus]
FEEDBACK_TYPE_UNSPECIFIED: FeedbackType
FEEDBACK_TYPE_POSITIVE: FeedbackType
FEEDBACK_TYPE_NEGATIVE: FeedbackType
FEEDBACK_TYPE_HIRED: FeedbackType
FEEDBACK_TYPE_NOT_FIT: FeedbackType
FEEDBACK_TYPE_APPLIED: FeedbackType
FEEDBACK_TYPE_SAVED: FeedbackType
MATCH_STATUS_UNSPECIFIED: MatchStatus
MATCH_STATUS_PENDING: MatchStatus
MATCH_STATUS_PROCESSING: MatchStatus
MATCH_STATUS_COMPLETED: MatchStatus
MATCH_STATUS_FAILED: MatchStatus

class Match(_message.Message):
    __slots__ = ("id", "job_id", "resume_id", "user_id", "overall_score", "skill_score", "experience_score", "culture_score", "score_breakdown", "ai_reasoning", "is_recommended", "status", "created_at", "updated_at", "job_title", "company_name", "resume_title", "user_name")
    ID_FIELD_NUMBER: _ClassVar[int]
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    OVERALL_SCORE_FIELD_NUMBER: _ClassVar[int]
    SKILL_SCORE_FIELD_NUMBER: _ClassVar[int]
    EXPERIENCE_SCORE_FIELD_NUMBER: _ClassVar[int]
    CULTURE_SCORE_FIELD_NUMBER: _ClassVar[int]
    SCORE_BREAKDOWN_FIELD_NUMBER: _ClassVar[int]
    AI_REASONING_FIELD_NUMBER: _ClassVar[int]
    IS_RECOMMENDED_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    JOB_TITLE_FIELD_NUMBER: _ClassVar[int]
    COMPANY_NAME_FIELD_NUMBER: _ClassVar[int]
    RESUME_TITLE_FIELD_NUMBER: _ClassVar[int]
    USER_NAME_FIELD_NUMBER: _ClassVar[int]
    id: str
    job_id: str
    resume_id: str
    user_id: str
    overall_score: float
    skill_score: float
    experience_score: float
    culture_score: float
    score_breakdown: ScoreBreakdown
    ai_reasoning: str
    is_recommended: bool
    status: MatchStatus
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    job_title: str
    company_name: str
    resume_title: str
    user_name: str
    def __init__(self, id: _Optional[str] = ..., job_id: _Optional[str] = ..., resume_id: _Optional[str] = ..., user_id: _Optional[str] = ..., overall_score: _Optional[float] = ..., skill_score: _Optional[float] = ..., experience_score: _Optional[float] = ..., culture_score: _Optional[float] = ..., score_breakdown: _Optional[_Union[ScoreBreakdown, _Mapping]] = ..., ai_reasoning: _Optional[str] = ..., is_recommended: bool = ..., status: _Optional[_Union[MatchStatus, str]] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., updated_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., job_title: _Optional[str] = ..., company_name: _Optional[str] = ..., resume_title: _Optional[str] = ..., user_name: _Optional[str] = ...) -> None: ...

class ScoreBreakdown(_message.Message):
    __slots__ = ("skill_matches", "skill_coverage", "required_experience_years", "candidate_experience_years", "experience_meets_requirement", "location_score", "salary_fit_score", "job_type_score", "strengths", "gaps")
    SKILL_MATCHES_FIELD_NUMBER: _ClassVar[int]
    SKILL_COVERAGE_FIELD_NUMBER: _ClassVar[int]
    REQUIRED_EXPERIENCE_YEARS_FIELD_NUMBER: _ClassVar[int]
    CANDIDATE_EXPERIENCE_YEARS_FIELD_NUMBER: _ClassVar[int]
    EXPERIENCE_MEETS_REQUIREMENT_FIELD_NUMBER: _ClassVar[int]
    LOCATION_SCORE_FIELD_NUMBER: _ClassVar[int]
    SALARY_FIT_SCORE_FIELD_NUMBER: _ClassVar[int]
    JOB_TYPE_SCORE_FIELD_NUMBER: _ClassVar[int]
    STRENGTHS_FIELD_NUMBER: _ClassVar[int]
    GAPS_FIELD_NUMBER: _ClassVar[int]
    skill_matches: _containers.RepeatedCompositeFieldContainer[SkillMatch]
    skill_coverage: float
    required_experience_years: int
    candidate_experience_years: int
    experience_meets_requirement: bool
    location_score: float
    salary_fit_score: float
    job_type_score: float
    strengths: _containers.RepeatedScalarFieldContainer[str]
    gaps: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, skill_matches: _Optional[_Iterable[_Union[SkillMatch, _Mapping]]] = ..., skill_coverage: _Optional[float] = ..., required_experience_years: _Optional[int] = ..., candidate_experience_years: _Optional[int] = ..., experience_meets_requirement: bool = ..., location_score: _Optional[float] = ..., salary_fit_score: _Optional[float] = ..., job_type_score: _Optional[float] = ..., strengths: _Optional[_Iterable[str]] = ..., gaps: _Optional[_Iterable[str]] = ...) -> None: ...

class SkillMatch(_message.Message):
    __slots__ = ("skill_name", "required", "matched", "proficiency_score", "candidate_years")
    SKILL_NAME_FIELD_NUMBER: _ClassVar[int]
    REQUIRED_FIELD_NUMBER: _ClassVar[int]
    MATCHED_FIELD_NUMBER: _ClassVar[int]
    PROFICIENCY_SCORE_FIELD_NUMBER: _ClassVar[int]
    CANDIDATE_YEARS_FIELD_NUMBER: _ClassVar[int]
    skill_name: str
    required: bool
    matched: bool
    proficiency_score: float
    candidate_years: int
    def __init__(self, skill_name: _Optional[str] = ..., required: bool = ..., matched: bool = ..., proficiency_score: _Optional[float] = ..., candidate_years: _Optional[int] = ...) -> None: ...

class MatchFeedback(_message.Message):
    __slots__ = ("id", "match_id", "feedback_type", "feedback_by", "comment", "created_at")
    ID_FIELD_NUMBER: _ClassVar[int]
    MATCH_ID_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_TYPE_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_BY_FIELD_NUMBER: _ClassVar[int]
    COMMENT_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    id: str
    match_id: str
    feedback_type: FeedbackType
    feedback_by: str
    comment: str
    created_at: _timestamp_pb2.Timestamp
    def __init__(self, id: _Optional[str] = ..., match_id: _Optional[str] = ..., feedback_type: _Optional[_Union[FeedbackType, str]] = ..., feedback_by: _Optional[str] = ..., comment: _Optional[str] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class CreateMatchRequest(_message.Message):
    __slots__ = ("job_id", "resume_id", "user_id")
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    resume_id: str
    user_id: str
    def __init__(self, job_id: _Optional[str] = ..., resume_id: _Optional[str] = ..., user_id: _Optional[str] = ...) -> None: ...

class CreateMatchResponse(_message.Message):
    __slots__ = ("match",)
    MATCH_FIELD_NUMBER: _ClassVar[int]
    match: Match
    def __init__(self, match: _Optional[_Union[Match, _Mapping]] = ...) -> None: ...

class GetMatchRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class GetMatchResponse(_message.Message):
    __slots__ = ("match",)
    MATCH_FIELD_NUMBER: _ClassVar[int]
    match: Match
    def __init__(self, match: _Optional[_Union[Match, _Mapping]] = ...) -> None: ...

class DeleteMatchRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class DeleteMatchResponse(_message.Message):
    __slots__ = ("success",)
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class ListMatchesRequest(_message.Message):
    __slots__ = ("pagination", "job_id", "resume_id", "user_id", "overall_score_range", "is_recommended", "status", "sort")
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    OVERALL_SCORE_RANGE_FIELD_NUMBER: _ClassVar[int]
    IS_RECOMMENDED_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    SORT_FIELD_NUMBER: _ClassVar[int]
    pagination: _common_pb2.PaginationRequest
    job_id: str
    resume_id: str
    user_id: str
    overall_score_range: _common_pb2.IntRange
    is_recommended: bool
    status: MatchStatus
    sort: _common_pb2.SortOrder
    def __init__(self, pagination: _Optional[_Union[_common_pb2.PaginationRequest, _Mapping]] = ..., job_id: _Optional[str] = ..., resume_id: _Optional[str] = ..., user_id: _Optional[str] = ..., overall_score_range: _Optional[_Union[_common_pb2.IntRange, _Mapping]] = ..., is_recommended: bool = ..., status: _Optional[_Union[MatchStatus, str]] = ..., sort: _Optional[_Union[_common_pb2.SortOrder, _Mapping]] = ...) -> None: ...

class ListMatchesResponse(_message.Message):
    __slots__ = ("matches", "pagination")
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    pagination: _common_pb2.PaginationResponse
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ..., pagination: _Optional[_Union[_common_pb2.PaginationResponse, _Mapping]] = ...) -> None: ...

class GetMatchesByJobRequest(_message.Message):
    __slots__ = ("job_id", "pagination", "min_score", "only_recommended", "sort")
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    MIN_SCORE_FIELD_NUMBER: _ClassVar[int]
    ONLY_RECOMMENDED_FIELD_NUMBER: _ClassVar[int]
    SORT_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    pagination: _common_pb2.PaginationRequest
    min_score: float
    only_recommended: bool
    sort: _common_pb2.SortOrder
    def __init__(self, job_id: _Optional[str] = ..., pagination: _Optional[_Union[_common_pb2.PaginationRequest, _Mapping]] = ..., min_score: _Optional[float] = ..., only_recommended: bool = ..., sort: _Optional[_Union[_common_pb2.SortOrder, _Mapping]] = ...) -> None: ...

class GetMatchesByJobResponse(_message.Message):
    __slots__ = ("matches", "pagination")
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    pagination: _common_pb2.PaginationResponse
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ..., pagination: _Optional[_Union[_common_pb2.PaginationResponse, _Mapping]] = ...) -> None: ...

class GetMatchesByUserRequest(_message.Message):
    __slots__ = ("user_id", "pagination", "min_score", "only_recommended", "sort")
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    MIN_SCORE_FIELD_NUMBER: _ClassVar[int]
    ONLY_RECOMMENDED_FIELD_NUMBER: _ClassVar[int]
    SORT_FIELD_NUMBER: _ClassVar[int]
    user_id: str
    pagination: _common_pb2.PaginationRequest
    min_score: float
    only_recommended: bool
    sort: _common_pb2.SortOrder
    def __init__(self, user_id: _Optional[str] = ..., pagination: _Optional[_Union[_common_pb2.PaginationRequest, _Mapping]] = ..., min_score: _Optional[float] = ..., only_recommended: bool = ..., sort: _Optional[_Union[_common_pb2.SortOrder, _Mapping]] = ...) -> None: ...

class GetMatchesByUserResponse(_message.Message):
    __slots__ = ("matches", "pagination")
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    pagination: _common_pb2.PaginationResponse
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ..., pagination: _Optional[_Union[_common_pb2.PaginationResponse, _Mapping]] = ...) -> None: ...

class GetMatchesByResumeRequest(_message.Message):
    __slots__ = ("resume_id", "pagination", "min_score", "only_recommended", "sort")
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    MIN_SCORE_FIELD_NUMBER: _ClassVar[int]
    ONLY_RECOMMENDED_FIELD_NUMBER: _ClassVar[int]
    SORT_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    pagination: _common_pb2.PaginationRequest
    min_score: float
    only_recommended: bool
    sort: _common_pb2.SortOrder
    def __init__(self, resume_id: _Optional[str] = ..., pagination: _Optional[_Union[_common_pb2.PaginationRequest, _Mapping]] = ..., min_score: _Optional[float] = ..., only_recommended: bool = ..., sort: _Optional[_Union[_common_pb2.SortOrder, _Mapping]] = ...) -> None: ...

class GetMatchesByResumeResponse(_message.Message):
    __slots__ = ("matches", "pagination")
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    pagination: _common_pb2.PaginationResponse
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ..., pagination: _Optional[_Union[_common_pb2.PaginationResponse, _Mapping]] = ...) -> None: ...

class CalculateMatchRequest(_message.Message):
    __slots__ = ("job_id", "resume_id", "user_id", "force_recalculate")
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    FORCE_RECALCULATE_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    resume_id: str
    user_id: str
    force_recalculate: bool
    def __init__(self, job_id: _Optional[str] = ..., resume_id: _Optional[str] = ..., user_id: _Optional[str] = ..., force_recalculate: bool = ...) -> None: ...

class CalculateMatchResponse(_message.Message):
    __slots__ = ("match", "was_cached")
    MATCH_FIELD_NUMBER: _ClassVar[int]
    WAS_CACHED_FIELD_NUMBER: _ClassVar[int]
    match: Match
    was_cached: bool
    def __init__(self, match: _Optional[_Union[Match, _Mapping]] = ..., was_cached: bool = ...) -> None: ...

class BatchCalculateMatchesRequest(_message.Message):
    __slots__ = ("job_id", "resume_ids", "force_recalculate")
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_IDS_FIELD_NUMBER: _ClassVar[int]
    FORCE_RECALCULATE_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    resume_ids: _containers.RepeatedScalarFieldContainer[str]
    force_recalculate: bool
    def __init__(self, job_id: _Optional[str] = ..., resume_ids: _Optional[_Iterable[str]] = ..., force_recalculate: bool = ...) -> None: ...

class BatchCalculateMatchesResponse(_message.Message):
    __slots__ = ("matches", "result")
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    RESULT_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    result: _common_pb2.BatchResult
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ..., result: _Optional[_Union[_common_pb2.BatchResult, _Mapping]] = ...) -> None: ...

class CalculateMatchesForJobRequest(_message.Message):
    __slots__ = ("job_id", "limit", "min_score_threshold", "force_recalculate")
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    MIN_SCORE_THRESHOLD_FIELD_NUMBER: _ClassVar[int]
    FORCE_RECALCULATE_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    limit: int
    min_score_threshold: float
    force_recalculate: bool
    def __init__(self, job_id: _Optional[str] = ..., limit: _Optional[int] = ..., min_score_threshold: _Optional[float] = ..., force_recalculate: bool = ...) -> None: ...

class CalculateMatchesForJobResponse(_message.Message):
    __slots__ = ("matches", "total_processed", "total_qualified")
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    TOTAL_PROCESSED_FIELD_NUMBER: _ClassVar[int]
    TOTAL_QUALIFIED_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    total_processed: int
    total_qualified: int
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ..., total_processed: _Optional[int] = ..., total_qualified: _Optional[int] = ...) -> None: ...

class CalculateMatchesForUserRequest(_message.Message):
    __slots__ = ("user_id", "resume_id", "limit", "min_score_threshold", "force_recalculate")
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    MIN_SCORE_THRESHOLD_FIELD_NUMBER: _ClassVar[int]
    FORCE_RECALCULATE_FIELD_NUMBER: _ClassVar[int]
    user_id: str
    resume_id: str
    limit: int
    min_score_threshold: float
    force_recalculate: bool
    def __init__(self, user_id: _Optional[str] = ..., resume_id: _Optional[str] = ..., limit: _Optional[int] = ..., min_score_threshold: _Optional[float] = ..., force_recalculate: bool = ...) -> None: ...

class CalculateMatchesForUserResponse(_message.Message):
    __slots__ = ("matches", "total_processed", "total_qualified")
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    TOTAL_PROCESSED_FIELD_NUMBER: _ClassVar[int]
    TOTAL_QUALIFIED_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    total_processed: int
    total_qualified: int
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ..., total_processed: _Optional[int] = ..., total_qualified: _Optional[int] = ...) -> None: ...

class GetTopMatchesForJobRequest(_message.Message):
    __slots__ = ("job_id", "top_n", "min_score")
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    TOP_N_FIELD_NUMBER: _ClassVar[int]
    MIN_SCORE_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    top_n: int
    min_score: float
    def __init__(self, job_id: _Optional[str] = ..., top_n: _Optional[int] = ..., min_score: _Optional[float] = ...) -> None: ...

class GetTopMatchesForJobResponse(_message.Message):
    __slots__ = ("matches",)
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ...) -> None: ...

class GetRecommendedJobsForUserRequest(_message.Message):
    __slots__ = ("user_id", "resume_id", "limit")
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    LIMIT_FIELD_NUMBER: _ClassVar[int]
    user_id: str
    resume_id: str
    limit: int
    def __init__(self, user_id: _Optional[str] = ..., resume_id: _Optional[str] = ..., limit: _Optional[int] = ...) -> None: ...

class GetRecommendedJobsForUserResponse(_message.Message):
    __slots__ = ("matches",)
    MATCHES_FIELD_NUMBER: _ClassVar[int]
    matches: _containers.RepeatedCompositeFieldContainer[Match]
    def __init__(self, matches: _Optional[_Iterable[_Union[Match, _Mapping]]] = ...) -> None: ...

class CreateMatchFeedbackRequest(_message.Message):
    __slots__ = ("match_id", "feedback_type", "feedback_by", "comment")
    MATCH_ID_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_TYPE_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_BY_FIELD_NUMBER: _ClassVar[int]
    COMMENT_FIELD_NUMBER: _ClassVar[int]
    match_id: str
    feedback_type: FeedbackType
    feedback_by: str
    comment: str
    def __init__(self, match_id: _Optional[str] = ..., feedback_type: _Optional[_Union[FeedbackType, str]] = ..., feedback_by: _Optional[str] = ..., comment: _Optional[str] = ...) -> None: ...

class CreateMatchFeedbackResponse(_message.Message):
    __slots__ = ("feedback",)
    FEEDBACK_FIELD_NUMBER: _ClassVar[int]
    feedback: MatchFeedback
    def __init__(self, feedback: _Optional[_Union[MatchFeedback, _Mapping]] = ...) -> None: ...

class GetMatchFeedbackRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class GetMatchFeedbackResponse(_message.Message):
    __slots__ = ("feedback",)
    FEEDBACK_FIELD_NUMBER: _ClassVar[int]
    feedback: MatchFeedback
    def __init__(self, feedback: _Optional[_Union[MatchFeedback, _Mapping]] = ...) -> None: ...

class ListMatchFeedbacksRequest(_message.Message):
    __slots__ = ("pagination", "match_id", "feedback_by", "feedback_type")
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    MATCH_ID_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_BY_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_TYPE_FIELD_NUMBER: _ClassVar[int]
    pagination: _common_pb2.PaginationRequest
    match_id: str
    feedback_by: str
    feedback_type: FeedbackType
    def __init__(self, pagination: _Optional[_Union[_common_pb2.PaginationRequest, _Mapping]] = ..., match_id: _Optional[str] = ..., feedback_by: _Optional[str] = ..., feedback_type: _Optional[_Union[FeedbackType, str]] = ...) -> None: ...

class ListMatchFeedbacksResponse(_message.Message):
    __slots__ = ("feedbacks", "pagination")
    FEEDBACKS_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    feedbacks: _containers.RepeatedCompositeFieldContainer[MatchFeedback]
    pagination: _common_pb2.PaginationResponse
    def __init__(self, feedbacks: _Optional[_Iterable[_Union[MatchFeedback, _Mapping]]] = ..., pagination: _Optional[_Union[_common_pb2.PaginationResponse, _Mapping]] = ...) -> None: ...

class GetFeedbackByMatchRequest(_message.Message):
    __slots__ = ("match_id",)
    MATCH_ID_FIELD_NUMBER: _ClassVar[int]
    match_id: str
    def __init__(self, match_id: _Optional[str] = ...) -> None: ...

class GetFeedbackByMatchResponse(_message.Message):
    __slots__ = ("feedbacks",)
    FEEDBACKS_FIELD_NUMBER: _ClassVar[int]
    feedbacks: _containers.RepeatedCompositeFieldContainer[MatchFeedback]
    def __init__(self, feedbacks: _Optional[_Iterable[_Union[MatchFeedback, _Mapping]]] = ...) -> None: ...

class GetMatchStatsRequest(_message.Message):
    __slots__ = ("job_id", "user_id", "company_id", "date_range")
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    COMPANY_ID_FIELD_NUMBER: _ClassVar[int]
    DATE_RANGE_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    user_id: str
    company_id: str
    date_range: _common_pb2.DateRange
    def __init__(self, job_id: _Optional[str] = ..., user_id: _Optional[str] = ..., company_id: _Optional[str] = ..., date_range: _Optional[_Union[_common_pb2.DateRange, _Mapping]] = ...) -> None: ...

class GetMatchStatsResponse(_message.Message):
    __slots__ = ("total_matches", "average_overall_score", "average_skill_score", "average_experience_score", "average_culture_score", "recommended_count", "score_distribution", "feedback_distribution")
    class ScoreDistributionEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    class FeedbackDistributionEntry(_message.Message):
        __slots__ = ("key", "value")
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: int
        def __init__(self, key: _Optional[str] = ..., value: _Optional[int] = ...) -> None: ...
    TOTAL_MATCHES_FIELD_NUMBER: _ClassVar[int]
    AVERAGE_OVERALL_SCORE_FIELD_NUMBER: _ClassVar[int]
    AVERAGE_SKILL_SCORE_FIELD_NUMBER: _ClassVar[int]
    AVERAGE_EXPERIENCE_SCORE_FIELD_NUMBER: _ClassVar[int]
    AVERAGE_CULTURE_SCORE_FIELD_NUMBER: _ClassVar[int]
    RECOMMENDED_COUNT_FIELD_NUMBER: _ClassVar[int]
    SCORE_DISTRIBUTION_FIELD_NUMBER: _ClassVar[int]
    FEEDBACK_DISTRIBUTION_FIELD_NUMBER: _ClassVar[int]
    total_matches: int
    average_overall_score: float
    average_skill_score: float
    average_experience_score: float
    average_culture_score: float
    recommended_count: int
    score_distribution: _containers.ScalarMap[str, int]
    feedback_distribution: _containers.ScalarMap[str, int]
    def __init__(self, total_matches: _Optional[int] = ..., average_overall_score: _Optional[float] = ..., average_skill_score: _Optional[float] = ..., average_experience_score: _Optional[float] = ..., average_culture_score: _Optional[float] = ..., recommended_count: _Optional[int] = ..., score_distribution: _Optional[_Mapping[str, int]] = ..., feedback_distribution: _Optional[_Mapping[str, int]] = ...) -> None: ...

class GetMatchingInsightsRequest(_message.Message):
    __slots__ = ("job_id",)
    JOB_ID_FIELD_NUMBER: _ClassVar[int]
    job_id: str
    def __init__(self, job_id: _Optional[str] = ...) -> None: ...

class GetMatchingInsightsResponse(_message.Message):
    __slots__ = ("most_common_skill_gaps", "most_matched_skills", "average_experience_gap", "recommendation")
    MOST_COMMON_SKILL_GAPS_FIELD_NUMBER: _ClassVar[int]
    MOST_MATCHED_SKILLS_FIELD_NUMBER: _ClassVar[int]
    AVERAGE_EXPERIENCE_GAP_FIELD_NUMBER: _ClassVar[int]
    RECOMMENDATION_FIELD_NUMBER: _ClassVar[int]
    most_common_skill_gaps: _containers.RepeatedScalarFieldContainer[str]
    most_matched_skills: _containers.RepeatedScalarFieldContainer[str]
    average_experience_gap: float
    recommendation: str
    def __init__(self, most_common_skill_gaps: _Optional[_Iterable[str]] = ..., most_matched_skills: _Optional[_Iterable[str]] = ..., average_experience_gap: _Optional[float] = ..., recommendation: _Optional[str] = ...) -> None: ...
