package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	applyv1 "github.com/hirehub/proto/apply/v1"
	"github.com/hirehub/services/apply-service/internal/model"
)

// ApplicationRepository handles database operations for applications
type ApplicationRepository struct {
	db *pgxpool.Pool
}

// NewApplicationRepository creates a new ApplicationRepository instance
func NewApplicationRepository(db *pgxpool.Pool) *ApplicationRepository {
	return &ApplicationRepository{db: db}
}

// Create creates a new application
func (r *ApplicationRepository) Create(ctx context.Context, jobID, userID, resumeID string, coverLetter *string) (*model.Application, error) {
	query := `
		INSERT INTO applications (job_id, user_id, resume_id, cover_letter, status)
		VALUES ($1, $2, $3, $4, 'submitted')
		RETURNING id, job_id, user_id, resume_id, cover_letter, status, match_score, applied_at, updated_at`

	var app model.Application
	err := r.db.QueryRow(ctx, query, jobID, userID, resumeID, coverLetter).Scan(
		&app.ID, &app.JobID, &app.UserID, &app.ResumeID, &app.CoverLetter,
		&app.Status, &app.MatchScore, &app.AppliedAt, &app.UpdatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, status.Error(codes.AlreadyExists, "application already exists for this job and user")
		}
		return nil, status.Errorf(codes.Internal, "failed to create application: %v", err)
	}

	return &app, nil
}

// GetByID retrieves an application by ID
func (r *ApplicationRepository) GetByID(ctx context.Context, id string) (*model.Application, error) {
	query := `
		SELECT id, job_id, user_id, resume_id, cover_letter, status, match_score, applied_at, updated_at
		FROM applications WHERE id = $1`

	var app model.Application
	err := r.db.QueryRow(ctx, query, id).Scan(
		&app.ID, &app.JobID, &app.UserID, &app.ResumeID, &app.CoverLetter,
		&app.Status, &app.MatchScore, &app.AppliedAt, &app.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, status.Error(codes.NotFound, "application not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get application: %v", err)
	}

	return &app, nil
}

// Update updates an application
func (r *ApplicationRepository) Update(ctx context.Context, id string, coverLetter *string, statusVal *applyv1.ApplicationStatus, matchScore *float64, resumeID *string) (*model.Application, error) {
	var setClauses []string
	var args []interface{}
	argIdx := 1

	args = append(args, id)
	argIdx++

	if coverLetter != nil {
		setClauses = append(setClauses, fmt.Sprintf("cover_letter = $%d", argIdx))
		args = append(args, *coverLetter)
		argIdx++
	}
	if statusVal != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, model.ApplicationStatusToString(*statusVal))
		argIdx++
	}
	if matchScore != nil {
		setClauses = append(setClauses, fmt.Sprintf("match_score = $%d", argIdx))
		args = append(args, *matchScore)
		argIdx++
	}
	if resumeID != nil {
		setClauses = append(setClauses, fmt.Sprintf("resume_id = $%d", argIdx))
		args = append(args, *resumeID)
		argIdx++
	}

	if len(setClauses) == 0 {
		return r.GetByID(ctx, id)
	}

	setClauses = append(setClauses, "updated_at = CURRENT_TIMESTAMP")
	query := fmt.Sprintf(`
		UPDATE applications SET %s
		WHERE id = $1
		RETURNING id, job_id, user_id, resume_id, cover_letter, status, match_score, applied_at, updated_at`,
		strings.Join(setClauses, ", "))

	var app model.Application
	err := r.db.QueryRow(ctx, query, args...).Scan(
		&app.ID, &app.JobID, &app.UserID, &app.ResumeID, &app.CoverLetter,
		&app.Status, &app.MatchScore, &app.AppliedAt, &app.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, status.Error(codes.NotFound, "application not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update application: %v", err)
	}

	return &app, nil
}

// Delete deletes an application
func (r *ApplicationRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.Exec(ctx, `DELETE FROM applications WHERE id = $1`, id)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to delete application: %v", err)
	}
	if result.RowsAffected() == 0 {
		return status.Error(codes.NotFound, "application not found")
	}
	return nil
}

// ListFilter contains filter options for listing applications
type ListFilter struct {
	JobID          *string
	UserID         *string
	CompanyID      *string
	Status         *applyv1.ApplicationStatus
	Statuses       []applyv1.ApplicationStatus
	AppliedAfter   *string
	AppliedBefore  *string
	MinMatchScore  *int32
	MaxMatchScore  *int32
	SortField      string
	SortDesc       bool
	Page           int32
	PageSize       int32
}

