package model

import (
	"database/sql"
	"time"

	applyv1 "github.com/hirehub/proto/apply/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// Application represents a job application domain model
type Application struct {
	ID          string
	JobID       string
	UserID      string
	ResumeID    string
	CoverLetter sql.NullString
	Status      string
	MatchScore  sql.NullFloat64
	AppliedAt   time.Time
	UpdatedAt   time.Time

	// Related data (optionally loaded)
	JobTitle    sql.NullString
	CompanyName sql.NullString
	CompanyID   sql.NullString
	Interviews  []*Interview
	Events      []*ApplicationEvent
}

// ToProto converts domain model to protobuf message
func (a *Application) ToProto() *applyv1.Application {
	app := &applyv1.Application{
		Id:        a.ID,
		JobId:     a.JobID,
		UserId:    a.UserID,
		ResumeId:  a.ResumeID,
		Status:    StringToApplicationStatus(a.Status),
		AppliedAt: timestamppb.New(a.AppliedAt),
		UpdatedAt: timestamppb.New(a.UpdatedAt),
	}

	if a.CoverLetter.Valid {
		app.CoverLetter = a.CoverLetter.String
	}
	if a.MatchScore.Valid {
		app.MatchScore = a.MatchScore.Float64
	}
	if a.JobTitle.Valid {
		app.JobTitle = a.JobTitle.String
	}
	if a.CompanyName.Valid {
		app.CompanyName = a.CompanyName.String
	}
	if a.CompanyID.Valid {
		app.CompanyId = a.CompanyID.String
	}

	// Convert interviews
	if len(a.Interviews) > 0 {
		app.Interviews = make([]*applyv1.Interview, len(a.Interviews))
		for i, interview := range a.Interviews {
			app.Interviews[i] = interview.ToProto()
		}
	}

	// Convert events
	if len(a.Events) > 0 {
		app.Events = make([]*applyv1.ApplicationEvent, len(a.Events))
		for i, event := range a.Events {
			app.Events[i] = event.ToProto()
		}
	}

	return app
}

// ApplicationStatusToString converts protobuf enum to database string
func ApplicationStatusToString(status applyv1.ApplicationStatus) string {
	switch status {
	case applyv1.ApplicationStatus_APPLICATION_STATUS_SUBMITTED:
		return "submitted"
	case applyv1.ApplicationStatus_APPLICATION_STATUS_REVIEWING:
		return "reviewing"
	case applyv1.ApplicationStatus_APPLICATION_STATUS_SHORTLISTED:
		return "shortlisted"
	case applyv1.ApplicationStatus_APPLICATION_STATUS_INTERVIEW:
		return "interview"
	case applyv1.ApplicationStatus_APPLICATION_STATUS_OFFERED:
		return "offered"
	case applyv1.ApplicationStatus_APPLICATION_STATUS_REJECTED:
		return "rejected"
	case applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN:
		return "withdrawn"
	case applyv1.ApplicationStatus_APPLICATION_STATUS_HIRED:
		return "hired"
	default:
		return "submitted"
	}
}

// StringToApplicationStatus converts database string to protobuf enum
func StringToApplicationStatus(s string) applyv1.ApplicationStatus {
	switch s {
	case "submitted":
		return applyv1.ApplicationStatus_APPLICATION_STATUS_SUBMITTED
	case "reviewing":
		return applyv1.ApplicationStatus_APPLICATION_STATUS_REVIEWING
	case "shortlisted":
		return applyv1.ApplicationStatus_APPLICATION_STATUS_SHORTLISTED
	case "interview":
		return applyv1.ApplicationStatus_APPLICATION_STATUS_INTERVIEW
	case "offered":
		return applyv1.ApplicationStatus_APPLICATION_STATUS_OFFERED
	case "rejected":
		return applyv1.ApplicationStatus_APPLICATION_STATUS_REJECTED
	case "withdrawn":
		return applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN
	case "hired":
		return applyv1.ApplicationStatus_APPLICATION_STATUS_HIRED
	default:
		return applyv1.ApplicationStatus_APPLICATION_STATUS_UNSPECIFIED
	}
}
