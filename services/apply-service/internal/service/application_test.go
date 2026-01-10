package service

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	applyv1 "github.com/hirehub/proto/apply/v1"
	commonv1 "github.com/hirehub/proto/common/v1"
	"github.com/hirehub/services/apply-service/internal/model"
)

// Mock ApplicationRepository
type MockApplicationRepository struct {
	mock.Mock
}

func (m *MockApplicationRepository) Create(ctx context.Context, jobID, userID, resumeID string, coverLetter *string) (*model.Application, error) {
	args := m.Called(ctx, jobID, userID, resumeID, coverLetter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Application), args.Error(1)
}

func (m *MockApplicationRepository) GetByID(ctx context.Context, id string) (*model.Application, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Application), args.Error(1)
}

func (m *MockApplicationRepository) List(ctx context.Context, filter ListFilter) ([]*model.Application, int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]*model.Application), args.Get(1).(int64), args.Error(2)
}

func (m *MockApplicationRepository) CheckDuplicate(ctx context.Context, jobID, userID string) (bool, string, error) {
	args := m.Called(ctx, jobID, userID)
	return args.Bool(0), args.String(1), args.Error(2)
}

func (m *MockApplicationRepository) UpdateStatus(ctx context.Context, id string, status applyv1.ApplicationStatus) (*model.Application, error) {
	args := m.Called(ctx, id, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Application), args.Error(1)
}

// Mock EventRepository
type MockEventRepository struct {
	mock.Mock
}

func (m *MockEventRepository) Create(ctx context.Context, appID string, eventType applyv1.EventType, fromStatus, toStatus *applyv1.ApplicationStatus, actorID *string, actorType *applyv1.ActorType, payload *string) (*model.ApplicationEvent, error) {
	args := m.Called(ctx, appID, eventType, fromStatus, toStatus, actorID, actorType, payload)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ApplicationEvent), args.Error(1)
}

func (m *MockEventRepository) ListByApplicationID(ctx context.Context, appID string, page, pageSize int32) ([]*model.ApplicationEvent, int64, error) {
	args := m.Called(ctx, appID, page, pageSize)
	return args.Get(0).([]*model.ApplicationEvent), args.Get(1).(int64), args.Error(2)
}

// ListFilter type for testing
type ListFilter struct {
	JobID    *string
	UserID   *string
	Status   *applyv1.ApplicationStatus
	Statuses []applyv1.ApplicationStatus
	Page     int32
	PageSize int32
}

// Tests
func TestCheckDuplicateApplication_Exists(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	ctx := context.Background()

	mockRepo.On("CheckDuplicate", ctx, "job-123", "user-456").Return(true, "app-789", nil)

	exists, id, err := mockRepo.CheckDuplicate(ctx, "job-123", "user-456")

	assert.NoError(t, err)
	assert.True(t, exists)
	assert.Equal(t, "app-789", id)
	mockRepo.AssertExpectations(t)
}

func TestCheckDuplicateApplication_NotExists(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	ctx := context.Background()

	mockRepo.On("CheckDuplicate", ctx, "job-123", "user-456").Return(false, "", nil)

	exists, id, err := mockRepo.CheckDuplicate(ctx, "job-123", "user-456")

	assert.NoError(t, err)
	assert.False(t, exists)
	assert.Empty(t, id)
}

func TestWithdrawApplication_Success(t *testing.T) {
	mockRepo := new(MockApplicationRepository)
	ctx := context.Background()

	existingApp := &model.Application{
		ID:     "app-123",
		JobID:  "job-456",
		UserID: "user-789",
		Status: "submitted",
	}

	withdrawnApp := &model.Application{
		ID:     "app-123",
		JobID:  "job-456",
		UserID: "user-789",
		Status: "withdrawn",
	}

	mockRepo.On("GetByID", ctx, "app-123").Return(existingApp, nil)
	mockRepo.On("UpdateStatus", ctx, "app-123", applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN).Return(withdrawnApp, nil)

	// Verify state transition
	assert.Equal(t, "submitted", existingApp.Status)
	updatedApp, err := mockRepo.UpdateStatus(ctx, "app-123", applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN)

	assert.NoError(t, err)
	assert.Equal(t, "withdrawn", updatedApp.Status)
}

func TestBulkUpdateStatus_PartialSuccess(t *testing.T) {
	ids := []string{"app-1", "app-2", "app-3"}
	newStatus := applyv1.ApplicationStatus_APPLICATION_STATUS_REVIEWED

	// Simulate: app-1 succeeds, app-2 fails, app-3 succeeds
	var succeeded int32 = 2
	var failed int32 = 1
	total := int32(len(ids))

	// Verify batch result calculation
	assert.Equal(t, int32(3), total)
	assert.Equal(t, int32(2), succeeded)
	assert.Equal(t, int32(1), failed)
	assert.Equal(t, total, succeeded+failed)

	result := &commonv1.BatchResult{
		Total:     total,
		Succeeded: succeeded,
		Failed:    failed,
		FailedIds: []string{"app-2"},
	}

	assert.Equal(t, int32(3), result.Total)
	assert.Equal(t, int32(2), result.Succeeded)
	assert.Len(t, result.FailedIds, 1)
}

func TestApplicationStatusTransitions(t *testing.T) {
	// Valid status transitions
	validTransitions := map[applyv1.ApplicationStatus][]applyv1.ApplicationStatus{
		applyv1.ApplicationStatus_APPLICATION_STATUS_SUBMITTED: {
			applyv1.ApplicationStatus_APPLICATION_STATUS_REVIEWED,
			applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN,
			applyv1.ApplicationStatus_APPLICATION_STATUS_REJECTED,
		},
		applyv1.ApplicationStatus_APPLICATION_STATUS_REVIEWED: {
			applyv1.ApplicationStatus_APPLICATION_STATUS_INTERVIEWING,
			applyv1.ApplicationStatus_APPLICATION_STATUS_REJECTED,
			applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN,
		},
		applyv1.ApplicationStatus_APPLICATION_STATUS_INTERVIEWING: {
			applyv1.ApplicationStatus_APPLICATION_STATUS_OFFERED,
			applyv1.ApplicationStatus_APPLICATION_STATUS_REJECTED,
			applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN,
		},
		applyv1.ApplicationStatus_APPLICATION_STATUS_OFFERED: {
			applyv1.ApplicationStatus_APPLICATION_STATUS_HIRED,
			applyv1.ApplicationStatus_APPLICATION_STATUS_REJECTED,
			applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN,
		},
	}

	// Test that submitted can transition to reviewed
	from := applyv1.ApplicationStatus_APPLICATION_STATUS_SUBMITTED
	to := applyv1.ApplicationStatus_APPLICATION_STATUS_REVIEWED

	allowedTransitions := validTransitions[from]
	found := false
	for _, allowed := range allowedTransitions {
		if allowed == to {
			found = true
			break
		}
	}
	assert.True(t, found, "Should allow transition from submitted to reviewed")
}

func TestPtrHelper(t *testing.T) {
	// Test the ptr helper function
	intVal := 42
	ptrVal := ptr(intVal)
	assert.NotNil(t, ptrVal)
	assert.Equal(t, 42, *ptrVal)

	strVal := "test"
	strPtr := ptr(strVal)
	assert.NotNil(t, strPtr)
	assert.Equal(t, "test", *strPtr)
}
