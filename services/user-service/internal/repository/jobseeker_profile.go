package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/lib/pq"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	commonv1 "github.com/hirehub/proto/common/v1"
	userv1 "github.com/hirehub/proto/user/v1"
)

type JobseekerProfileRepository struct {
	db *sql.DB
}

func NewJobseekerProfileRepository(db *sql.DB) *JobseekerProfileRepository {
	return &JobseekerProfileRepository{db: db}
}

func (r *JobseekerProfileRepository) Create(ctx context.Context, req *userv1.CreateJobseekerProfileRequest) (*userv1.JobseekerProfile, error) {
	query := `INSERT INTO jobseeker_profiles (user_id, name, phone, experience_years, desired_position, desired_salary_min, desired_salary_max, skills)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, user_id, name, phone, experience_years, desired_position, desired_salary_min, desired_salary_max, skills, created_at, updated_at`

	var profile userv1.JobseekerProfile
	var name, phone, desiredPosition sql.NullString
	var experienceYears, desiredSalaryMin, desiredSalaryMax sql.NullInt64
	var skills []string
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query,
		req.UserId, nullString(req.Name), nullString(req.Phone), nullInt32(req.ExperienceYears),
		nullString(req.DesiredPosition), nullInt64(req.DesiredSalaryMin), nullInt64(req.DesiredSalaryMax), pq.Array(req.Skills),
	).Scan(&profile.Id, &profile.UserId, &name, &phone, &experienceYears, &desiredPosition,
		&desiredSalaryMin, &desiredSalaryMax, pq.Array(&skills), &createdAt, &updatedAt)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create profile: %v", err)
	}

	profile.Name = name.String
	profile.Phone = phone.String
	profile.ExperienceYears = int32(experienceYears.Int64)
	profile.DesiredPosition = desiredPosition.String
	profile.DesiredSalaryMin = desiredSalaryMin.Int64
	profile.DesiredSalaryMax = desiredSalaryMax.Int64
	profile.Skills = skills
	profile.CreatedAt = timestamppb.New(createdAt)
	profile.UpdatedAt = timestamppb.New(updatedAt)
	return &profile, nil
}

func (r *JobseekerProfileRepository) GetByID(ctx context.Context, id string) (*userv1.JobseekerProfile, error) {
	return r.getByField(ctx, "id", id)
}

func (r *JobseekerProfileRepository) GetByUserID(ctx context.Context, userID string) (*userv1.JobseekerProfile, error) {
	return r.getByField(ctx, "user_id", userID)
}

func (r *JobseekerProfileRepository) getByField(ctx context.Context, field, value string) (*userv1.JobseekerProfile, error) {
	query := fmt.Sprintf(`SELECT id, user_id, name, phone, experience_years, desired_position, desired_salary_min, desired_salary_max, skills, created_at, updated_at
		FROM jobseeker_profiles WHERE %s = $1`, field)

	var profile userv1.JobseekerProfile
	var name, phone, desiredPosition sql.NullString
	var experienceYears, desiredSalaryMin, desiredSalaryMax sql.NullInt64
	var skills []string
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, value).Scan(
		&profile.Id, &profile.UserId, &name, &phone, &experienceYears, &desiredPosition,
		&desiredSalaryMin, &desiredSalaryMax, pq.Array(&skills), &createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "profile not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get profile: %v", err)
	}

	profile.Name = name.String
	profile.Phone = phone.String
	profile.ExperienceYears = int32(experienceYears.Int64)
	profile.DesiredPosition = desiredPosition.String
	profile.DesiredSalaryMin = desiredSalaryMin.Int64
	profile.DesiredSalaryMax = desiredSalaryMax.Int64
	profile.Skills = skills
	profile.CreatedAt = timestamppb.New(createdAt)
	profile.UpdatedAt = timestamppb.New(updatedAt)
	return &profile, nil
}

func (r *JobseekerProfileRepository) Update(ctx context.Context, req *userv1.UpdateJobseekerProfileRequest) (*userv1.JobseekerProfile, error) {
	query := `UPDATE jobseeker_profiles SET
		name = COALESCE($2, name), phone = COALESCE($3, phone), experience_years = COALESCE($4, experience_years),
		desired_position = COALESCE($5, desired_position), desired_salary_min = COALESCE($6, desired_salary_min),
		desired_salary_max = COALESCE($7, desired_salary_max), skills = CASE WHEN $9 THEN $8 ELSE COALESCE($8, skills) END,
		updated_at = CURRENT_TIMESTAMP WHERE id = $1
		RETURNING id, user_id, name, phone, experience_years, desired_position, desired_salary_min, desired_salary_max, skills, created_at, updated_at`

	var skillsArg interface{}
	if len(req.Skills) > 0 || req.ClearSkills {
		skillsArg = pq.Array(req.Skills)
	}

	var profile userv1.JobseekerProfile
	var name, phone, desiredPosition sql.NullString
	var experienceYears, desiredSalaryMin, desiredSalaryMax sql.NullInt64
	var skills []string
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query,
		req.Id, nullStringPtr(req.Name), nullStringPtr(req.Phone), nullInt32Ptr(req.ExperienceYears),
		nullStringPtr(req.DesiredPosition), nullInt64Ptr(req.DesiredSalaryMin), nullInt64Ptr(req.DesiredSalaryMax),
		skillsArg, req.ClearSkills,
	).Scan(&profile.Id, &profile.UserId, &name, &phone, &experienceYears, &desiredPosition,
		&desiredSalaryMin, &desiredSalaryMax, pq.Array(&skills), &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "profile not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update profile: %v", err)
	}

	profile.Name = name.String
	profile.Phone = phone.String
	profile.ExperienceYears = int32(experienceYears.Int64)
	profile.DesiredPosition = desiredPosition.String
	profile.DesiredSalaryMin = desiredSalaryMin.Int64
	profile.DesiredSalaryMax = desiredSalaryMax.Int64
	profile.Skills = skills
	profile.CreatedAt = timestamppb.New(createdAt)
	profile.UpdatedAt = timestamppb.New(updatedAt)
	return &profile, nil
}

