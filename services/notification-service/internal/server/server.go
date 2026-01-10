package server

import (
	"context"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/hirehub/notification-service/internal/service"
)

// NotificationServer implements the gRPC notification service
type NotificationServer struct {
	notificationSvc *service.NotificationService
	templateSvc     *service.TemplateService
	logger          *zap.SugaredLogger
}

// NewNotificationServer creates a new notification server
func NewNotificationServer(
	notificationSvc *service.NotificationService,
	templateSvc *service.TemplateService,
	logger *zap.SugaredLogger,
) *NotificationServer {
	return &NotificationServer{
		notificationSvc: notificationSvc,
		templateSvc:     templateSvc,
		logger:          logger,
	}
}

// Register registers the server with the gRPC server
func (s *NotificationServer) Register(grpcServer *grpc.Server) {
	// Register notification service with gRPC server
	// pb.RegisterNotificationServiceServer(grpcServer, s)
	s.logger.Info("Notification gRPC server registered")
}

// SendNotification sends a notification to a user
func (s *NotificationServer) SendNotification(ctx context.Context, req *SendNotificationRequest) (*SendNotificationResponse, error) {
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user_id: %v", err)
	}

	notification, err := s.notificationSvc.SendNotification(ctx, &service.SendNotificationInput{
		UserID:     userID,
		Channel:    req.Channel,
		Title:      req.Title,
		Content:    req.Content,
		Data:       req.Data,
		TemplateID: req.TemplateId,
	})
	if err != nil {
		s.logger.Errorw("Failed to send notification", "error", err, "user_id", req.UserId)
		return nil, status.Errorf(codes.Internal, "failed to send notification: %v", err)
	}

	return &SendNotificationResponse{
		NotificationId: notification.ID.String(),
		Status:         notification.Status,
	}, nil
}

// GetNotification retrieves a notification by ID
func (s *NotificationServer) GetNotification(ctx context.Context, req *GetNotificationRequest) (*Notification, error) {
	id, err := uuid.Parse(req.NotificationId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid notification_id: %v", err)
	}

	notification, err := s.notificationSvc.GetNotification(ctx, id)
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "notification not found: %v", err)
	}

	return notificationToProto(notification), nil
}

// ListNotifications lists notifications for a user
func (s *NotificationServer) ListNotifications(ctx context.Context, req *ListNotificationsRequest) (*ListNotificationsResponse, error) {
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user_id: %v", err)
	}

	notifications, total, err := s.notificationSvc.ListNotifications(ctx, userID, int(req.Page), int(req.PageSize))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list notifications: %v", err)
	}

	protoNotifications := make([]*Notification, len(notifications))
	for i, n := range notifications {
		protoNotifications[i] = notificationToProto(n)
	}

	return &ListNotificationsResponse{
		Notifications: protoNotifications,
		Total:         int32(total),
	}, nil
}

// MarkAsRead marks a notification as read
func (s *NotificationServer) MarkAsRead(ctx context.Context, req *MarkAsReadRequest) (*emptypb.Empty, error) {
	id, err := uuid.Parse(req.NotificationId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid notification_id: %v", err)
	}

	if err := s.notificationSvc.MarkAsRead(ctx, id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to mark as read: %v", err)
	}

	return &emptypb.Empty{}, nil
}

// GetUnreadCount returns the count of unread notifications
func (s *NotificationServer) GetUnreadCount(ctx context.Context, req *GetUnreadCountRequest) (*GetUnreadCountResponse, error) {
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user_id: %v", err)
	}

	count, err := s.notificationSvc.GetUnreadCount(ctx, userID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get unread count: %v", err)
	}

	return &GetUnreadCountResponse{Count: int32(count)}, nil
}

// UpdateSettings updates user notification settings
func (s *NotificationServer) UpdateSettings(ctx context.Context, req *UpdateSettingsRequest) (*emptypb.Empty, error) {
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user_id: %v", err)
	}

	if err := s.notificationSvc.UpdateSettings(ctx, userID, &service.NotificationSettings{
		EmailEnabled:       req.EmailEnabled,
		PushEnabled:        req.PushEnabled,
		SMSEnabled:         req.SmsEnabled,
		DisabledEventTypes: req.DisabledEventTypes,
	}); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update settings: %v", err)
	}

	return &emptypb.Empty{}, nil
}

// RegisterDevice registers a device token for push notifications
func (s *NotificationServer) RegisterDevice(ctx context.Context, req *RegisterDeviceRequest) (*emptypb.Empty, error) {
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid user_id: %v", err)
	}

	if err := s.notificationSvc.RegisterDevice(ctx, userID, req.DeviceType, req.Token); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to register device: %v", err)
	}

	return &emptypb.Empty{}, nil
}

// Proto message types (placeholder - would be generated from .proto file)
type SendNotificationRequest struct {
	UserId     string
	Channel    string
	Title      string
	Content    string
	Data       map[string]string
	TemplateId string
}

type SendNotificationResponse struct {
	NotificationId string
	Status         string
}

type GetNotificationRequest struct {
	NotificationId string
}

type ListNotificationsRequest struct {
	UserId   string
	Page     int32
	PageSize int32
}

type ListNotificationsResponse struct {
	Notifications []*Notification
	Total         int32
}

type MarkAsReadRequest struct {
	NotificationId string
}

type GetUnreadCountRequest struct {
	UserId string
}

type GetUnreadCountResponse struct {
	Count int32
}

type UpdateSettingsRequest struct {
	UserId             string
	EmailEnabled       bool
	PushEnabled        bool
	SmsEnabled         bool
	DisabledEventTypes []string
}

type RegisterDeviceRequest struct {
	UserId     string
	DeviceType string
	Token      string
}

type Notification struct {
	Id        string
	UserId    string
	Channel   string
	Title     string
	Content   string
	Status    string
	CreatedAt *timestamppb.Timestamp
	ReadAt    *timestamppb.Timestamp
}

func notificationToProto(n *service.Notification) *Notification {
	proto := &Notification{
		Id:        n.ID.String(),
		UserId:    n.UserID.String(),
		Channel:   n.Channel,
		Title:     n.Title,
		Content:   n.Content,
		Status:    n.Status,
		CreatedAt: timestamppb.New(n.CreatedAt),
	}
	if n.ReadAt != nil {
		proto.ReadAt = timestamppb.New(*n.ReadAt)
	}
	return proto
}
