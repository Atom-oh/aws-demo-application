package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	applyv1 "github.com/hirehub/proto/apply/v1"
	"github.com/hirehub/services/apply-service/internal/model"
)

// EventRepository handles database operations for application events
type EventRepository struct {
	db *pgxpool.Pool
}

// NewEventRepository creates a new EventRepository instance
func NewEventRepository(db *pgxpool.Pool) *EventRepository {
	return &EventRepository{db: db}
}

// Create creates a new application event
func (r *EventRepository) Create(ctx context.Context, applicationID string, eventType applyv1.EventType, fromStatus, toStatus *applyv1.ApplicationStatus, actorID *string, actorType *applyv1.ActorType, payload *string) (*model.ApplicationEvent, error) {
	query := `
		INSERT INTO application_events (application_id, event_type, from_status, to_status, actor_id, actor_type, payload)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, application_id, event_type, from_status, to_status, actor_id, actor_type, payload, created_at`

	var fromStatusStr, toStatusStr, actorTypeStr *string
	if fromStatus != nil {
		s := model.ApplicationStatusToString(*fromStatus)
		fromStatusStr = &s
	}
	if toStatus != nil {
		s := model.ApplicationStatusToString(*toStatus)
		toStatusStr = &s
	}
	if actorType != nil {
		s := model.ActorTypeToString(*actorType)
		actorTypeStr = &s
	}

	var event model.ApplicationEvent
	err := r.db.QueryRow(ctx, query,
		applicationID,
		model.EventTypeToString(eventType),
		fromStatusStr,
		toStatusStr,
		actorID,
		actorTypeStr,
		payload,
	).Scan(
		&event.ID, &event.ApplicationID, &event.EventType,
		&event.FromStatus, &event.ToStatus, &event.ActorID,
		&event.ActorType, &event.Payload, &event.CreatedAt,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create event: %v", err)
	}

	return &event, nil
}

// ListByApplicationID retrieves events for an application
func (r *EventRepository) ListByApplicationID(ctx context.Context, applicationID string, page, pageSize int32) ([]*model.ApplicationEvent, int64, error) {
	// Count total
	var total int64
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM application_events WHERE application_id = $1`, applicationID).Scan(&total)
	if err != nil {
		return nil, 0, status.Errorf(codes.Internal, "failed to count events: %v", err)
	}

	// Pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	query := fmt.Sprintf(`
		SELECT id, application_id, event_type, from_status, to_status, actor_id, actor_type, payload, created_at
		FROM application_events
		WHERE application_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3`)

	rows, err := r.db.Query(ctx, query, applicationID, pageSize, offset)
	if err != nil {
		return nil, 0, status.Errorf(codes.Internal, "failed to list events: %v", err)
	}
	defer rows.Close()

	var events []*model.ApplicationEvent
	for rows.Next() {
		var event model.ApplicationEvent
		if err := rows.Scan(
			&event.ID, &event.ApplicationID, &event.EventType,
			&event.FromStatus, &event.ToStatus, &event.ActorID,
			&event.ActorType, &event.Payload, &event.CreatedAt,
		); err != nil {
			return nil, 0, status.Errorf(codes.Internal, "failed to scan event: %v", err)
		}
		events = append(events, &event)
	}

	return events, total, nil
}

// GetLatestByApplicationID gets the most recent event for an application
func (r *EventRepository) GetLatestByApplicationID(ctx context.Context, applicationID string) (*model.ApplicationEvent, error) {
	query := `
		SELECT id, application_id, event_type, from_status, to_status, actor_id, actor_type, payload, created_at
		FROM application_events
		WHERE application_id = $1
		ORDER BY created_at DESC
		LIMIT 1`

	var event model.ApplicationEvent
	err := r.db.QueryRow(ctx, query, applicationID).Scan(
		&event.ID, &event.ApplicationID, &event.EventType,
		&event.FromStatus, &event.ToStatus, &event.ActorID,
		&event.ActorType, &event.Payload, &event.CreatedAt,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get latest event: %v", err)
	}

	return &event, nil
}
