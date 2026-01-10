package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	applyv1 "github.com/hirehub/proto/apply/v1"
	"github.com/hirehub/services/apply-service/internal/model"
)

// InterviewRepository handles database operations for interviews
type InterviewRepository struct {
	db *pgxpool.Pool
}

// NewInterviewRepository creates a new InterviewRepository instance
func NewInterviewRepository(db *pgxpool.Pool) *InterviewRepository {
	return &InterviewRepository{db: db}
}

// Create creates a new interview
func (r *InterviewRepository) Create(ctx context.Context, req *applyv1.CreateInterviewRequest) (*model.Interview, error) {
	query := `
		INSERT INTO interviews (application_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, interviewer_id, interviewer_name, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled')
		RETURNING id, application_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, status, feedback, interviewer_id, interviewer_name, created_at, updated_at`

	var scheduledAt interface{}
	if req.ScheduledAt != nil {
		scheduledAt = req.ScheduledAt.AsTime()
	}

	var interview model.Interview
	err := r.db.QueryRow(ctx, query,
		req.ApplicationId,
		model.InterviewTypeToString(req.InterviewType),
		scheduledAt,
		req.DurationMinutes,
		nullString(req.Location),
		nullString(req.MeetingUrl),
		nullString(req.InterviewerId),
		nullString(req.InterviewerName),
	).Scan(
		&interview.ID, &interview.ApplicationID, &interview.InterviewType,
		&interview.ScheduledAt, &interview.DurationMinutes, &interview.Location,
		&interview.MeetingURL, &interview.Status, &interview.Feedback,
		&interview.InterviewerID, &interview.InterviewerName,
		&interview.CreatedAt, &interview.UpdatedAt,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create interview: %v", err)
	}

	return &interview, nil
}

// GetByID retrieves an interview by ID
func (r *InterviewRepository) GetByID(ctx context.Context, id string) (*model.Interview, error) {
	query := `
		SELECT id, application_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, status, feedback, interviewer_id, interviewer_name, created_at, updated_at
		FROM interviews WHERE id = $1`

	var interview model.Interview
	err := r.db.QueryRow(ctx, query, id).Scan(
		&interview.ID, &interview.ApplicationID, &interview.InterviewType,
		&interview.ScheduledAt, &interview.DurationMinutes, &interview.Location,
		&interview.MeetingURL, &interview.Status, &interview.Feedback,
		&interview.InterviewerID, &interview.InterviewerName,
		&interview.CreatedAt, &interview.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, status.Error(codes.NotFound, "interview not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get interview: %v", err)
	}

	return &interview, nil
}

// Update updates an interview
func (r *InterviewRepository) Update(ctx context.Context, req *applyv1.UpdateInterviewRequest) (*model.Interview, error) {
	var setClauses []string
	var args []interface{}
	argIdx := 2

	args = append(args, req.Id)

	if req.InterviewType != nil {
		setClauses = append(setClauses, fmt.Sprintf("interview_type = $%d", argIdx))
		args = append(args, model.InterviewTypeToString(*req.InterviewType))
		argIdx++
	}
	if req.ScheduledAt != nil {
		setClauses = append(setClauses, fmt.Sprintf("scheduled_at = $%d", argIdx))
		args = append(args, req.ScheduledAt.AsTime())
		argIdx++
	}
	if req.DurationMinutes != nil {
		setClauses = append(setClauses, fmt.Sprintf("duration_minutes = $%d", argIdx))
		args = append(args, *req.DurationMinutes)
		argIdx++
	}
	if req.Location != nil {
		setClauses = append(setClauses, fmt.Sprintf("location = $%d", argIdx))
		args = append(args, *req.Location)
		argIdx++
	}
	if req.MeetingUrl != nil {
		setClauses = append(setClauses, fmt.Sprintf("meeting_url = $%d", argIdx))
		args = append(args, *req.MeetingUrl)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, model.InterviewStatusToString(*req.Status))
		argIdx++
	}
	if req.Feedback != nil {
		setClauses = append(setClauses, fmt.Sprintf("feedback = $%d", argIdx))
		args = append(args, *req.Feedback)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, req.Id)
	}

	setClauses = append(setClauses, "updated_at = CURRENT_TIMESTAMP")
	query := fmt.Sprintf(`
		UPDATE interviews SET %s WHERE id = $1
		RETURNING id, application_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, status, feedback, interviewer_id, interviewer_name, created_at, updated_at`,
		strings.Join(setClauses, ", "))

	var interview model.Interview
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&interview.ID, &interview.ApplicationID, &interview.InterviewType,
		&interview.ScheduledAt, &interview.DurationMinutes, &interview.Location,
		&interview.MeetingURL, &interview.Status, &interview.Feedback,
		&interview.InterviewerID, &interview.InterviewerName,
		&interview.CreatedAt, &interview.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, status.Error(codes.NotFound, "interview not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update interview: %v", err)
	}

	return &interview, nil
}

