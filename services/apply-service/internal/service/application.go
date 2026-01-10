package service

import (
	"context"
	"encoding/json"

	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"

	applyv1 "github.com/hirehub/proto/apply/v1"
	commonv1 "github.com/hirehub/proto/common/v1"
	"github.com/hirehub/services/apply-service/internal/model"
	"github.com/hirehub/services/apply-service/internal/repository"
)

type ApplicationService struct {
	appRepo   *repository.ApplicationRepository
	eventRepo *repository.EventRepository
	kafka     *kafka.Writer
	logger    *zap.Logger
}

func NewApplicationService(appRepo *repository.ApplicationRepository, eventRepo *repository.EventRepository, kafka *kafka.Writer, logger *zap.Logger) *ApplicationService {
	return &ApplicationService{appRepo: appRepo, eventRepo: eventRepo, kafka: kafka, logger: logger}
}

func (s *ApplicationService) CreateApplication(ctx context.Context, req *applyv1.CreateApplicationRequest) (*applyv1.CreateApplicationResponse, error) {
	var coverLetter *string
	if req.CoverLetter != "" {
		coverLetter = &req.CoverLetter
	}

	app, err := s.appRepo.Create(ctx, req.JobId, req.UserId, req.ResumeId, coverLetter)
	if err != nil {
		return nil, err
	}

	// Create submitted event
	s.eventRepo.Create(ctx, app.ID, applyv1.EventType_EVENT_TYPE_SUBMITTED, nil,
		ptr(applyv1.ApplicationStatus_APPLICATION_STATUS_SUBMITTED),
		&req.UserId, ptr(applyv1.ActorType_ACTOR_TYPE_JOBSEEKER), nil)

	s.publishEvent(ctx, "application.created", app)
	return &applyv1.CreateApplicationResponse{Application: app.ToProto()}, nil
}

func (s *ApplicationService) GetApplication(ctx context.Context, req *applyv1.GetApplicationRequest) (*applyv1.GetApplicationResponse, error) {
	app, err := s.appRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	if req.IncludeInterviews {
		// Load interviews via interview repository (handled at server level)
	}
	if req.IncludeEvents {
		events, _, _ := s.eventRepo.ListByApplicationID(ctx, req.Id, 1, 100)
		app.Events = events
	}

	return &applyv1.GetApplicationResponse{Application: app.ToProto()}, nil
}

func (s *ApplicationService) UpdateApplication(ctx context.Context, req *applyv1.UpdateApplicationRequest) (*applyv1.UpdateApplicationResponse, error) {
	var coverLetter, resumeID *string
	var status *applyv1.ApplicationStatus
	var matchScore *float64

	if req.CoverLetter != nil {
		coverLetter = req.CoverLetter
	}
	if req.Status != nil {
		status = req.Status
	}
	if req.MatchScore != nil {
		matchScore = req.MatchScore
	}
	if req.ResumeId != nil {
		resumeID = req.ResumeId
	}

	app, err := s.appRepo.Update(ctx, req.Id, coverLetter, status, matchScore, resumeID)
	if err != nil {
		return nil, err
	}

	return &applyv1.UpdateApplicationResponse{Application: app.ToProto()}, nil
}

func (s *ApplicationService) DeleteApplication(ctx context.Context, req *applyv1.DeleteApplicationRequest) (*applyv1.DeleteApplicationResponse, error) {
	if err := s.appRepo.Delete(ctx, req.Id); err != nil {
		return nil, err
	}
	return &applyv1.DeleteApplicationResponse{Success: true}, nil
}

func (s *ApplicationService) ListApplications(ctx context.Context, req *applyv1.ListApplicationsRequest) (*applyv1.ListApplicationsResponse, error) {
	filter := repository.ListFilter{Page: 1, PageSize: 20}
	if req.Pagination != nil {
		filter.Page, filter.PageSize = req.Pagination.Page, req.Pagination.PageSize
	}
	if req.JobId != nil {
		filter.JobID = req.JobId
	}
	if req.UserId != nil {
		filter.UserID = req.UserId
	}
	if req.Status != nil {
		filter.Status = req.Status
	}
	if len(req.Statuses) > 0 {
		filter.Statuses = req.Statuses
	}

	apps, total, err := s.appRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	protoApps := make([]*applyv1.Application, len(apps))
	for i, app := range apps {
		protoApps[i] = app.ToProto()
	}

	totalPages := int32((total + int64(filter.PageSize) - 1) / int64(filter.PageSize))
	return &applyv1.ListApplicationsResponse{
		Applications: protoApps,
		Pagination:   &commonv1.PaginationResponse{Page: filter.Page, PageSize: filter.PageSize, Total: total, TotalPages: totalPages},
	}, nil
}

