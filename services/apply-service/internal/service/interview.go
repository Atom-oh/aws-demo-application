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

type InterviewService struct {
	interviewRepo *repository.InterviewRepository
	appRepo       *repository.ApplicationRepository
	eventRepo     *repository.EventRepository
	kafka         *kafka.Writer
	logger        *zap.Logger
}

func NewInterviewService(interviewRepo *repository.InterviewRepository, appRepo *repository.ApplicationRepository, eventRepo *repository.EventRepository, kafka *kafka.Writer, logger *zap.Logger) *InterviewService {
	return &InterviewService{interviewRepo: interviewRepo, appRepo: appRepo, eventRepo: eventRepo, kafka: kafka, logger: logger}
}

func (s *InterviewService) CreateInterview(ctx context.Context, req *applyv1.CreateInterviewRequest) (*applyv1.CreateInterviewResponse, error) {
	// Verify application exists
	app, err := s.appRepo.GetByID(ctx, req.ApplicationId)
	if err != nil {
		return nil, err
	}

	interview, err := s.interviewRepo.Create(ctx, req)
	if err != nil {
		return nil, err
	}

	// Create event for interview scheduled
	s.eventRepo.Create(ctx, req.ApplicationId, applyv1.EventType_EVENT_TYPE_INTERVIEW_SCHEDULED,
		nil, nil, nil, nil, nil)

	s.publishEvent(ctx, "interview.scheduled", interview, app)
	return &applyv1.CreateInterviewResponse{Interview: interview.ToProto()}, nil
}

func (s *InterviewService) GetInterview(ctx context.Context, req *applyv1.GetInterviewRequest) (*applyv1.GetInterviewResponse, error) {
	interview, err := s.interviewRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &applyv1.GetInterviewResponse{Interview: interview.ToProto()}, nil
}

func (s *InterviewService) UpdateInterview(ctx context.Context, req *applyv1.UpdateInterviewRequest) (*applyv1.UpdateInterviewResponse, error) {
	interview, err := s.interviewRepo.Update(ctx, req)
	if err != nil {
		return nil, err
	}
	return &applyv1.UpdateInterviewResponse{Interview: interview.ToProto()}, nil
}

func (s *InterviewService) DeleteInterview(ctx context.Context, req *applyv1.DeleteInterviewRequest) (*applyv1.DeleteInterviewResponse, error) {
	if err := s.interviewRepo.Delete(ctx, req.Id); err != nil {
		return nil, err
	}
	return &applyv1.DeleteInterviewResponse{Success: true}, nil
}

func (s *InterviewService) ListInterviews(ctx context.Context, req *applyv1.ListInterviewsRequest) (*applyv1.ListInterviewsResponse, error) {
	page, pageSize := int32(1), int32(20)
	if req.Pagination != nil {
		page, pageSize = req.Pagination.Page, req.Pagination.PageSize
	}

	interviews, total, err := s.interviewRepo.List(ctx, req.ApplicationId, req.Status, req.InterviewType, page, pageSize)
	if err != nil {
		return nil, err
	}

	protoInterviews := make([]*applyv1.Interview, len(interviews))
	for i, interview := range interviews {
		protoInterviews[i] = interview.ToProto()
	}

	totalPages := int32((total + int64(pageSize) - 1) / int64(pageSize))
	return &applyv1.ListInterviewsResponse{
		Interviews: protoInterviews,
		Pagination: &commonv1.PaginationResponse{Page: page, PageSize: pageSize, Total: total, TotalPages: totalPages},
	}, nil
}

func (s *InterviewService) GetInterviewsByApplication(ctx context.Context, req *applyv1.GetInterviewsByApplicationRequest) (*applyv1.GetInterviewsByApplicationResponse, error) {
	interviews, err := s.interviewRepo.ListByApplicationID(ctx, req.ApplicationId)
	if err != nil {
		return nil, err
	}

	protoInterviews := make([]*applyv1.Interview, len(interviews))
	for i, interview := range interviews {
		protoInterviews[i] = interview.ToProto()
	}

	return &applyv1.GetInterviewsByApplicationResponse{Interviews: protoInterviews}, nil
}

func (s *InterviewService) RescheduleInterview(ctx context.Context, req *applyv1.RescheduleInterviewRequest) (*applyv1.RescheduleInterviewResponse, error) {
	interview, err := s.interviewRepo.GetByID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	updateReq := &applyv1.UpdateInterviewRequest{
		Id:              req.Id,
		ScheduledAt:     req.NewScheduledAt,
		Status:          ptr(applyv1.InterviewStatus_INTERVIEW_STATUS_RESCHEDULED),
	}
	if req.DurationMinutes > 0 {
		updateReq.DurationMinutes = &req.DurationMinutes
	}
	if req.Location != "" {
		updateReq.Location = &req.Location
	}
	if req.MeetingUrl != "" {
		updateReq.MeetingUrl = &req.MeetingUrl
	}

	interview, err = s.interviewRepo.Update(ctx, updateReq)
	if err != nil {
		return nil, err
	}

	return &applyv1.RescheduleInterviewResponse{Interview: interview.ToProto()}, nil
}

func (s *InterviewService) CancelInterview(ctx context.Context, req *applyv1.CancelInterviewRequest) (*applyv1.CancelInterviewResponse, error) {
	interview, err := s.interviewRepo.UpdateStatus(ctx, req.Id, applyv1.InterviewStatus_INTERVIEW_STATUS_CANCELLED)
	if err != nil {
		return nil, err
	}

	// Create event
	s.eventRepo.Create(ctx, interview.ApplicationID, applyv1.EventType_EVENT_TYPE_INTERVIEW_CANCELLED,
		nil, nil, &req.CancelledBy, &req.ActorType, &req.Reason)

	return &applyv1.CancelInterviewResponse{Interview: interview.ToProto()}, nil
}

func (s *InterviewService) CompleteInterview(ctx context.Context, req *applyv1.CompleteInterviewRequest) (*applyv1.CompleteInterviewResponse, error) {
	updateReq := &applyv1.UpdateInterviewRequest{
		Id:       req.Id,
		Status:   ptr(applyv1.InterviewStatus_INTERVIEW_STATUS_COMPLETED),
		Feedback: &req.Feedback,
	}

	interview, err := s.interviewRepo.Update(ctx, updateReq)
	if err != nil {
		return nil, err
	}

	// Create event
	s.eventRepo.Create(ctx, interview.ApplicationID, applyv1.EventType_EVENT_TYPE_INTERVIEW_COMPLETED,
		nil, nil, nil, nil, nil)

	return &applyv1.CompleteInterviewResponse{Interview: interview.ToProto()}, nil
}

func (s *InterviewService) publishEvent(ctx context.Context, eventType string, interview *model.Interview, app *model.Application) {
	if s.kafka == nil {
		return
	}
	data, _ := json.Marshal(map[string]interface{}{
		"type": eventType, "interview_id": interview.ID, "application_id": interview.ApplicationID,
		"job_id": app.JobID, "user_id": app.UserID,
	})
	s.kafka.WriteMessages(ctx, kafka.Message{Key: []byte(interview.ID), Value: data})
}