// List retrieves applications with filtering and pagination
func (r *ApplicationRepository) List(ctx context.Context, filter ListFilter) ([]*model.Application, int64, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if filter.JobID != nil {
		conditions = append(conditions, fmt.Sprintf("job_id = $%d", argIdx))
		args = append(args, *filter.JobID)
		argIdx++
	}
	if filter.UserID != nil {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argIdx))
		args = append(args, *filter.UserID)
		argIdx++
	}
	if filter.Status != nil && *filter.Status != applyv1.ApplicationStatus_APPLICATION_STATUS_UNSPECIFIED {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, model.ApplicationStatusToString(*filter.Status))
		argIdx++
	}
	if len(filter.Statuses) > 0 {
		statusStrs := make([]string, len(filter.Statuses))
		for i, s := range filter.Statuses {
			statusStrs[i] = model.ApplicationStatusToString(s)
		}
		conditions = append(conditions, fmt.Sprintf("status = ANY($%d)", argIdx))
		args = append(args, statusStrs)
		argIdx++
	}
	if filter.MinMatchScore != nil {
		conditions = append(conditions, fmt.Sprintf("match_score >= $%d", argIdx))
		args = append(args, *filter.MinMatchScore)
		argIdx++
	}
	if filter.MaxMatchScore != nil {
		conditions = append(conditions, fmt.Sprintf("match_score <= $%d", argIdx))
		args = append(args, *filter.MaxMatchScore)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM applications %s", whereClause)
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, status.Errorf(codes.Internal, "failed to count applications: %v", err)
	}

	// Pagination
	page, pageSize := filter.Page, filter.PageSize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	// Sort
	sortField := "applied_at"
	if filter.SortField != "" {
		sortField = filter.SortField
	}
	sortDir := "DESC"
	if !filter.SortDesc {
		sortDir = "ASC"
	}

	query := fmt.Sprintf(`
		SELECT id, job_id, user_id, resume_id, cover_letter, status, match_score, applied_at, updated_at
		FROM applications %s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d`, whereClause, sortField, sortDir, argIdx, argIdx+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, status.Errorf(codes.Internal, "failed to list applications: %v", err)
	}
	defer rows.Close()

	var applications []*model.Application
	for rows.Next() {
		var app model.Application
		if err := rows.Scan(
			&app.ID, &app.JobID, &app.UserID, &app.ResumeID, &app.CoverLetter,
			&app.Status, &app.MatchScore, &app.AppliedAt, &app.UpdatedAt,
		); err != nil {
			return nil, 0, status.Errorf(codes.Internal, "failed to scan application: %v", err)
		}
		applications = append(applications, &app)
	}

	return applications, total, nil
}

// CheckDuplicate checks if an application exists for job and user
func (r *ApplicationRepository) CheckDuplicate(ctx context.Context, jobID, userID string) (bool, string, error) {
	var id string
	err := r.db.QueryRow(ctx, `SELECT id FROM applications WHERE job_id = $1 AND user_id = $2`, jobID, userID).Scan(&id)
	if err == pgx.ErrNoRows {
		return false, "", nil
	}
	if err != nil {
		return false, "", status.Errorf(codes.Internal, "failed to check duplicate: %v", err)
	}
	return true, id, nil
}

// UpdateStatus updates application status
func (r *ApplicationRepository) UpdateStatus(ctx context.Context, id string, newStatus applyv1.ApplicationStatus) (*model.Application, error) {
	query := `
		UPDATE applications SET status = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
		RETURNING id, job_id, user_id, resume_id, cover_letter, status, match_score, applied_at, updated_at`

	var app model.Application
	err := r.db.QueryRow(ctx, query, id, model.ApplicationStatusToString(newStatus)).Scan(
		&app.ID, &app.JobID, &app.UserID, &app.ResumeID, &app.CoverLetter,
		&app.Status, &app.MatchScore, &app.AppliedAt, &app.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, status.Error(codes.NotFound, "application not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update status: %v", err)
	}

	return &app, nil
}

// GetStats retrieves application statistics
func (r *ApplicationRepository) GetStats(ctx context.Context, jobID, companyID, userID *string) (map[string]int64, float64, int64, int64, int64, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if jobID != nil {
		conditions = append(conditions, fmt.Sprintf("job_id = $%d", argIdx))
		args = append(args, *jobID)
		argIdx++
	}
	if userID != nil {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", argIdx))
		args = append(args, *userID)
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Get status counts
	query := fmt.Sprintf(`SELECT status, COUNT(*) FROM applications %s GROUP BY status`, whereClause)
	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, 0, 0, 0, status.Errorf(codes.Internal, "failed to get stats: %v", err)
	}
	defer rows.Close()

	byStatus := make(map[string]int64)
	for rows.Next() {
		var statusStr string
		var count int64
		if err := rows.Scan(&statusStr, &count); err != nil {
			return nil, 0, 0, 0, 0, err
		}
		byStatus[statusStr] = count
	}

	// Get average match score
	var avgScore sql.NullFloat64
	avgQuery := fmt.Sprintf(`SELECT AVG(match_score) FROM applications %s WHERE match_score IS NOT NULL`, whereClause)
	r.db.QueryRow(ctx, avgQuery, args...).Scan(&avgScore)

	avgScoreVal := 0.0
	if avgScore.Valid {
		avgScoreVal = avgScore.Float64
	}

	return byStatus, avgScoreVal, byStatus["offered"], byStatus["hired"], 0, nil
}

func isUniqueViolation(err error) bool {
	return strings.Contains(err.Error(), "23505") || strings.Contains(err.Error(), "unique constraint")
}