func (s *ApplicationService) GetApplicationsByJob(ctx context.Context, req *applyv1.GetApplicationsByJobRequest) (*applyv1.GetApplicationsByJobResponse, error) {
	filter := repository.ListFilter{JobID: &req.JobId, Page: 1, PageSize: 20}
	if req.Pagination != nil {
		filter.Page, filter.PageSize = req.Pagination.Page, req.Pagination.PageSize
	}
	if req.Status != nil {
		filter.Status = req.Status
	}

	apps, total, err := s.appRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	protoApps := make([]*applyv1.Application, len(apps))
	for i, app := range apps {
		protoApps[i] = app.ToProto()
	}

	totalPages := int32((total + int64(filter.PageSize) - 1) / int64(filter.PageSize))
	return &applyv1.GetApplicationsByJobResponse{
		Applications: protoApps,
		Pagination:   &commonv1.PaginationResponse{Page: filter.Page, PageSize: filter.PageSize, Total: total, TotalPages: totalPages},
	}, nil
}

func (s *ApplicationService) GetApplicationsByUser(ctx context.Context, req *applyv1.GetApplicationsByUserRequest) (*applyv1.GetApplicationsByUserResponse, error) {
	filter := repository.ListFilter{UserID: &req.UserId, Page: 1, PageSize: 20}
	if req.Pagination != nil {
		filter.Page, filter.PageSize = req.Pagination.Page, req.Pagination.PageSize
	}
	if req.Status != nil {
		filter.Status = req.Status
	}

	apps, total, err := s.appRepo.List(ctx, filter)
	if err != nil {
		return nil, err
	}

	protoApps := make([]*applyv1.Application, len(apps))
	for i, app := range apps {
		protoApps[i] = app.ToProto()
	}

	totalPages := int32((total + int64(filter.PageSize) - 1) / int64(filter.PageSize))
	return &applyv1.GetApplicationsByUserResponse{
		Applications: protoApps,
		Pagination:   &commonv1.PaginationResponse{Page: filter.Page, PageSize: filter.PageSize, Total: total, TotalPages: totalPages},
	}, nil
}

func (s *ApplicationService) CheckDuplicateApplication(ctx context.Context, req *applyv1.CheckDuplicateApplicationRequest) (*applyv1.CheckDuplicateApplicationResponse, error) {
	exists, id, err := s.appRepo.CheckDuplicate(ctx, req.JobId, req.UserId)
	if err != nil {
		return nil, err
	}
	return &applyv1.CheckDuplicateApplicationResponse{Exists: exists, ApplicationId: id}, nil
}

func (s *ApplicationService) WithdrawApplication(ctx context.Context, req *applyv1.WithdrawApplicationRequest) (*applyv1.WithdrawApplicationResponse, error) {
	app, err := s.appRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	fromStatus := model.StringToApplicationStatus(app.Status)
	toStatus := applyv1.ApplicationStatus_APPLICATION_STATUS_WITHDRAWN

	app, err = s.appRepo.UpdateStatus(ctx, req.Id, toStatus)
	if err != nil {
		return nil, err
	}

	s.eventRepo.Create(ctx, req.Id, applyv1.EventType_EVENT_TYPE_WITHDRAWN,
		&fromStatus, &toStatus, &req.UserId, ptr(applyv1.ActorType_ACTOR_TYPE_JOBSEEKER), &req.Reason)

	s.publishEvent(ctx, "application.withdrawn", app)
	return &applyv1.WithdrawApplicationResponse{Application: app.ToProto()}, nil
}