// Delete deletes an interview
func (r *InterviewRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.Exec(ctx, `DELETE FROM interviews WHERE id = $1`, id)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to delete interview: %v", err)
	}
	if result.RowsAffected() == 0 {
		return status.Error(codes.NotFound, "interview not found")
	}
	return nil
}

// ListByApplicationID retrieves interviews for an application
func (r *InterviewRepository) ListByApplicationID(ctx context.Context, applicationID string) ([]*model.Interview, error) {
	query := `
		SELECT id, application_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, status, feedback, interviewer_id, interviewer_name, created_at, updated_at
		FROM interviews WHERE application_id = $1 ORDER BY scheduled_at ASC`

	rows, err := r.db.Query(ctx, query, applicationID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list interviews: %v", err)
	}
	defer rows.Close()

	var interviews []*model.Interview
	for rows.Next() {
		var interview model.Interview
		if err := rows.Scan(
			&interview.ID, &interview.ApplicationID, &interview.InterviewType,
			&interview.ScheduledAt, &interview.DurationMinutes, &interview.Location,
			&interview.MeetingURL, &interview.Status, &interview.Feedback,
			&interview.InterviewerID, &interview.InterviewerName,
			&interview.CreatedAt, &interview.UpdatedAt,
		); err != nil {
			return nil, status.Errorf(codes.Internal, "failed to scan interview: %v", err)
		}
		interviews = append(interviews, &interview)
	}

	return interviews, nil
}

// List retrieves interviews with filtering
func (r *InterviewRepository) List(ctx context.Context, applicationID *string, statusFilter *applyv1.InterviewStatus, interviewType *applyv1.InterviewType, page, pageSize int32) ([]*model.Interview, int64, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if applicationID != nil {
		conditions = append(conditions, fmt.Sprintf("application_id = $%d", argIdx))
		args = append(args, *applicationID)
		argIdx++
	}
	if statusFilter != nil && *statusFilter != applyv1.InterviewStatus_INTERVIEW_STATUS_UNSPECIFIED {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, model.InterviewStatusToString(*statusFilter))
		argIdx++
	}
	if interviewType != nil && *interviewType != applyv1.InterviewType_INTERVIEW_TYPE_UNSPECIFIED {
		conditions = append(conditions, fmt.Sprintf("interview_type = $%d", argIdx))
		args = append(args, model.InterviewTypeToString(*interviewType))
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM interviews %s", whereClause)
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, status.Errorf(codes.Internal, "failed to count interviews: %v", err)
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	query := fmt.Sprintf(`
		SELECT id, application_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, status, feedback, interviewer_id, interviewer_name, created_at, updated_at
		FROM interviews %s ORDER BY scheduled_at DESC LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, status.Errorf(codes.Internal, "failed to list interviews: %v", err)
	}
	defer rows.Close()

	var interviews []*model.Interview
	for rows.Next() {
		var interview model.Interview
		if err := rows.Scan(
			&interview.ID, &interview.ApplicationID, &interview.InterviewType,
			&interview.ScheduledAt, &interview.DurationMinutes, &interview.Location,
			&interview.MeetingURL, &interview.Status, &interview.Feedback,
			&interview.InterviewerID, &interview.InterviewerName,
			&interview.CreatedAt, &interview.UpdatedAt,
		); err != nil {
			return nil, 0, status.Errorf(codes.Internal, "failed to scan interview: %v", err)
		}
		interviews = append(interviews, &interview)
	}

	return interviews, total, nil
}

// UpdateStatus updates interview status
func (r *InterviewRepository) UpdateStatus(ctx context.Context, id string, newStatus applyv1.InterviewStatus) (*model.Interview, error) {
	query := `
		UPDATE interviews SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1
		RETURNING id, application_id, interview_type, scheduled_at, duration_minutes, location, meeting_url, status, feedback, interviewer_id, interviewer_name, created_at, updated_at`

	var interview model.Interview
	err := r.db.QueryRow(ctx, query, id, model.InterviewStatusToString(newStatus)).Scan(
		&interview.ID, &interview.ApplicationID, &interview.InterviewType,
		&interview.ScheduledAt, &interview.DurationMinutes, &interview.Location,
		&interview.MeetingURL, &interview.Status, &interview.Feedback,
		&interview.InterviewerID, &interview.InterviewerName,
		&interview.CreatedAt, &interview.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, status.Error(codes.NotFound, "interview not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	return &interview, nil
}

func nullString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
