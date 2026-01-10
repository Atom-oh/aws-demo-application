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

class ResumeStatus(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    RESUME_STATUS_UNSPECIFIED: _ClassVar[ResumeStatus]
    RESUME_STATUS_PENDING: _ClassVar[ResumeStatus]
    RESUME_STATUS_PROCESSING: _ClassVar[ResumeStatus]
    RESUME_STATUS_ACTIVE: _ClassVar[ResumeStatus]
    RESUME_STATUS_FAILED: _ClassVar[ResumeStatus]
    RESUME_STATUS_DELETED: _ClassVar[ResumeStatus]

class FileType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    FILE_TYPE_UNSPECIFIED: _ClassVar[FileType]
    FILE_TYPE_PDF: _ClassVar[FileType]
    FILE_TYPE_DOCX: _ClassVar[FileType]
    FILE_TYPE_DOC: _ClassVar[FileType]
    FILE_TYPE_HWP: _ClassVar[FileType]
    FILE_TYPE_TXT: _ClassVar[FileType]

class SkillProficiency(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SKILL_PROFICIENCY_UNSPECIFIED: _ClassVar[SkillProficiency]
    SKILL_PROFICIENCY_BEGINNER: _ClassVar[SkillProficiency]
    SKILL_PROFICIENCY_INTERMEDIATE: _ClassVar[SkillProficiency]
    SKILL_PROFICIENCY_ADVANCED: _ClassVar[SkillProficiency]
    SKILL_PROFICIENCY_EXPERT: _ClassVar[SkillProficiency]

class DegreeType(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    DEGREE_TYPE_UNSPECIFIED: _ClassVar[DegreeType]
    DEGREE_TYPE_HIGH_SCHOOL: _ClassVar[DegreeType]
    DEGREE_TYPE_ASSOCIATE: _ClassVar[DegreeType]
    DEGREE_TYPE_BACHELOR: _ClassVar[DegreeType]
    DEGREE_TYPE_MASTER: _ClassVar[DegreeType]
    DEGREE_TYPE_DOCTORATE: _ClassVar[DegreeType]
    DEGREE_TYPE_OTHER: _ClassVar[DegreeType]
RESUME_STATUS_UNSPECIFIED: ResumeStatus
RESUME_STATUS_PENDING: ResumeStatus
RESUME_STATUS_PROCESSING: ResumeStatus
RESUME_STATUS_ACTIVE: ResumeStatus
RESUME_STATUS_FAILED: ResumeStatus
RESUME_STATUS_DELETED: ResumeStatus
FILE_TYPE_UNSPECIFIED: FileType
FILE_TYPE_PDF: FileType
FILE_TYPE_DOCX: FileType
FILE_TYPE_DOC: FileType
FILE_TYPE_HWP: FileType
FILE_TYPE_TXT: FileType
SKILL_PROFICIENCY_UNSPECIFIED: SkillProficiency
SKILL_PROFICIENCY_BEGINNER: SkillProficiency
SKILL_PROFICIENCY_INTERMEDIATE: SkillProficiency
SKILL_PROFICIENCY_ADVANCED: SkillProficiency
SKILL_PROFICIENCY_EXPERT: SkillProficiency
DEGREE_TYPE_UNSPECIFIED: DegreeType
DEGREE_TYPE_HIGH_SCHOOL: DegreeType
DEGREE_TYPE_ASSOCIATE: DegreeType
DEGREE_TYPE_BACHELOR: DegreeType
DEGREE_TYPE_MASTER: DegreeType
DEGREE_TYPE_DOCTORATE: DegreeType
DEGREE_TYPE_OTHER: DegreeType

class Resume(_message.Message):
    __slots__ = ("id", "user_id", "title", "original_file_url", "original_file_name", "file_type", "masked_content", "parsed_content", "ai_summary", "is_primary", "status", "created_at", "updated_at", "experiences", "skills", "educations")
    ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    ORIGINAL_FILE_URL_FIELD_NUMBER: _ClassVar[int]
    ORIGINAL_FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_TYPE_FIELD_NUMBER: _ClassVar[int]
    MASKED_CONTENT_FIELD_NUMBER: _ClassVar[int]
    PARSED_CONTENT_FIELD_NUMBER: _ClassVar[int]
    AI_SUMMARY_FIELD_NUMBER: _ClassVar[int]
    IS_PRIMARY_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    EXPERIENCES_FIELD_NUMBER: _ClassVar[int]
    SKILLS_FIELD_NUMBER: _ClassVar[int]
    EDUCATIONS_FIELD_NUMBER: _ClassVar[int]
    id: str
    user_id: str
    title: str
    original_file_url: str
    original_file_name: str
    file_type: FileType
    masked_content: str
    parsed_content: str
    ai_summary: str
    is_primary: bool
    status: ResumeStatus
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    experiences: _containers.RepeatedCompositeFieldContainer[ResumeExperience]
    skills: _containers.RepeatedCompositeFieldContainer[ResumeSkill]
    educations: _containers.RepeatedCompositeFieldContainer[ResumeEducation]
    def __init__(self, id: _Optional[str] = ..., user_id: _Optional[str] = ..., title: _Optional[str] = ..., original_file_url: _Optional[str] = ..., original_file_name: _Optional[str] = ..., file_type: _Optional[_Union[FileType, str]] = ..., masked_content: _Optional[str] = ..., parsed_content: _Optional[str] = ..., ai_summary: _Optional[str] = ..., is_primary: bool = ..., status: _Optional[_Union[ResumeStatus, str]] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., updated_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., experiences: _Optional[_Iterable[_Union[ResumeExperience, _Mapping]]] = ..., skills: _Optional[_Iterable[_Union[ResumeSkill, _Mapping]]] = ..., educations: _Optional[_Iterable[_Union[ResumeEducation, _Mapping]]] = ...) -> None: ...

class ResumeExperience(_message.Message):
    __slots__ = ("id", "resume_id", "company_name", "position", "start_date", "end_date", "is_current", "description", "created_at", "updated_at")
    ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    COMPANY_NAME_FIELD_NUMBER: _ClassVar[int]
    POSITION_FIELD_NUMBER: _ClassVar[int]
    START_DATE_FIELD_NUMBER: _ClassVar[int]
    END_DATE_FIELD_NUMBER: _ClassVar[int]
    IS_CURRENT_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    id: str
    resume_id: str
    company_name: str
    position: str
    start_date: _timestamp_pb2.Timestamp
    end_date: _timestamp_pb2.Timestamp
    is_current: bool
    description: str
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    def __init__(self, id: _Optional[str] = ..., resume_id: _Optional[str] = ..., company_name: _Optional[str] = ..., position: _Optional[str] = ..., start_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., end_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., is_current: bool = ..., description: _Optional[str] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., updated_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class ResumeSkill(_message.Message):
    __slots__ = ("id", "resume_id", "skill_name", "proficiency", "years", "created_at", "updated_at")
    ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    SKILL_NAME_FIELD_NUMBER: _ClassVar[int]
    PROFICIENCY_FIELD_NUMBER: _ClassVar[int]
    YEARS_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    id: str
    resume_id: str
    skill_name: str
    proficiency: SkillProficiency
    years: int
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    def __init__(self, id: _Optional[str] = ..., resume_id: _Optional[str] = ..., skill_name: _Optional[str] = ..., proficiency: _Optional[_Union[SkillProficiency, str]] = ..., years: _Optional[int] = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., updated_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class ResumeEducation(_message.Message):
    __slots__ = ("id", "resume_id", "school_name", "degree", "major", "start_date", "end_date", "is_current", "created_at", "updated_at")
    ID_FIELD_NUMBER: _ClassVar[int]
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    SCHOOL_NAME_FIELD_NUMBER: _ClassVar[int]
    DEGREE_FIELD_NUMBER: _ClassVar[int]
    MAJOR_FIELD_NUMBER: _ClassVar[int]
    START_DATE_FIELD_NUMBER: _ClassVar[int]
    END_DATE_FIELD_NUMBER: _ClassVar[int]
    IS_CURRENT_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    id: str
    resume_id: str
    school_name: str
    degree: DegreeType
    major: str
    start_date: _timestamp_pb2.Timestamp
    end_date: _timestamp_pb2.Timestamp
    is_current: bool
    created_at: _timestamp_pb2.Timestamp
    updated_at: _timestamp_pb2.Timestamp
    def __init__(self, id: _Optional[str] = ..., resume_id: _Optional[str] = ..., school_name: _Optional[str] = ..., degree: _Optional[_Union[DegreeType, str]] = ..., major: _Optional[str] = ..., start_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., end_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., is_current: bool = ..., created_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., updated_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class CreateResumeRequest(_message.Message):
    __slots__ = ("user_id", "title", "original_file_url", "original_file_name", "file_type", "is_primary")
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    ORIGINAL_FILE_URL_FIELD_NUMBER: _ClassVar[int]
    ORIGINAL_FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_TYPE_FIELD_NUMBER: _ClassVar[int]
    IS_PRIMARY_FIELD_NUMBER: _ClassVar[int]
    user_id: str
    title: str
    original_file_url: str
    original_file_name: str
    file_type: FileType
    is_primary: bool
    def __init__(self, user_id: _Optional[str] = ..., title: _Optional[str] = ..., original_file_url: _Optional[str] = ..., original_file_name: _Optional[str] = ..., file_type: _Optional[_Union[FileType, str]] = ..., is_primary: bool = ...) -> None: ...

class CreateResumeResponse(_message.Message):
    __slots__ = ("resume",)
    RESUME_FIELD_NUMBER: _ClassVar[int]
    resume: Resume
    def __init__(self, resume: _Optional[_Union[Resume, _Mapping]] = ...) -> None: ...

class GetResumeRequest(_message.Message):
    __slots__ = ("id", "include_experiences", "include_skills", "include_educations")
    ID_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_EXPERIENCES_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_SKILLS_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_EDUCATIONS_FIELD_NUMBER: _ClassVar[int]
    id: str
    include_experiences: bool
    include_skills: bool
    include_educations: bool
    def __init__(self, id: _Optional[str] = ..., include_experiences: bool = ..., include_skills: bool = ..., include_educations: bool = ...) -> None: ...

class GetResumeResponse(_message.Message):
    __slots__ = ("resume",)
    RESUME_FIELD_NUMBER: _ClassVar[int]
    resume: Resume
    def __init__(self, resume: _Optional[_Union[Resume, _Mapping]] = ...) -> None: ...

class UpdateResumeRequest(_message.Message):
    __slots__ = ("id", "title", "is_primary", "status")
    ID_FIELD_NUMBER: _ClassVar[int]
    TITLE_FIELD_NUMBER: _ClassVar[int]
    IS_PRIMARY_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    id: str
    title: str
    is_primary: bool
    status: ResumeStatus
    def __init__(self, id: _Optional[str] = ..., title: _Optional[str] = ..., is_primary: bool = ..., status: _Optional[_Union[ResumeStatus, str]] = ...) -> None: ...

class UpdateResumeResponse(_message.Message):
    __slots__ = ("resume",)
    RESUME_FIELD_NUMBER: _ClassVar[int]
    resume: Resume
    def __init__(self, resume: _Optional[_Union[Resume, _Mapping]] = ...) -> None: ...

class DeleteResumeRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class DeleteResumeResponse(_message.Message):
    __slots__ = ("success",)
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class ListResumesRequest(_message.Message):
    __slots__ = ("pagination", "user_id", "status", "is_primary", "sort", "include_details")
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    IS_PRIMARY_FIELD_NUMBER: _ClassVar[int]
    SORT_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_DETAILS_FIELD_NUMBER: _ClassVar[int]
    pagination: _common_pb2.PaginationRequest
    user_id: str
    status: ResumeStatus
    is_primary: bool
    sort: _common_pb2.SortOrder
    include_details: bool
    def __init__(self, pagination: _Optional[_Union[_common_pb2.PaginationRequest, _Mapping]] = ..., user_id: _Optional[str] = ..., status: _Optional[_Union[ResumeStatus, str]] = ..., is_primary: bool = ..., sort: _Optional[_Union[_common_pb2.SortOrder, _Mapping]] = ..., include_details: bool = ...) -> None: ...

class ListResumesResponse(_message.Message):
    __slots__ = ("resumes", "pagination")
    RESUMES_FIELD_NUMBER: _ClassVar[int]
    PAGINATION_FIELD_NUMBER: _ClassVar[int]
    resumes: _containers.RepeatedCompositeFieldContainer[Resume]
    pagination: _common_pb2.PaginationResponse
    def __init__(self, resumes: _Optional[_Iterable[_Union[Resume, _Mapping]]] = ..., pagination: _Optional[_Union[_common_pb2.PaginationResponse, _Mapping]] = ...) -> None: ...

class GetResumesByUserIdRequest(_message.Message):
    __slots__ = ("user_id", "include_details")
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    INCLUDE_DETAILS_FIELD_NUMBER: _ClassVar[int]
    user_id: str
    include_details: bool
    def __init__(self, user_id: _Optional[str] = ..., include_details: bool = ...) -> None: ...

class GetResumesByUserIdResponse(_message.Message):
    __slots__ = ("resumes",)
    RESUMES_FIELD_NUMBER: _ClassVar[int]
    resumes: _containers.RepeatedCompositeFieldContainer[Resume]
    def __init__(self, resumes: _Optional[_Iterable[_Union[Resume, _Mapping]]] = ...) -> None: ...

class SetPrimaryResumeRequest(_message.Message):
    __slots__ = ("id", "user_id")
    ID_FIELD_NUMBER: _ClassVar[int]
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    user_id: str
    def __init__(self, id: _Optional[str] = ..., user_id: _Optional[str] = ...) -> None: ...

class SetPrimaryResumeResponse(_message.Message):
    __slots__ = ("resume",)
    RESUME_FIELD_NUMBER: _ClassVar[int]
    resume: Resume
    def __init__(self, resume: _Optional[_Union[Resume, _Mapping]] = ...) -> None: ...

class ProcessResumeRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class ProcessResumeResponse(_message.Message):
    __slots__ = ("resume", "success", "error_message")
    RESUME_FIELD_NUMBER: _ClassVar[int]
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    resume: Resume
    success: bool
    error_message: str
    def __init__(self, resume: _Optional[_Union[Resume, _Mapping]] = ..., success: bool = ..., error_message: _Optional[str] = ...) -> None: ...

class UpdateParsedContentRequest(_message.Message):
    __slots__ = ("id", "parsed_content", "masked_content", "ai_summary")
    ID_FIELD_NUMBER: _ClassVar[int]
    PARSED_CONTENT_FIELD_NUMBER: _ClassVar[int]
    MASKED_CONTENT_FIELD_NUMBER: _ClassVar[int]
    AI_SUMMARY_FIELD_NUMBER: _ClassVar[int]
    id: str
    parsed_content: str
    masked_content: str
    ai_summary: str
    def __init__(self, id: _Optional[str] = ..., parsed_content: _Optional[str] = ..., masked_content: _Optional[str] = ..., ai_summary: _Optional[str] = ...) -> None: ...

class UpdateParsedContentResponse(_message.Message):
    __slots__ = ("resume",)
    RESUME_FIELD_NUMBER: _ClassVar[int]
    resume: Resume
    def __init__(self, resume: _Optional[_Union[Resume, _Mapping]] = ...) -> None: ...

class GeneratePresignedUploadUrlRequest(_message.Message):
    __slots__ = ("user_id", "file_name", "file_type")
    USER_ID_FIELD_NUMBER: _ClassVar[int]
    FILE_NAME_FIELD_NUMBER: _ClassVar[int]
    FILE_TYPE_FIELD_NUMBER: _ClassVar[int]
    user_id: str
    file_name: str
    file_type: FileType
    def __init__(self, user_id: _Optional[str] = ..., file_name: _Optional[str] = ..., file_type: _Optional[_Union[FileType, str]] = ...) -> None: ...

class GeneratePresignedUploadUrlResponse(_message.Message):
    __slots__ = ("upload_url", "file_key", "expires_at")
    UPLOAD_URL_FIELD_NUMBER: _ClassVar[int]
    FILE_KEY_FIELD_NUMBER: _ClassVar[int]
    EXPIRES_AT_FIELD_NUMBER: _ClassVar[int]
    upload_url: str
    file_key: str
    expires_at: _timestamp_pb2.Timestamp
    def __init__(self, upload_url: _Optional[str] = ..., file_key: _Optional[str] = ..., expires_at: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class CreateResumeExperienceRequest(_message.Message):
    __slots__ = ("resume_id", "company_name", "position", "start_date", "end_date", "is_current", "description")
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    COMPANY_NAME_FIELD_NUMBER: _ClassVar[int]
    POSITION_FIELD_NUMBER: _ClassVar[int]
    START_DATE_FIELD_NUMBER: _ClassVar[int]
    END_DATE_FIELD_NUMBER: _ClassVar[int]
    IS_CURRENT_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    company_name: str
    position: str
    start_date: _timestamp_pb2.Timestamp
    end_date: _timestamp_pb2.Timestamp
    is_current: bool
    description: str
    def __init__(self, resume_id: _Optional[str] = ..., company_name: _Optional[str] = ..., position: _Optional[str] = ..., start_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., end_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., is_current: bool = ..., description: _Optional[str] = ...) -> None: ...

class CreateResumeExperienceResponse(_message.Message):
    __slots__ = ("experience",)
    EXPERIENCE_FIELD_NUMBER: _ClassVar[int]
    experience: ResumeExperience
    def __init__(self, experience: _Optional[_Union[ResumeExperience, _Mapping]] = ...) -> None: ...

class UpdateResumeExperienceRequest(_message.Message):
    __slots__ = ("id", "company_name", "position", "start_date", "end_date", "is_current", "description")
    ID_FIELD_NUMBER: _ClassVar[int]
    COMPANY_NAME_FIELD_NUMBER: _ClassVar[int]
    POSITION_FIELD_NUMBER: _ClassVar[int]
    START_DATE_FIELD_NUMBER: _ClassVar[int]
    END_DATE_FIELD_NUMBER: _ClassVar[int]
    IS_CURRENT_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    id: str
    company_name: str
    position: str
    start_date: _timestamp_pb2.Timestamp
    end_date: _timestamp_pb2.Timestamp
    is_current: bool
    description: str
    def __init__(self, id: _Optional[str] = ..., company_name: _Optional[str] = ..., position: _Optional[str] = ..., start_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., end_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., is_current: bool = ..., description: _Optional[str] = ...) -> None: ...

class UpdateResumeExperienceResponse(_message.Message):
    __slots__ = ("experience",)
    EXPERIENCE_FIELD_NUMBER: _ClassVar[int]
    experience: ResumeExperience
    def __init__(self, experience: _Optional[_Union[ResumeExperience, _Mapping]] = ...) -> None: ...

class DeleteResumeExperienceRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class DeleteResumeExperienceResponse(_message.Message):
    __slots__ = ("success",)
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class ListResumeExperiencesRequest(_message.Message):
    __slots__ = ("resume_id",)
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    def __init__(self, resume_id: _Optional[str] = ...) -> None: ...

class ListResumeExperiencesResponse(_message.Message):
    __slots__ = ("experiences",)
    EXPERIENCES_FIELD_NUMBER: _ClassVar[int]
    experiences: _containers.RepeatedCompositeFieldContainer[ResumeExperience]
    def __init__(self, experiences: _Optional[_Iterable[_Union[ResumeExperience, _Mapping]]] = ...) -> None: ...

class BatchCreateResumeExperiencesRequest(_message.Message):
    __slots__ = ("resume_id", "experiences")
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    EXPERIENCES_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    experiences: _containers.RepeatedCompositeFieldContainer[CreateResumeExperienceRequest]
    def __init__(self, resume_id: _Optional[str] = ..., experiences: _Optional[_Iterable[_Union[CreateResumeExperienceRequest, _Mapping]]] = ...) -> None: ...

class BatchCreateResumeExperiencesResponse(_message.Message):
    __slots__ = ("experiences", "result")
    EXPERIENCES_FIELD_NUMBER: _ClassVar[int]
    RESULT_FIELD_NUMBER: _ClassVar[int]
    experiences: _containers.RepeatedCompositeFieldContainer[ResumeExperience]
    result: _common_pb2.BatchResult
    def __init__(self, experiences: _Optional[_Iterable[_Union[ResumeExperience, _Mapping]]] = ..., result: _Optional[_Union[_common_pb2.BatchResult, _Mapping]] = ...) -> None: ...

class CreateResumeSkillRequest(_message.Message):
    __slots__ = ("resume_id", "skill_name", "proficiency", "years")
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    SKILL_NAME_FIELD_NUMBER: _ClassVar[int]
    PROFICIENCY_FIELD_NUMBER: _ClassVar[int]
    YEARS_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    skill_name: str
    proficiency: SkillProficiency
    years: int
    def __init__(self, resume_id: _Optional[str] = ..., skill_name: _Optional[str] = ..., proficiency: _Optional[_Union[SkillProficiency, str]] = ..., years: _Optional[int] = ...) -> None: ...

class CreateResumeSkillResponse(_message.Message):
    __slots__ = ("skill",)
    SKILL_FIELD_NUMBER: _ClassVar[int]
    skill: ResumeSkill
    def __init__(self, skill: _Optional[_Union[ResumeSkill, _Mapping]] = ...) -> None: ...

class UpdateResumeSkillRequest(_message.Message):
    __slots__ = ("id", "skill_name", "proficiency", "years")
    ID_FIELD_NUMBER: _ClassVar[int]
    SKILL_NAME_FIELD_NUMBER: _ClassVar[int]
    PROFICIENCY_FIELD_NUMBER: _ClassVar[int]
    YEARS_FIELD_NUMBER: _ClassVar[int]
    id: str
    skill_name: str
    proficiency: SkillProficiency
    years: int
    def __init__(self, id: _Optional[str] = ..., skill_name: _Optional[str] = ..., proficiency: _Optional[_Union[SkillProficiency, str]] = ..., years: _Optional[int] = ...) -> None: ...

class UpdateResumeSkillResponse(_message.Message):
    __slots__ = ("skill",)
    SKILL_FIELD_NUMBER: _ClassVar[int]
    skill: ResumeSkill
    def __init__(self, skill: _Optional[_Union[ResumeSkill, _Mapping]] = ...) -> None: ...

class DeleteResumeSkillRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class DeleteResumeSkillResponse(_message.Message):
    __slots__ = ("success",)
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class ListResumeSkillsRequest(_message.Message):
    __slots__ = ("resume_id",)
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    def __init__(self, resume_id: _Optional[str] = ...) -> None: ...

class ListResumeSkillsResponse(_message.Message):
    __slots__ = ("skills",)
    SKILLS_FIELD_NUMBER: _ClassVar[int]
    skills: _containers.RepeatedCompositeFieldContainer[ResumeSkill]
    def __init__(self, skills: _Optional[_Iterable[_Union[ResumeSkill, _Mapping]]] = ...) -> None: ...

class BatchCreateResumeSkillsRequest(_message.Message):
    __slots__ = ("resume_id", "skills")
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    SKILLS_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    skills: _containers.RepeatedCompositeFieldContainer[CreateResumeSkillRequest]
    def __init__(self, resume_id: _Optional[str] = ..., skills: _Optional[_Iterable[_Union[CreateResumeSkillRequest, _Mapping]]] = ...) -> None: ...

class BatchCreateResumeSkillsResponse(_message.Message):
    __slots__ = ("skills", "result")
    SKILLS_FIELD_NUMBER: _ClassVar[int]
    RESULT_FIELD_NUMBER: _ClassVar[int]
    skills: _containers.RepeatedCompositeFieldContainer[ResumeSkill]
    result: _common_pb2.BatchResult
    def __init__(self, skills: _Optional[_Iterable[_Union[ResumeSkill, _Mapping]]] = ..., result: _Optional[_Union[_common_pb2.BatchResult, _Mapping]] = ...) -> None: ...

class CreateResumeEducationRequest(_message.Message):
    __slots__ = ("resume_id", "school_name", "degree", "major", "start_date", "end_date", "is_current")
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    SCHOOL_NAME_FIELD_NUMBER: _ClassVar[int]
    DEGREE_FIELD_NUMBER: _ClassVar[int]
    MAJOR_FIELD_NUMBER: _ClassVar[int]
    START_DATE_FIELD_NUMBER: _ClassVar[int]
    END_DATE_FIELD_NUMBER: _ClassVar[int]
    IS_CURRENT_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    school_name: str
    degree: DegreeType
    major: str
    start_date: _timestamp_pb2.Timestamp
    end_date: _timestamp_pb2.Timestamp
    is_current: bool
    def __init__(self, resume_id: _Optional[str] = ..., school_name: _Optional[str] = ..., degree: _Optional[_Union[DegreeType, str]] = ..., major: _Optional[str] = ..., start_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., end_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., is_current: bool = ...) -> None: ...

class CreateResumeEducationResponse(_message.Message):
    __slots__ = ("education",)
    EDUCATION_FIELD_NUMBER: _ClassVar[int]
    education: ResumeEducation
    def __init__(self, education: _Optional[_Union[ResumeEducation, _Mapping]] = ...) -> None: ...

class UpdateResumeEducationRequest(_message.Message):
    __slots__ = ("id", "school_name", "degree", "major", "start_date", "end_date", "is_current")
    ID_FIELD_NUMBER: _ClassVar[int]
    SCHOOL_NAME_FIELD_NUMBER: _ClassVar[int]
    DEGREE_FIELD_NUMBER: _ClassVar[int]
    MAJOR_FIELD_NUMBER: _ClassVar[int]
    START_DATE_FIELD_NUMBER: _ClassVar[int]
    END_DATE_FIELD_NUMBER: _ClassVar[int]
    IS_CURRENT_FIELD_NUMBER: _ClassVar[int]
    id: str
    school_name: str
    degree: DegreeType
    major: str
    start_date: _timestamp_pb2.Timestamp
    end_date: _timestamp_pb2.Timestamp
    is_current: bool
    def __init__(self, id: _Optional[str] = ..., school_name: _Optional[str] = ..., degree: _Optional[_Union[DegreeType, str]] = ..., major: _Optional[str] = ..., start_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., end_date: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., is_current: bool = ...) -> None: ...

class UpdateResumeEducationResponse(_message.Message):
    __slots__ = ("education",)
    EDUCATION_FIELD_NUMBER: _ClassVar[int]
    education: ResumeEducation
    def __init__(self, education: _Optional[_Union[ResumeEducation, _Mapping]] = ...) -> None: ...

class DeleteResumeEducationRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class DeleteResumeEducationResponse(_message.Message):
    __slots__ = ("success",)
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    success: bool
    def __init__(self, success: bool = ...) -> None: ...

class ListResumeEducationsRequest(_message.Message):
    __slots__ = ("resume_id",)
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    def __init__(self, resume_id: _Optional[str] = ...) -> None: ...

class ListResumeEducationsResponse(_message.Message):
    __slots__ = ("educations",)
    EDUCATIONS_FIELD_NUMBER: _ClassVar[int]
    educations: _containers.RepeatedCompositeFieldContainer[ResumeEducation]
    def __init__(self, educations: _Optional[_Iterable[_Union[ResumeEducation, _Mapping]]] = ...) -> None: ...

class BatchCreateResumeEducationsRequest(_message.Message):
    __slots__ = ("resume_id", "educations")
    RESUME_ID_FIELD_NUMBER: _ClassVar[int]
    EDUCATIONS_FIELD_NUMBER: _ClassVar[int]
    resume_id: str
    educations: _containers.RepeatedCompositeFieldContainer[CreateResumeEducationRequest]
    def __init__(self, resume_id: _Optional[str] = ..., educations: _Optional[_Iterable[_Union[CreateResumeEducationRequest, _Mapping]]] = ...) -> None: ...

class BatchCreateResumeEducationsResponse(_message.Message):
    __slots__ = ("educations", "result")
    EDUCATIONS_FIELD_NUMBER: _ClassVar[int]
    RESULT_FIELD_NUMBER: _ClassVar[int]
    educations: _containers.RepeatedCompositeFieldContainer[ResumeEducation]
    result: _common_pb2.BatchResult
    def __init__(self, educations: _Optional[_Iterable[_Union[ResumeEducation, _Mapping]]] = ..., result: _Optional[_Union[_common_pb2.BatchResult, _Mapping]] = ...) -> None: ...