func (s *ApplicationService) UpdateApplicationStatus(ctx context.Context, req *applyv1.UpdateApplicationStatusRequest) (*applyv1.UpdateApplicationStatusResponse, error) {
	app, err := s.appRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	fromStatus := model.StringToApplicationStatus(app.Status)
	app, err = s.appRepo.UpdateStatus(ctx, req.Id, req.Status)
	if err != nil {
		return nil, err
	}

	event, _ := s.eventRepo.Create(ctx, req.Id, applyv1.EventType_EVENT_TYPE_STATUS_CHANGED,
		&fromStatus, &req.Status, &req.ActorId, &req.ActorType, &req.Comment)

	s.publishEvent(ctx, "application.status_changed", app)
	return &applyv1.UpdateApplicationStatusResponse{Application: app.ToProto(), Event: event.ToProto()}, nil
}

func (s *ApplicationService) BulkUpdateApplicationStatus(ctx context.Context, req *applyv1.BulkUpdateApplicationStatusRequest) (*applyv1.BulkUpdateApplicationStatusResponse, error) {
	var apps []*applyv1.Application
	var failedIDs, errorMsgs []string
	succeeded := 0

	for _, id := range req.Ids {
		app, err := s.appRepo.UpdateStatus(ctx, id, req.Status)
		if err != nil {
			failedIDs = append(failedIDs, id)
			errorMsgs = append(errorMsgs, err.Error())
			continue
		}
		apps = append(apps, app.ToProto())
		succeeded++
	}

	return &applyv1.BulkUpdateApplicationStatusResponse{
		Applications: apps,
		Result: &commonv1.BatchResult{
			Total: int32(len(req.Ids)), Succeeded: int32(succeeded), Failed: int32(len(failedIDs)),
			FailedIds: failedIDs, ErrorMessages: errorMsgs,
		},
	}, nil
}

func (s *ApplicationService) CreateApplicationEvent(ctx context.Context, req *applyv1.CreateApplicationEventRequest) (*applyv1.CreateApplicationEventResponse, error) {
	event, err := s.eventRepo.Create(ctx, req.ApplicationId, req.EventType, &req.FromStatus, &req.ToStatus, &req.ActorId, &req.ActorType, &req.Payload)
	if err != nil {
		return nil, err
	}
	return &applyv1.CreateApplicationEventResponse{Event: event.ToProto()}, nil
}

func (s *ApplicationService) ListApplicationEvents(ctx context.Context, req *applyv1.ListApplicationEventsRequest) (*applyv1.ListApplicationEventsResponse, error) {
	page, pageSize := int32(1), int32(20)
	if req.Pagination != nil {
		page, pageSize = req.Pagination.Page, req.Pagination.PageSize
	}

	events, total, err := s.eventRepo.ListByApplicationID(ctx, req.ApplicationId, page, pageSize)
	if err != nil {
		return nil, err
	}

	protoEvents := make([]*applyv1.ApplicationEvent, len(events))
	for i, e := range events {
		protoEvents[i] = e.ToProto()
	}

	totalPages := int32((total + int64(pageSize) - 1) / int64(pageSize))
	return &applyv1.ListApplicationEventsResponse{
		Events:     protoEvents,
		Pagination: &commonv1.PaginationResponse{Page: page, PageSize: pageSize, Total: total, TotalPages: totalPages},
	}, nil
}

func (s *ApplicationService) GetApplicationStats(ctx context.Context, req *applyv1.GetApplicationStatsRequest) (*applyv1.GetApplicationStatsResponse, error) {
	byStatus, avgScore, offers, hired, _, err := s.appRepo.GetStats(ctx, req.JobId, req.CompanyId, req.UserId)
	if err != nil {
		return nil, err
	}

	var total int64
	for _, count := range byStatus {
		total += count
	}

	return &applyv1.GetApplicationStatsResponse{
		TotalApplications: total, ByStatus: byStatus, AverageMatchScore: avgScore,
		TotalOffers: offers, TotalHired: hired,
	}, nil
}

func (s *ApplicationService) publishEvent(ctx context.Context, eventType string, app *model.Application) {
	if s.kafka == nil {
		return
	}
	data, _ := json.Marshal(map[string]interface{}{"type": eventType, "application_id": app.ID, "job_id": app.JobID, "user_id": app.UserID, "status": app.Status})
	s.kafka.WriteMessages(ctx, kafka.Message{Key: []byte(app.ID), Value: data})
}

func ptr[T any](v T) *T { return &v }
