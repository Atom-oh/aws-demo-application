package service

import (
	"bytes"
	"context"
	"encoding/json"
	"text/template"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/hirehub/notification-service/internal/repository"
	"github.com/hirehub/notification-service/internal/sender"
)

// Notification represents a notification entity
type Notification struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	TemplateID   *uuid.UUID
	Channel      string
	Title        string
	Content      string
	Data         map[string]interface{}
	Status       string
	SentAt       *time.Time
	ReadAt       *time.Time
	ErrorMessage *string
	CreatedAt    time.Time
}

// NotificationSettings represents user notification preferences
type NotificationSettings struct {
	EmailEnabled       bool
	PushEnabled        bool
	SMSEnabled         bool
	DisabledEventTypes []string
}

// SendNotificationInput represents input for sending a notification
type SendNotificationInput struct {
	UserID     uuid.UUID
	Channel    string
	Title      string
	Content    string
	Data       map[string]string
	TemplateID string
}

// NotificationService handles notification business logic
type NotificationService struct {
	notificationRepo *repository.NotificationRepository
	templateRepo     *repository.TemplateRepository
	emailSender      *sender.EmailSender
	pushSender       *sender.PushSender
	smsSender        *sender.SMSSender
	logger           *zap.SugaredLogger
}

// NewNotificationService creates a new notification service
func NewNotificationService(
	notificationRepo *repository.NotificationRepository,
	templateRepo *repository.TemplateRepository,
	emailSender *sender.EmailSender,
	pushSender *sender.PushSender,
	smsSender *sender.SMSSender,
	logger *zap.SugaredLogger,
) *NotificationService {
	return &NotificationService{
		notificationRepo: notificationRepo,
		templateRepo:     templateRepo,
		emailSender:      emailSender,
		pushSender:       pushSender,
		smsSender:        smsSender,
		logger:           logger,
	}
}

// SendNotification sends a notification through the specified channel
func (s *NotificationService) SendNotification(ctx context.Context, input *SendNotificationInput) (*Notification, error) {
	// Check user settings
	settings, err := s.notificationRepo.GetUserSettings(ctx, input.UserID)
	if err != nil {
		s.logger.Warnw("Failed to get user settings, using defaults", "error", err, "user_id", input.UserID)
	}

	// Check if channel is enabled
	if settings != nil && !s.isChannelEnabled(settings, input.Channel) {
		s.logger.Infow("Channel disabled for user", "channel", input.Channel, "user_id", input.UserID)
		return nil, nil
	}

	// Process template if provided
	title := input.Title
	content := input.Content
	if input.TemplateID != "" {
		templateID, err := uuid.Parse(input.TemplateID)
		if err == nil {
			tmpl, err := s.templateRepo.GetByID(ctx, templateID)
			if err == nil {
				title, content = s.renderTemplate(tmpl, input.Data)
			}
		}
	}

	// Create notification record
	notification := &repository.NotificationModel{
		ID:        uuid.New(),
		UserID:    input.UserID,
		Channel:   input.Channel,
		Title:     title,
		Content:   content,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	if input.TemplateID != "" {
		templateID, _ := uuid.Parse(input.TemplateID)
		notification.TemplateID = &templateID
	}

	if len(input.Data) > 0 {
		dataJSON, _ := json.Marshal(input.Data)
		notification.Data = dataJSON
	}

	if err := s.notificationRepo.Create(ctx, notification); err != nil {
		return nil, err
	}

	// Send notification asynchronously
	go s.sendAsync(context.Background(), notification, title, content)

	return &Notification{
		ID:        notification.ID,
		UserID:    notification.UserID,
		Channel:   notification.Channel,
		Title:     title,
		Content:   content,
		Status:    notification.Status,
		CreatedAt: notification.CreatedAt,
	}, nil
}

func (s *NotificationService) sendAsync(ctx context.Context, notification *repository.NotificationModel, title, content string) {
	var err error

	switch notification.Channel {
	case "email":
		// Get user email from user-service (placeholder)
		email := "user@example.com" // TODO: Fetch from user-service
		err = s.emailSender.Send(ctx, email, title, content)
	case "push":
		// Get device tokens
		tokens, _ := s.notificationRepo.GetDeviceTokens(ctx, notification.UserID)
		for _, token := range tokens {
			if sendErr := s.pushSender.Send(ctx, token, title, content, nil); sendErr != nil {
				s.logger.Errorw("Failed to send push notification", "error", sendErr, "token", token)
			}
		}
	case "sms":
		// Get user phone from user-service (placeholder)
		phone := "+821012345678" // TODO: Fetch from user-service
		err = s.smsSender.Send(ctx, phone, content)
	}

	// Update notification status
	status := "sent"
	var errorMessage *string
	if err != nil {
		status = "failed"
		errMsg := err.Error()
		errorMessage = &errMsg
	}

	now := time.Now()
	s.notificationRepo.UpdateStatus(ctx, notification.ID, status, &now, errorMessage)
}

func (s *NotificationService) isChannelEnabled(settings *repository.UserSettingsModel, channel string) bool {
	switch channel {
	case "email":
		return settings.EmailEnabled
	case "push":
		return settings.PushEnabled
	case "sms":
		return settings.SMSEnabled
	}
	return true
}

func (s *NotificationService) renderTemplate(tmpl *repository.TemplateModel, data map[string]string) (string, string) {
	title := tmpl.SubjectTemplate
	content := tmpl.BodyTemplate

	if data != nil {
		if t, err := template.New("subject").Parse(tmpl.SubjectTemplate); err == nil {
			var buf bytes.Buffer
			if err := t.Execute(&buf, data); err == nil {
				title = buf.String()
			}
		}

		if t, err := template.New("body").Parse(tmpl.BodyTemplate); err == nil {
			var buf bytes.Buffer
			if err := t.Execute(&buf, data); err == nil {
				content = buf.String()
			}
		}
	}

	return title, content
}

// GetNotification retrieves a notification by ID
func (s *NotificationService) GetNotification(ctx context.Context, id uuid.UUID) (*Notification, error) {
	model, err := s.notificationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.modelToNotification(model), nil
}

// ListNotifications lists notifications for a user
func (s *NotificationService) ListNotifications(ctx context.Context, userID uuid.UUID, page, pageSize int) ([]*Notification, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	models, total, err := s.notificationRepo.ListByUserID(ctx, userID, offset, pageSize)
	if err != nil {
		return nil, 0, err
	}

	notifications := make([]*Notification, len(models))
	for i, m := range models {
		notifications[i] = s.modelToNotification(m)
	}

	return notifications, total, nil
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	return s.notificationRepo.MarkAsRead(ctx, id)
}

// GetUnreadCount returns the count of unread notifications for a user
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.notificationRepo.GetUnreadCount(ctx, userID)
}

