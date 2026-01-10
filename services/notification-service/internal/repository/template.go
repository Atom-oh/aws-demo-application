package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// TemplateModel represents a notification template in the database
type TemplateModel struct {
	ID              uuid.UUID
	Name            string
	EventType       string
	Channel         string
	SubjectTemplate string
	BodyTemplate    string
	IsActive        bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// TemplateRepository handles template database operations
type TemplateRepository struct {
	db *pgxpool.Pool
}

// NewTemplateRepository creates a new template repository
func NewTemplateRepository(db *pgxpool.Pool) *TemplateRepository {
	return &TemplateRepository{db: db}
}

// Create creates a new notification template
func (r *TemplateRepository) Create(ctx context.Context, template *TemplateModel) error {
	query := `
		INSERT INTO notification_templates (id, name, event_type, channel, subject_template, body_template, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.db.Exec(ctx, query,
		template.ID,
		template.Name,
		template.EventType,
		template.Channel,
		template.SubjectTemplate,
		template.BodyTemplate,
		template.IsActive,
		template.CreatedAt,
		template.UpdatedAt,
	)
	return err
}

// GetByID retrieves a template by ID
func (r *TemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*TemplateModel, error) {
	query := `
		SELECT id, name, event_type, channel, subject_template, body_template, is_active, created_at, updated_at
		FROM notification_templates
		WHERE id = $1
	`
	row := r.db.QueryRow(ctx, query, id)

	var t TemplateModel
	err := row.Scan(
		&t.ID, &t.Name, &t.EventType, &t.Channel, &t.SubjectTemplate,
		&t.BodyTemplate, &t.IsActive, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// GetByName retrieves a template by name
func (r *TemplateRepository) GetByName(ctx context.Context, name string) (*TemplateModel, error) {
	query := `
		SELECT id, name, event_type, channel, subject_template, body_template, is_active, created_at, updated_at
		FROM notification_templates
		WHERE name = $1
	`
	row := r.db.QueryRow(ctx, query, name)

	var t TemplateModel
	err := row.Scan(
		&t.ID, &t.Name, &t.EventType, &t.Channel, &t.SubjectTemplate,
		&t.BodyTemplate, &t.IsActive, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

// GetByEventType retrieves templates by event type
func (r *TemplateRepository) GetByEventType(ctx context.Context, eventType string) ([]*TemplateModel, error) {
	query := `
		SELECT id, name, event_type, channel, subject_template, body_template, is_active, created_at, updated_at
		FROM notification_templates
		WHERE event_type = $1 AND is_active = true
	`
	rows, err := r.db.Query(ctx, query, eventType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []*TemplateModel
	for rows.Next() {
		var t TemplateModel
		if err := rows.Scan(
			&t.ID, &t.Name, &t.EventType, &t.Channel, &t.SubjectTemplate,
			&t.BodyTemplate, &t.IsActive, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		templates = append(templates, &t)
	}

	return templates, nil
}

// List retrieves all templates
func (r *TemplateRepository) List(ctx context.Context) ([]*TemplateModel, error) {
	query := `
		SELECT id, name, event_type, channel, subject_template, body_template, is_active, created_at, updated_at
		FROM notification_templates
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []*TemplateModel
	for rows.Next() {
		var t TemplateModel
		if err := rows.Scan(
			&t.ID, &t.Name, &t.EventType, &t.Channel, &t.SubjectTemplate,
			&t.BodyTemplate, &t.IsActive, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		templates = append(templates, &t)
	}

	return templates, nil
}

// Update updates a template
func (r *TemplateRepository) Update(ctx context.Context, template *TemplateModel) error {
	query := `
		UPDATE notification_templates
		SET name = $2, subject_template = $3, body_template = $4, is_active = $5, updated_at = $6
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query,
		template.ID,
		template.Name,
		template.SubjectTemplate,
		template.BodyTemplate,
		template.IsActive,
		template.UpdatedAt,
	)
	return err
}

// Delete deletes a template
func (r *TemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM notification_templates WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// SetActive sets the active status of a template
func (r *TemplateRepository) SetActive(ctx context.Context, id uuid.UUID, isActive bool) error {
	query := `UPDATE notification_templates SET is_active = $2, updated_at = $3 WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id, isActive, time.Now())
	return err
}
