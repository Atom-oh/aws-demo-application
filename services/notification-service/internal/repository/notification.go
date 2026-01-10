package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NotificationModel represents a notification in the database
type NotificationModel struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	TemplateID   *uuid.UUID
	Channel      string
	Title        string
	Content      string
	Data         []byte
	Status       string
	SentAt       *time.Time
	ReadAt       *time.Time
	ErrorMessage *string
	CreatedAt    time.Time
}

// UserSettingsModel represents user notification settings
type UserSettingsModel struct {
	ID                 uuid.UUID
	UserID             uuid.UUID
	EmailEnabled       bool
	PushEnabled        bool
	SMSEnabled         bool
	DisabledEventTypes []string
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// DeviceTokenModel represents a device token for push notifications
type DeviceTokenModel struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	DeviceType string
	Token      string
	IsActive   bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// NotificationRepository handles notification database operations
type NotificationRepository struct {
	db *pgxpool.Pool
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(db *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// Create creates a new notification
func (r *NotificationRepository) Create(ctx context.Context, notification *NotificationModel) error {
	query := `
		INSERT INTO notifications (id, user_id, template_id, channel, title, content, data, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.db.Exec(ctx, query,
		notification.ID,
		notification.UserID,
		notification.TemplateID,
		notification.Channel,
		notification.Title,
		notification.Content,
		notification.Data,
		notification.Status,
		notification.CreatedAt,
	)
	return err
}

// GetByID retrieves a notification by ID
func (r *NotificationRepository) GetByID(ctx context.Context, id uuid.UUID) (*NotificationModel, error) {
	query := `
		SELECT id, user_id, template_id, channel, title, content, data, status, sent_at, read_at, error_message, created_at
		FROM notifications
		WHERE id = $1
	`
	row := r.db.QueryRow(ctx, query, id)

	var n NotificationModel
	err := row.Scan(
		&n.ID, &n.UserID, &n.TemplateID, &n.Channel, &n.Title, &n.Content,
		&n.Data, &n.Status, &n.SentAt, &n.ReadAt, &n.ErrorMessage, &n.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &n, nil
}

// ListByUserID lists notifications for a user with pagination
func (r *NotificationRepository) ListByUserID(ctx context.Context, userID uuid.UUID, offset, limit int) ([]*NotificationModel, int, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM notifications WHERE user_id = $1`
	var total int
	if err := r.db.QueryRow(ctx, countQuery, userID).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Get notifications
	query := `
		SELECT id, user_id, template_id, channel, title, content, data, status, sent_at, read_at, error_message, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var notifications []*NotificationModel
	for rows.Next() {
		var n NotificationModel
		if err := rows.Scan(
			&n.ID, &n.UserID, &n.TemplateID, &n.Channel, &n.Title, &n.Content,
			&n.Data, &n.Status, &n.SentAt, &n.ReadAt, &n.ErrorMessage, &n.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		notifications = append(notifications, &n)
	}

	return notifications, total, nil
}

// UpdateStatus updates the status of a notification
func (r *NotificationRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string, sentAt *time.Time, errorMessage *string) error {
	query := `
		UPDATE notifications
		SET status = $2, sent_at = $3, error_message = $4
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, id, status, sentAt, errorMessage)
	return err
}

// MarkAsRead marks a notification as read
func (r *NotificationRepository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE notifications
		SET read_at = $2, status = 'read'
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, id, time.Now())
	return err
}

// GetUnreadCount returns the count of unread notifications for a user
func (r *NotificationRepository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM notifications
		WHERE user_id = $1 AND read_at IS NULL AND status = 'sent'
	`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}

// GetUserSettings retrieves user notification settings
func (r *NotificationRepository) GetUserSettings(ctx context.Context, userID uuid.UUID) (*UserSettingsModel, error) {
	query := `
		SELECT id, user_id, email_enabled, push_enabled, sms_enabled, disabled_event_types, created_at, updated_at
		FROM user_notification_settings
		WHERE user_id = $1
	`
	row := r.db.QueryRow(ctx, query, userID)

	var s UserSettingsModel
	err := row.Scan(
		&s.ID, &s.UserID, &s.EmailEnabled, &s.PushEnabled, &s.SMSEnabled,
		&s.DisabledEventTypes, &s.CreatedAt, &s.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		// Return default settings
		return &UserSettingsModel{
			UserID:       userID,
			EmailEnabled: true,
			PushEnabled:  true,
			SMSEnabled:   false,
		}, nil
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// UpsertUserSettings creates or updates user notification settings
func (r *NotificationRepository) UpsertUserSettings(ctx context.Context, settings *UserSettingsModel) error {
	query := `
		INSERT INTO user_notification_settings (id, user_id, email_enabled, push_enabled, sms_enabled, disabled_event_types, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			email_enabled = EXCLUDED.email_enabled,
			push_enabled = EXCLUDED.push_enabled,
			sms_enabled = EXCLUDED.sms_enabled,
			disabled_event_types = EXCLUDED.disabled_event_types,
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.db.Exec(ctx, query,
		uuid.New(),
		settings.UserID,
		settings.EmailEnabled,
		settings.PushEnabled,
		settings.SMSEnabled,
		settings.DisabledEventTypes,
		time.Now(),
	)
	return err
}

// GetDeviceTokens retrieves device tokens for a user
func (r *NotificationRepository) GetDeviceTokens(ctx context.Context, userID uuid.UUID) ([]string, error) {
	query := `
		SELECT token
		FROM device_tokens
		WHERE user_id = $1 AND is_active = true
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tokens []string
	for rows.Next() {
		var token string
		if err := rows.Scan(&token); err != nil {
			return nil, err
		}
		tokens = append(tokens, token)
	}

	return tokens, nil
}

// UpsertDeviceToken creates or updates a device token
func (r *NotificationRepository) UpsertDeviceToken(ctx context.Context, userID uuid.UUID, deviceType, token string) error {
	query := `
		INSERT INTO device_tokens (id, user_id, device_type, token, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, true, $5, $5)
		ON CONFLICT (user_id, token) DO UPDATE SET
			device_type = EXCLUDED.device_type,
			is_active = true,
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.db.Exec(ctx, query, uuid.New(), userID, deviceType, token, time.Now())
	return err
}

// DeactivateDeviceToken deactivates a device token
func (r *NotificationRepository) DeactivateDeviceToken(ctx context.Context, token string) error {
	query := `UPDATE device_tokens SET is_active = false, updated_at = $2 WHERE token = $1`
	_, err := r.db.Exec(ctx, query, token, time.Now())
	return err
}
