package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/hirehub/notification-service/internal/repository"
)

// Template represents a notification template
type Template struct {
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

// CreateTemplateInput represents input for creating a template
type CreateTemplateInput struct {
	Name            string
	EventType       string
	Channel         string
	SubjectTemplate string
	BodyTemplate    string
}

// UpdateTemplateInput represents input for updating a template
type UpdateTemplateInput struct {
	Name            *string
	SubjectTemplate *string
	BodyTemplate    *string
	IsActive        *bool
}

// TemplateService handles template business logic
type TemplateService struct {
	templateRepo *repository.TemplateRepository
	logger       *zap.SugaredLogger
}

// NewTemplateService creates a new template service
func NewTemplateService(templateRepo *repository.TemplateRepository, logger *zap.SugaredLogger) *TemplateService {
	return &TemplateService{
		templateRepo: templateRepo,
		logger:       logger,
	}
}

// CreateTemplate creates a new notification template
func (s *TemplateService) CreateTemplate(ctx context.Context, input *CreateTemplateInput) (*Template, error) {
	model := &repository.TemplateModel{
		ID:              uuid.New(),
		Name:            input.Name,
		EventType:       input.EventType,
		Channel:         input.Channel,
		SubjectTemplate: input.SubjectTemplate,
		BodyTemplate:    input.BodyTemplate,
		IsActive:        true,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.templateRepo.Create(ctx, model); err != nil {
		return nil, err
	}

	return s.modelToTemplate(model), nil
}

// GetTemplate retrieves a template by ID
func (s *TemplateService) GetTemplate(ctx context.Context, id uuid.UUID) (*Template, error) {
	model, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return s.modelToTemplate(model), nil
}

// GetTemplateByName retrieves a template by name
func (s *TemplateService) GetTemplateByName(ctx context.Context, name string) (*Template, error) {
	model, err := s.templateRepo.GetByName(ctx, name)
	if err != nil {
		return nil, err
	}
	return s.modelToTemplate(model), nil
}

// ListTemplates lists all templates
func (s *TemplateService) ListTemplates(ctx context.Context) ([]*Template, error) {
	models, err := s.templateRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	templates := make([]*Template, len(models))
	for i, m := range models {
		templates[i] = s.modelToTemplate(m)
	}

	return templates, nil
}

// ListTemplatesByEventType lists templates by event type
func (s *TemplateService) ListTemplatesByEventType(ctx context.Context, eventType string) ([]*Template, error) {
	models, err := s.templateRepo.GetByEventType(ctx, eventType)
	if err != nil {
		return nil, err
	}

	templates := make([]*Template, len(models))
	for i, m := range models {
		templates[i] = s.modelToTemplate(m)
	}

	return templates, nil
}

// UpdateTemplate updates an existing template
func (s *TemplateService) UpdateTemplate(ctx context.Context, id uuid.UUID, input *UpdateTemplateInput) (*Template, error) {
	model, err := s.templateRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if input.Name != nil {
		model.Name = *input.Name
	}
	if input.SubjectTemplate != nil {
		model.SubjectTemplate = *input.SubjectTemplate
	}
	if input.BodyTemplate != nil {
		model.BodyTemplate = *input.BodyTemplate
	}
	if input.IsActive != nil {
		model.IsActive = *input.IsActive
	}
	model.UpdatedAt = time.Now()

	if err := s.templateRepo.Update(ctx, model); err != nil {
		return nil, err
	}

	return s.modelToTemplate(model), nil
}

// DeleteTemplate deletes a template by ID
func (s *TemplateService) DeleteTemplate(ctx context.Context, id uuid.UUID) error {
	return s.templateRepo.Delete(ctx, id)
}

// ActivateTemplate activates a template
func (s *TemplateService) ActivateTemplate(ctx context.Context, id uuid.UUID) error {
	return s.templateRepo.SetActive(ctx, id, true)
}

// DeactivateTemplate deactivates a template
func (s *TemplateService) DeactivateTemplate(ctx context.Context, id uuid.UUID) error {
	return s.templateRepo.SetActive(ctx, id, false)
}

func (s *TemplateService) modelToTemplate(m *repository.TemplateModel) *Template {
	return &Template{
		ID:              m.ID,
		Name:            m.Name,
		EventType:       m.EventType,
		Channel:         m.Channel,
		SubjectTemplate: m.SubjectTemplate,
		BodyTemplate:    m.BodyTemplate,
		IsActive:        m.IsActive,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
}
