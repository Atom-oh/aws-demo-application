package repository

import (
	"context"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	userv1 "github.com/hirehub/proto/user/v1"
)

func TestUserRepository_Create_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()
	now := time.Now()

	req := &userv1.CreateUserRequest{
		CognitoSub: "cognito-123",
		Email:      "test@example.com",
		UserType:   userv1.UserType_USER_TYPE_JOBSEEKER,
	}

	rows := sqlmock.NewRows([]string{"id", "cognito_sub", "email", "user_type", "status", "created_at", "updated_at"}).
		AddRow("uuid-123", "cognito-123", "test@example.com", "jobseeker", "active", now, now)

	mock.ExpectQuery(`INSERT INTO users`).
		WithArgs("cognito-123", "test@example.com", "jobseeker", "active").
		WillReturnRows(rows)

	user, err := repo.Create(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "uuid-123", user.Id)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, userv1.UserType_USER_TYPE_JOBSEEKER, user.UserType)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_Create_DuplicateEmail(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	req := &userv1.CreateUserRequest{
		CognitoSub: "cognito-123",
		Email:      "existing@example.com",
		UserType:   userv1.UserType_USER_TYPE_JOBSEEKER,
	}

	mock.ExpectQuery(`INSERT INTO users`).
		WithArgs("cognito-123", "existing@example.com", "jobseeker", "active").
		WillReturnError(&pq.Error{Code: "23505"})

	user, err := repo.Create(ctx, req)

	assert.Nil(t, user)
	assert.Error(t, err)
	assert.Equal(t, codes.AlreadyExists, status.Code(err))
}

func TestUserRepository_GetByID_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()
	now := time.Now()

	rows := sqlmock.NewRows([]string{"id", "cognito_sub", "email", "user_type", "status", "created_at", "updated_at"}).
		AddRow("uuid-123", "cognito-123", "test@example.com", "jobseeker", "active", now, now)

	mock.ExpectQuery(`SELECT .* FROM users WHERE id = \$1`).
		WithArgs("uuid-123").
		WillReturnRows(rows)

	user, err := repo.GetByID(ctx, "uuid-123")

	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "uuid-123", user.Id)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_GetByID_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	mock.ExpectQuery(`SELECT .* FROM users WHERE id = \$1`).
		WithArgs("nonexistent").
		WillReturnRows(sqlmock.NewRows([]string{}))

	user, err := repo.GetByID(ctx, "nonexistent")

	assert.Nil(t, user)
	assert.Error(t, err)
	assert.Equal(t, codes.NotFound, status.Code(err))
}

func TestUserRepository_Delete_Success(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	mock.ExpectExec(`DELETE FROM users WHERE id = \$1`).
		WithArgs("uuid-123").
		WillReturnResult(sqlmock.NewResult(0, 1))

	err = repo.Delete(ctx, "uuid-123")

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_Delete_NotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	repo := NewUserRepository(db)
	ctx := context.Background()

	mock.ExpectExec(`DELETE FROM users WHERE id = \$1`).
		WithArgs("nonexistent").
		WillReturnResult(sqlmock.NewResult(0, 0))

	err = repo.Delete(ctx, "nonexistent")

	assert.Error(t, err)
	assert.Equal(t, codes.NotFound, status.Code(err))
}

// Test helper functions
func TestUserTypeConversions(t *testing.T) {
	tests := []struct {
		userType userv1.UserType
		expected string
	}{
		{userv1.UserType_USER_TYPE_JOBSEEKER, "jobseeker"},
		{userv1.UserType_USER_TYPE_COMPANY_MEMBER, "company_member"},
		{userv1.UserType_USER_TYPE_ADMIN, "admin"},
		{userv1.UserType_USER_TYPE_UNSPECIFIED, "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := userTypeToString(tt.userType)
			assert.Equal(t, tt.expected, result)

			// Round-trip test (except unknown)
			if tt.expected != "unknown" {
				converted := stringToUserType(result)
				assert.Equal(t, tt.userType, converted)
			}
		})
	}
}

func TestUserStatusConversions(t *testing.T) {
	tests := []struct {
		status   userv1.UserStatus
		expected string
	}{
		{userv1.UserStatus_USER_STATUS_ACTIVE, "active"},
		{userv1.UserStatus_USER_STATUS_INACTIVE, "inactive"},
		{userv1.UserStatus_USER_STATUS_SUSPENDED, "suspended"},
		{userv1.UserStatus_USER_STATUS_DELETED, "deleted"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := userStatusToString(tt.status)
			assert.Equal(t, tt.expected, result)

			converted := stringToUserStatus(result)
			assert.Equal(t, tt.status, converted)
		})
	}
}
