package server

import (
	"context"

	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	applyv1 "github.com/hirehub/proto/apply/v1"
	"github.com/hirehub/services/apply-service/internal/service"
)

type ApplyServer struct {
	applyv1.UnimplementedApplyServiceServer
	applicationService *service.ApplicationService
	interviewService   *service.InterviewService
	logger             *zap.Logger
}

func NewApplyServer(
	applicationService *service.ApplicationService,
	interviewService *service.InterviewService,
	logger *zap.Logger,
) *ApplyServer {
	return &ApplyServer{
		applicationService: applicationService,
		interviewService:   interviewService,
		logger:             logger,
	}
}

// Application CRUD
func (s *ApplyServer) CreateApplication(ctx context.Context, req *applyv1.CreateApplicationRequest) (*applyv1.CreateApplicationResponse, error) {
	if req.JobId == "" || req.UserId == "" || req.ResumeId == "" {
		return nil, status.Error(codes.InvalidArgument, "job_id, user_id, and resume_id are required")
	}
	return s.applicationService.CreateApplication(ctx, req)
}

func (s *ApplyServer) GetApplication(ctx context.Context, req *applyv1.GetApplicationRequest) (*applyv1.GetApplicationResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.applicationService.GetApplication(ctx, req)
}

func (s *ApplyServer) UpdateApplication(ctx context.Context, req *applyv1.UpdateApplicationRequest) (*applyv1.UpdateApplicationResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.applicationService.UpdateApplication(ctx, req)
}

func (s *ApplyServer) DeleteApplication(ctx context.Context, req *applyv1.DeleteApplicationRequest) (*applyv1.DeleteApplicationResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.applicationService.DeleteApplication(ctx, req)
}

func (s *ApplyServer) ListApplications(ctx context.Context, req *applyv1.ListApplicationsRequest) (*applyv1.ListApplicationsResponse, error) {
	return s.applicationService.ListApplications(ctx, req)
}

func (s *ApplyServer) GetApplicationsByJob(ctx context.Context, req *applyv1.GetApplicationsByJobRequest) (*applyv1.GetApplicationsByJobResponse, error) {
	if req.JobId == "" {
		return nil, status.Error(codes.InvalidArgument, "job_id is required")
	}
	return s.applicationService.GetApplicationsByJob(ctx, req)
}

func (s *ApplyServer) GetApplicationsByUser(ctx context.Context, req *applyv1.GetApplicationsByUserRequest) (*applyv1.GetApplicationsByUserResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}
	return s.applicationService.GetApplicationsByUser(ctx, req)
}

// Application Actions
func (s *ApplyServer) CheckDuplicateApplication(ctx context.Context, req *applyv1.CheckDuplicateApplicationRequest) (*applyv1.CheckDuplicateApplicationResponse, error) {
	if req.JobId == "" || req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "job_id and user_id are required")
	}
	return s.applicationService.CheckDuplicateApplication(ctx, req)
}

func (s *ApplyServer) WithdrawApplication(ctx context.Context, req *applyv1.WithdrawApplicationRequest) (*applyv1.WithdrawApplicationResponse, error) {
	if req.Id == "" || req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "id and user_id are required")
	}
	return s.applicationService.WithdrawApplication(ctx, req)
}

func (s *ApplyServer) UpdateApplicationStatus(ctx context.Context, req *applyv1.UpdateApplicationStatusRequest) (*applyv1.UpdateApplicationStatusResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.applicationService.UpdateApplicationStatus(ctx, req)
}

func (s *ApplyServer) BulkUpdateApplicationStatus(ctx context.Context, req *applyv1.BulkUpdateApplicationStatusRequest) (*applyv1.BulkUpdateApplicationStatusResponse, error) {
	if len(req.Ids) == 0 {
		return nil, status.Error(codes.InvalidArgument, "ids are required")
	}
	return s.applicationService.BulkUpdateApplicationStatus(ctx, req)
}

// Application Events
func (s *ApplyServer) CreateApplicationEvent(ctx context.Context, req *applyv1.CreateApplicationEventRequest) (*applyv1.CreateApplicationEventResponse, error) {
	if req.ApplicationId == "" {
		return nil, status.Error(codes.InvalidArgument, "application_id is required")
	}
	return s.applicationService.CreateApplicationEvent(ctx, req)
}

func (s *ApplyServer) ListApplicationEvents(ctx context.Context, req *applyv1.ListApplicationEventsRequest) (*applyv1.ListApplicationEventsResponse, error) {
	if req.ApplicationId == "" {
		return nil, status.Error(codes.InvalidArgument, "application_id is required")
	}
	return s.applicationService.ListApplicationEvents(ctx, req)
}

// Interview CRUD
func (s *ApplyServer) CreateInterview(ctx context.Context, req *applyv1.CreateInterviewRequest) (*applyv1.CreateInterviewResponse, error) {
	if req.ApplicationId == "" {
		return nil, status.Error(codes.InvalidArgument, "application_id is required")
	}
	return s.interviewService.CreateInterview(ctx, req)
}

func (s *ApplyServer) GetInterview(ctx context.Context, req *applyv1.GetInterviewRequest) (*applyv1.GetInterviewResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.interviewService.GetInterview(ctx, req)
}

func (s *ApplyServer) UpdateInterview(ctx context.Context, req *applyv1.UpdateInterviewRequest) (*applyv1.UpdateInterviewResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.interviewService.UpdateInterview(ctx, req)
}

func (s *ApplyServer) DeleteInterview(ctx context.Context, req *applyv1.DeleteInterviewRequest) (*applyv1.DeleteInterviewResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.interviewService.DeleteInterview(ctx, req)
}

func (s *ApplyServer) ListInterviews(ctx context.Context, req *applyv1.ListInterviewsRequest) (*applyv1.ListInterviewsResponse, error) {
	return s.interviewService.ListInterviews(ctx, req)
}

func (s *ApplyServer) GetInterviewsByApplication(ctx context.Context, req *applyv1.GetInterviewsByApplicationRequest) (*applyv1.GetInterviewsByApplicationResponse, error) {
	if req.ApplicationId == "" {
		return nil, status.Error(codes.InvalidArgument, "application_id is required")
	}
	return s.interviewService.GetInterviewsByApplication(ctx, req)
}

// Interview Actions
func (s *ApplyServer) RescheduleInterview(ctx context.Context, req *applyv1.RescheduleInterviewRequest) (*applyv1.RescheduleInterviewResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.interviewService.RescheduleInterview(ctx, req)
}

func (s *ApplyServer) CancelInterview(ctx context.Context, req *applyv1.CancelInterviewRequest) (*applyv1.CancelInterviewResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.interviewService.CancelInterview(ctx, req)
}

func (s *ApplyServer) CompleteInterview(ctx context.Context, req *applyv1.CompleteInterviewRequest) (*applyv1.CompleteInterviewResponse, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	return s.interviewService.CompleteInterview(ctx, req)
}

// Statistics
func (s *ApplyServer) GetApplicationStats(ctx context.Context, req *applyv1.GetApplicationStatsRequest) (*applyv1.GetApplicationStatsResponse, error) {
	return s.applicationService.GetApplicationStats(ctx, req)
}