// UpdateSettings updates user notification settings
func (s *NotificationService) UpdateSettings(ctx context.Context, userID uuid.UUID, settings *NotificationSettings) error {
	model := &repository.UserSettingsModel{
		UserID:             userID,
		EmailEnabled:       settings.EmailEnabled,
		PushEnabled:        settings.PushEnabled,
		SMSEnabled:         settings.SMSEnabled,
		DisabledEventTypes: settings.DisabledEventTypes,
	}
	return s.notificationRepo.UpsertUserSettings(ctx, model)
}

// RegisterDevice registers a device token for push notifications
func (s *NotificationService) RegisterDevice(ctx context.Context, userID uuid.UUID, deviceType, token string) error {
	return s.notificationRepo.UpsertDeviceToken(ctx, userID, deviceType, token)
}

// ProcessEvent processes an event from Kafka and sends appropriate notifications
func (s *NotificationService) ProcessEvent(ctx context.Context, eventType string, payload []byte) error {
	s.logger.Infow("Processing event", "event_type", eventType)

	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err != nil {
		return err
	}

	// Get template for event type
	templates, err := s.templateRepo.GetByEventType(ctx, eventType)
	if err != nil {
		s.logger.Warnw("No templates found for event", "event_type", eventType)
		return nil
	}

	// Extract user ID from payload
	userIDStr, ok := data["user_id"].(string)
	if !ok {
		s.logger.Warnw("No user_id in event payload", "event_type", eventType)
		return nil
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return err
	}

	// Convert data to string map for template rendering
	stringData := make(map[string]string)
	for k, v := range data {
		if str, ok := v.(string); ok {
			stringData[k] = str
		}
	}

	// Send notification for each channel template
	for _, tmpl := range templates {
		if !tmpl.IsActive {
			continue
		}

		_, err := s.SendNotification(ctx, &SendNotificationInput{
			UserID:     userID,
			Channel:    tmpl.Channel,
			TemplateID: tmpl.ID.String(),
			Data:       stringData,
		})
		if err != nil {
			s.logger.Errorw("Failed to send notification", "error", err, "template_id", tmpl.ID)
		}
	}

	return nil
}

func (s *NotificationService) modelToNotification(m *repository.NotificationModel) *Notification {
	n := &Notification{
		ID:        m.ID,
		UserID:    m.UserID,
		Channel:   m.Channel,
		Title:     m.Title,
		Content:   m.Content,
		Status:    m.Status,
		CreatedAt: m.CreatedAt,
	}
	if m.TemplateID != nil {
		n.TemplateID = m.TemplateID
	}
	if m.SentAt != nil {
		n.SentAt = m.SentAt
	}
	if m.ReadAt != nil {
		n.ReadAt = m.ReadAt
	}
	if m.ErrorMessage != nil {
		n.ErrorMessage = m.ErrorMessage
	}
	if m.Data != nil {
		json.Unmarshal(m.Data, &n.Data)
	}
	return n
}
