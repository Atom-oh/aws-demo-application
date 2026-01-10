package model

import (
	"database/sql"
	"time"

	applyv1 "github.com/hirehub/proto/apply/v1"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// ApplicationEvent represents an event in the application lifecycle (event sourcing)
type ApplicationEvent struct {
	ID            string
	ApplicationID string
	EventType     string
	FromStatus    sql.NullString
	ToStatus      sql.NullString
	ActorID       sql.NullString
	ActorType     sql.NullString
	Payload       sql.NullString
	CreatedAt     time.Time
}

// ToProto converts domain model to protobuf message
func (e *ApplicationEvent) ToProto() *applyv1.ApplicationEvent {
	event := &applyv1.ApplicationEvent{
		Id:            e.ID,
		ApplicationId: e.ApplicationID,
		EventType:     StringToEventType(e.EventType),
		CreatedAt:     timestamppb.New(e.CreatedAt),
	}

	if e.FromStatus.Valid {
		event.FromStatus = StringToApplicationStatus(e.FromStatus.String)
	}
	if e.ToStatus.Valid {
		event.ToStatus = StringToApplicationStatus(e.ToStatus.String)
	}
	if e.ActorID.Valid {
		event.ActorId = e.ActorID.String
	}
	if e.ActorType.Valid {
		event.ActorType = StringToActorType(e.ActorType.String)
	}
	if e.Payload.Valid {
		event.Payload = e.Payload.String
	}

	return event
}

// EventTypeToString converts protobuf enum to database string
func EventTypeToString(eventType applyv1.EventType) string {
	switch eventType {
	case applyv1.EventType_EVENT_TYPE_SUBMITTED:
		return "submitted"
	case applyv1.EventType_EVENT_TYPE_STATUS_CHANGED:
		return "status_changed"
	case applyv1.EventType_EVENT_TYPE_INTERVIEW_SCHEDULED:
		return "interview_scheduled"
	case applyv1.EventType_EVENT_TYPE_INTERVIEW_COMPLETED:
		return "interview_completed"
	case applyv1.EventType_EVENT_TYPE_INTERVIEW_CANCELLED:
		return "interview_cancelled"
	case applyv1.EventType_EVENT_TYPE_FEEDBACK_ADDED:
		return "feedback_added"
	case applyv1.EventType_EVENT_TYPE_OFFER_MADE:
		return "offer_made"
	case applyv1.EventType_EVENT_TYPE_OFFER_ACCEPTED:
		return "offer_accepted"
	case applyv1.EventType_EVENT_TYPE_OFFER_REJECTED:
		return "offer_rejected"
	case applyv1.EventType_EVENT_TYPE_WITHDRAWN:
		return "withdrawn"
	default:
		return "unspecified"
	}
}

// StringToEventType converts database string to protobuf enum
func StringToEventType(s string) applyv1.EventType {
	switch s {
	case "submitted":
		return applyv1.EventType_EVENT_TYPE_SUBMITTED
	case "status_changed":
		return applyv1.EventType_EVENT_TYPE_STATUS_CHANGED
	case "interview_scheduled":
		return applyv1.EventType_EVENT_TYPE_INTERVIEW_SCHEDULED
	case "interview_completed":
		return applyv1.EventType_EVENT_TYPE_INTERVIEW_COMPLETED
	case "interview_cancelled":
		return applyv1.EventType_EVENT_TYPE_INTERVIEW_CANCELLED
	case "feedback_added":
		return applyv1.EventType_EVENT_TYPE_FEEDBACK_ADDED
	case "offer_made":
		return applyv1.EventType_EVENT_TYPE_OFFER_MADE
	case "offer_accepted":
		return applyv1.EventType_EVENT_TYPE_OFFER_ACCEPTED
	case "offer_rejected":
		return applyv1.EventType_EVENT_TYPE_OFFER_REJECTED
	case "withdrawn":
		return applyv1.EventType_EVENT_TYPE_WITHDRAWN
	default:
		return applyv1.EventType_EVENT_TYPE_UNSPECIFIED
	}
}

// ActorTypeToString converts protobuf enum to database string
func ActorTypeToString(actorType applyv1.ActorType) string {
	switch actorType {
	case applyv1.ActorType_ACTOR_TYPE_SYSTEM:
		return "system"
	case applyv1.ActorType_ACTOR_TYPE_JOBSEEKER:
		return "jobseeker"
	case applyv1.ActorType_ACTOR_TYPE_COMPANY:
		return "company"
	case applyv1.ActorType_ACTOR_TYPE_ADMIN:
		return "admin"
	default:
		return "unspecified"
	}
}

// StringToActorType converts database string to protobuf enum
func StringToActorType(s string) applyv1.ActorType {
	switch s {
	case "system":
		return applyv1.ActorType_ACTOR_TYPE_SYSTEM
	case "jobseeker":
		return applyv1.ActorType_ACTOR_TYPE_JOBSEEKER
	case "company":
		return applyv1.ActorType_ACTOR_TYPE_COMPANY
	case "admin":
		return applyv1.ActorType_ACTOR_TYPE_ADMIN
	default:
		return applyv1.ActorType_ACTOR_TYPE_UNSPECIFIED
	}
}