func (r *JobseekerProfileRepository) List(ctx context.Context, req *userv1.ListJobseekerProfilesRequest) (*userv1.ListJobseekerProfilesResponse, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if len(req.Skills) > 0 {
		conditions = append(conditions, fmt.Sprintf("skills && $%d", argIdx))
		args = append(args, pq.Array(req.Skills))
		argIdx++
	}
	if req.ExperienceYears != nil {
		conditions = append(conditions, fmt.Sprintf("experience_years BETWEEN $%d AND $%d", argIdx, argIdx+1))
		args = append(args, req.ExperienceYears.Min, req.ExperienceYears.Max)
		argIdx += 2
	}
	if req.DesiredPosition != nil {
		conditions = append(conditions, fmt.Sprintf("desired_position ILIKE $%d", argIdx))
		args = append(args, "%"+*req.DesiredPosition+"%")
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	var total int64
	if err := r.db.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM jobseeker_profiles %s", whereClause), args...).Scan(&total); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to count profiles: %v", err)
	}

	page, pageSize := int32(1), int32(20)
	if req.Pagination != nil {
		if req.Pagination.Page > 0 {
			page = req.Pagination.Page
		}
		if req.Pagination.PageSize > 0 {
			pageSize = req.Pagination.PageSize
		}
	}
	offset := (page - 1) * pageSize
	totalPages := int32((total + int64(pageSize) - 1) / int64(pageSize))

	query := fmt.Sprintf(`SELECT id, user_id, name, phone, experience_years, desired_position, desired_salary_min, desired_salary_max, skills, created_at, updated_at
		FROM jobseeker_profiles %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list profiles: %v", err)
	}
	defer rows.Close()

	var profiles []*userv1.JobseekerProfile
	for rows.Next() {
		var profile userv1.JobseekerProfile
		var name, phone, desiredPosition sql.NullString
		var experienceYears, desiredSalaryMin, desiredSalaryMax sql.NullInt64
		var skills []string
		var createdAt, updatedAt time.Time

		if err := rows.Scan(&profile.Id, &profile.UserId, &name, &phone, &experienceYears, &desiredPosition,
			&desiredSalaryMin, &desiredSalaryMax, pq.Array(&skills), &createdAt, &updatedAt); err != nil {
			return nil, status.Errorf(codes.Internal, "failed to scan profile: %v", err)
		}
		profile.Name = name.String
		profile.Phone = phone.String
		profile.ExperienceYears = int32(experienceYears.Int64)
		profile.DesiredPosition = desiredPosition.String
		profile.DesiredSalaryMin = desiredSalaryMin.Int64
		profile.DesiredSalaryMax = desiredSalaryMax.Int64
		profile.Skills = skills
		profile.CreatedAt = timestamppb.New(createdAt)
		profile.UpdatedAt = timestamppb.New(updatedAt)
		profiles = append(profiles, &profile)
	}

	return &userv1.ListJobseekerProfilesResponse{
		Profiles:   profiles,
		Pagination: &commonv1.PaginationResponse{Page: page, PageSize: pageSize, Total: total, TotalPages: totalPages},
	}, nil
}

// Helper functions
func nullString(s string) sql.NullString {
	return sql.NullString{String: s, Valid: s != ""}
}

func nullInt32(i int32) sql.NullInt64 {
	return sql.NullInt64{Int64: int64(i), Valid: i != 0}
}

func nullInt64(i int64) sql.NullInt64 {
	return sql.NullInt64{Int64: i, Valid: i != 0}
}

func nullStringPtr(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *s, Valid: true}
}

func nullInt32Ptr(i *int32) sql.NullInt64 {
	if i == nil {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: int64(*i), Valid: true}
}

func nullInt64Ptr(i *int64) sql.NullInt64 {
	if i == nil {
		return sql.NullInt64{}
	}
	return sql.NullInt64{Int64: *i, Valid: true}
}
