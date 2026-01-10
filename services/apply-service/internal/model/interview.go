package model

import (
	"database/sql"
	"time"

	applyv1 "github.com/hirehub/proto/apply/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// Interview represents an interview scheduled for an application
type Interview struct {
	ID              string
	ApplicationID   string
	InterviewType   string
	ScheduledAt     sql.NullTime
	DurationMinutes sql.NullInt32
	Location        sql.NullString
	MeetingURL      sql.NullString
	Status          string
	Feedback        sql.NullString
	InterviewerID   sql.NullString
	InterviewerName sql.NullString
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// ToProto converts domain model to protobuf message
func (i *Interview) ToProto() *applyv1.Interview {
	interview := &applyv1.Interview{
		Id:            i.ID,
		ApplicationId: i.ApplicationID,
		InterviewType: StringToInterviewType(i.InterviewType),
		Status:        StringToInterviewStatus(i.Status),
		CreatedAt:     timestamppb.New(i.CreatedAt),
		UpdatedAt:     timestamppb.New(i.UpdatedAt),
	}

	if i.ScheduledAt.Valid {
		interview.ScheduledAt = timestamppb.New(i.ScheduledAt.Time)
	}
	if i.DurationMinutes.Valid {
		interview.DurationMinutes = i.DurationMinutes.Int32
	}
	if i.Location.Valid {
		interview.Location = i.Location.String
	}
	if i.MeetingURL.Valid {
		interview.MeetingUrl = i.MeetingURL.String
	}
	if i.Feedback.Valid {
		interview.Feedback = i.Feedback.String
	}
	if i.InterviewerID.Valid {
		interview.InterviewerId = i.InterviewerID.String
	}
	if i.InterviewerName.Valid {
		interview.InterviewerName = i.InterviewerName.String
	}

	return interview
}

// InterviewTypeToString converts protobuf enum to database string
func InterviewTypeToString(interviewType applyv1.InterviewType) string {
	switch interviewType {
	case applyv1.InterviewType_INTERVIEW_TYPE_PHONE:
		return "phone"
	case applyv1.InterviewType_INTERVIEW_TYPE_VIDEO:
		return "video"
	case applyv1.InterviewType_INTERVIEW_TYPE_ONSITE:
		return "onsite"
	case applyv1.InterviewType_INTERVIEW_TYPE_TECHNICAL:
		return "technical"
	case applyv1.InterviewType_INTERVIEW_TYPE_HR:
		return "hr"
	case applyv1.InterviewType_INTERVIEW_TYPE_FINAL:
		return "final"
	default:
		return "unspecified"
	}
}

// StringToInterviewType converts database string to protobuf enum
func StringToInterviewType(s string) applyv1.InterviewType {
	switch s {
	case "phone":
		return applyv1.InterviewType_INTERVIEW_TYPE_PHONE
	case "video":
		return applyv1.InterviewType_INTERVIEW_TYPE_VIDEO
	case "onsite":
		return applyv1.InterviewType_INTERVIEW_TYPE_ONSITE
	case "technical":
		return applyv1.InterviewType_INTERVIEW_TYPE_TECHNICAL
	case "hr":
		return applyv1.InterviewType_INTERVIEW_TYPE_HR
	case "final":
		return applyv1.InterviewType_INTERVIEW_TYPE_FINAL
	default:
		return applyv1.InterviewType_INTERVIEW_TYPE_UNSPECIFIED
	}
}

// InterviewStatusToString converts protobuf enum to database string
func InterviewStatusToString(status applyv1.InterviewStatus) string {
	switch status {
	case applyv1.InterviewStatus_INTERVIEW_STATUS_SCHEDULED:
		return "scheduled"
	case applyv1.InterviewStatus_INTERVIEW_STATUS_CONFIRMED:
		return "confirmed"
	case applyv1.InterviewStatus_INTERVIEW_STATUS_COMPLETED:
		return "completed"
	case applyv1.InterviewStatus_INTERVIEW_STATUS_CANCELLED:
		return "cancelled"
	case applyv1.InterviewStatus_INTERVIEW_STATUS_NO_SHOW:
		return "no_show"
	case applyv1.InterviewStatus_INTERVIEW_STATUS_RESCHEDULED:
		return "rescheduled"
	default:
		return "scheduled"
	}
}

// StringToInterviewStatus converts database string to protobuf enum
func StringToInterviewStatus(s string) applyv1.InterviewStatus {
	switch s {
	case "scheduled":
		return applyv1.InterviewStatus_INTERVIEW_STATUS_SCHEDULED
	case "confirmed":
		return applyv1.InterviewStatus_INTERVIEW_STATUS_CONFIRMED
	case "completed":
		return applyv1.InterviewStatus_INTERVIEW_STATUS_COMPLETED
	case "cancelled":
		return applyv1.InterviewStatus_INTERVIEW_STATUS_CANCELLED
	case "no_show":
		return applyv1.InterviewStatus_INTERVIEW_STATUS_NO_SHOW
	case "rescheduled":
		return applyv1.InterviewStatus_INTERVIEW_STATUS_RESCHEDULED
	default:
		return applyv1.InterviewStatus_INTERVIEW_STATUS_UNSPECIFIED
	}
}
