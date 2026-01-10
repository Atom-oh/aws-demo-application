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

// UserRepository handles database operations for users
type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, req *userv1.CreateUserRequest) (*userv1.User, error) {
	query := `INSERT INTO users (cognito_sub, email, user_type, status) VALUES ($1, $2, $3, $4)
		RETURNING id, cognito_sub, email, user_type, status, created_at, updated_at`

	var user userv1.User
	var userType, userStatus string
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query,
		req.CognitoSub, req.Email, userTypeToString(req.UserType), "active",
	).Scan(&user.Id, &user.CognitoSub, &user.Email, &userType, &userStatus, &createdAt, &updatedAt)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, status.Error(codes.AlreadyExists, "user already exists")
		}
		return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
	}

	user.UserType = stringToUserType(userType)
	user.Status = stringToUserStatus(userStatus)
	user.CreatedAt = timestamppb.New(createdAt)
	user.UpdatedAt = timestamppb.New(updatedAt)
	return &user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*userv1.User, error) {
	return r.getByField(ctx, "id", id)
}

func (r *UserRepository) GetByCognitoSub(ctx context.Context, cognitoSub string) (*userv1.User, error) {
	return r.getByField(ctx, "cognito_sub", cognitoSub)
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*userv1.User, error) {
	return r.getByField(ctx, "email", email)
}

func (r *UserRepository) getByField(ctx context.Context, field, value string) (*userv1.User, error) {
	query := fmt.Sprintf(`SELECT id, cognito_sub, email, user_type, status, created_at, updated_at FROM users WHERE %s = $1`, field)

	var user userv1.User
	var userType, userStatus string
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, value).Scan(
		&user.Id, &user.CognitoSub, &user.Email, &userType, &userStatus, &createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "user not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}

	user.UserType = stringToUserType(userType)
	user.Status = stringToUserStatus(userStatus)
	user.CreatedAt = timestamppb.New(createdAt)
	user.UpdatedAt = timestamppb.New(updatedAt)
	return &user, nil
}

func (r *UserRepository) Update(ctx context.Context, req *userv1.UpdateUserRequest) (*userv1.User, error) {
	query := `UPDATE users SET status = COALESCE($2, status), updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 RETURNING id, cognito_sub, email, user_type, status, created_at, updated_at`

	var statusStr *string
	if req.Status != nil {
		s := userStatusToString(*req.Status)
		statusStr = &s
	}

	var user userv1.User
	var userType, userStatus string
	var createdAt, updatedAt time.Time

	err := r.db.QueryRowContext(ctx, query, req.Id, statusStr).Scan(
		&user.Id, &user.CognitoSub, &user.Email, &userType, &userStatus, &createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, status.Error(codes.NotFound, "user not found")
	}
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update user: %v", err)
	}

	user.UserType = stringToUserType(userType)
	user.Status = stringToUserStatus(userStatus)
	user.CreatedAt = timestamppb.New(createdAt)
	user.UpdatedAt = timestamppb.New(updatedAt)
	return &user, nil
}

func (r *UserRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return status.Errorf(codes.Internal, "failed to delete user: %v", err)
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return status.Error(codes.NotFound, "user not found")
	}
	return nil
}

func (r *UserRepository) List(ctx context.Context, req *userv1.ListUsersRequest) (*userv1.ListUsersResponse, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if req.UserType != nil && *req.UserType != userv1.UserType_USER_TYPE_UNSPECIFIED {
		conditions = append(conditions, fmt.Sprintf("user_type = $%d", argIdx))
		args = append(args, userTypeToString(*req.UserType))
		argIdx++
	}
	if req.Status != nil && *req.Status != userv1.UserStatus_USER_STATUS_UNSPECIFIED {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, userStatusToString(*req.Status))
		argIdx++
	}
	if req.EmailContains != nil {
		conditions = append(conditions, fmt.Sprintf("email ILIKE $%d", argIdx))
		args = append(args, "%"+*req.EmailContains+"%")
		argIdx++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users %s", whereClause)
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to count users: %v", err)
	}

	// Pagination
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

	query := fmt.Sprintf(`SELECT id, cognito_sub, email, user_type, status, created_at, updated_at
		FROM users %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list users: %v", err)
	}
	defer rows.Close()

	var users []*userv1.User
	for rows.Next() {
		var user userv1.User
		var userType, userStatus string
		var createdAt, updatedAt time.Time

		if err := rows.Scan(&user.Id, &user.CognitoSub, &user.Email, &userType, &userStatus, &createdAt, &updatedAt); err != nil {
			return nil, status.Errorf(codes.Internal, "failed to scan user: %v", err)
		}
		user.UserType = stringToUserType(userType)
		user.Status = stringToUserStatus(userStatus)
		user.CreatedAt = timestamppb.New(createdAt)
		user.UpdatedAt = timestamppb.New(updatedAt)
		users = append(users, &user)
	}

	return &userv1.ListUsersResponse{
		Users: users,
		Pagination: &commonv1.PaginationResponse{
			Page: page, PageSize: pageSize, Total: total, TotalPages: totalPages,
		},
	}, nil
}

// Helper functions
func userTypeToString(t userv1.UserType) string {
	switch t {
	case userv1.UserType_USER_TYPE_JOBSEEKER:
		return "jobseeker"
	case userv1.UserType_USER_TYPE_COMPANY_MEMBER:
		return "company_member"
	case userv1.UserType_USER_TYPE_ADMIN:
		return "admin"
	default:
		return "unknown"
	}
}

func stringToUserType(s string) userv1.UserType {
	switch s {
	case "jobseeker":
		return userv1.UserType_USER_TYPE_JOBSEEKER
	case "company_member":
		return userv1.UserType_USER_TYPE_COMPANY_MEMBER
	case "admin":
		return userv1.UserType_USER_TYPE_ADMIN
	default:
		return userv1.UserType_USER_TYPE_UNSPECIFIED
	}
}

func userStatusToString(s userv1.UserStatus) string {
	switch s {
	case userv1.UserStatus_USER_STATUS_ACTIVE:
		return "active"
	case userv1.UserStatus_USER_STATUS_INACTIVE:
		return "inactive"
	case userv1.UserStatus_USER_STATUS_SUSPENDED:
		return "suspended"
	case userv1.UserStatus_USER_STATUS_DELETED:
		return "deleted"
	default:
		return "unknown"
	}
}

func stringToUserStatus(s string) userv1.UserStatus {
	switch s {
	case "active":
		return userv1.UserStatus_USER_STATUS_ACTIVE
	case "inactive":
		return userv1.UserStatus_USER_STATUS_INACTIVE
	case "suspended":
		return userv1.UserStatus_USER_STATUS_SUSPENDED
	case "deleted":
		return userv1.UserStatus_USER_STATUS_DELETED
	default:
		return userv1.UserStatus_USER_STATUS_UNSPECIFIED
	}
}

func isUniqueViolation(err error) bool {
	if pqErr, ok := err.(*pq.Error); ok {
		return pqErr.Code == "23505"
	}
	return false
}
