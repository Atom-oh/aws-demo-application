import datetime

from google.protobuf import timestamp_pb2 as _timestamp_pb2
from google.protobuf.internal import containers as _containers
from google.protobuf.internal import enum_type_wrapper as _enum_type_wrapper
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class SortDirection(int, metaclass=_enum_type_wrapper.EnumTypeWrapper):
    __slots__ = ()
    SORT_DIRECTION_UNSPECIFIED: _ClassVar[SortDirection]
    SORT_DIRECTION_ASC: _ClassVar[SortDirection]
    SORT_DIRECTION_DESC: _ClassVar[SortDirection]
SORT_DIRECTION_UNSPECIFIED: SortDirection
SORT_DIRECTION_ASC: SortDirection
SORT_DIRECTION_DESC: SortDirection

class Empty(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class PaginationRequest(_message.Message):
    __slots__ = ("page", "page_size")
    PAGE_FIELD_NUMBER: _ClassVar[int]
    PAGE_SIZE_FIELD_NUMBER: _ClassVar[int]
    page: int
    page_size: int
    def __init__(self, page: _Optional[int] = ..., page_size: _Optional[int] = ...) -> None: ...

class PaginationResponse(_message.Message):
    __slots__ = ("page", "page_size", "total", "total_pages")
    PAGE_FIELD_NUMBER: _ClassVar[int]
    PAGE_SIZE_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    TOTAL_PAGES_FIELD_NUMBER: _ClassVar[int]
    page: int
    page_size: int
    total: int
    total_pages: int
    def __init__(self, page: _Optional[int] = ..., page_size: _Optional[int] = ..., total: _Optional[int] = ..., total_pages: _Optional[int] = ...) -> None: ...

class SortOrder(_message.Message):
    __slots__ = ("field", "direction")
    FIELD_FIELD_NUMBER: _ClassVar[int]
    DIRECTION_FIELD_NUMBER: _ClassVar[int]
    field: str
    direction: SortDirection
    def __init__(self, field: _Optional[str] = ..., direction: _Optional[_Union[SortDirection, str]] = ...) -> None: ...

class DateRange(_message.Message):
    __slots__ = ("start", "end")
    START_FIELD_NUMBER: _ClassVar[int]
    END_FIELD_NUMBER: _ClassVar[int]
    start: _timestamp_pb2.Timestamp
    end: _timestamp_pb2.Timestamp
    def __init__(self, start: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ..., end: _Optional[_Union[datetime.datetime, _timestamp_pb2.Timestamp, _Mapping]] = ...) -> None: ...

class IntRange(_message.Message):
    __slots__ = ("min", "max")
    MIN_FIELD_NUMBER: _ClassVar[int]
    MAX_FIELD_NUMBER: _ClassVar[int]
    min: int
    max: int
    def __init__(self, min: _Optional[int] = ..., max: _Optional[int] = ...) -> None: ...

class ResponseStatus(_message.Message):
    __slots__ = ("success", "message", "error_code")
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    MESSAGE_FIELD_NUMBER: _ClassVar[int]
    ERROR_CODE_FIELD_NUMBER: _ClassVar[int]
    success: bool
    message: str
    error_code: str
    def __init__(self, success: bool = ..., message: _Optional[str] = ..., error_code: _Optional[str] = ...) -> None: ...

class ResourceId(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class BatchResult(_message.Message):
    __slots__ = ("total", "succeeded", "failed", "failed_ids", "error_messages")
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    SUCCEEDED_FIELD_NUMBER: _ClassVar[int]
    FAILED_FIELD_NUMBER: _ClassVar[int]
    FAILED_IDS_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGES_FIELD_NUMBER: _ClassVar[int]
    total: int
    succeeded: int
    failed: int
    failed_ids: _containers.RepeatedScalarFieldContainer[str]
    error_messages: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, total: _Optional[int] = ..., succeeded: _Optional[int] = ..., failed: _Optional[int] = ..., failed_ids: _Optional[_Iterable[str]] = ..., error_messages: _Optional[_Iterable[str]] = ...) -> None: ...
