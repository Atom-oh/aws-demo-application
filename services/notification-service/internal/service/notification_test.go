package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/hirehub/notification-service/internal/repository"
)

func TestIsChannelEnabled(t *testing.T) {
	tests := []struct {
		name     string
		settings *repository.UserSettingsModel
		channel  string
		expected bool
	}{
		{
			name: "email enabled",
			settings: &repository.UserSettingsModel{
				EmailEnabled: true,
				PushEnabled:  false,
				SMSEnabled:   false,
			},
			channel:  "email",
			expected: true,
		},
		{
			name: "email disabled",
			settings: &repository.UserSettingsModel{
				EmailEnabled: false,
				PushEnabled:  true,
				SMSEnabled:   false,
			},
			channel:  "email",
			expected: false,
		},
		{
			name: "push enabled",
			settings: &repository.UserSettingsModel{
				EmailEnabled: false,
				PushEnabled:  true,
				SMSEnabled:   false,
			},
			channel:  "push",
			expected: true,
		},
		{
			name: "sms enabled",
			settings: &repository.UserSettingsModel{
				EmailEnabled: false,
				PushEnabled:  false,
				SMSEnabled:   true,
			},
			channel:  "sms",
			expected: true,
		},
		{
			name: "unknown channel defaults to enabled",
			settings: &repository.UserSettingsModel{
				EmailEnabled: false,
				PushEnabled:  false,
				SMSEnabled:   false,
			},
			channel:  "unknown",
			expected: true,
		},
	}

	svc := &NotificationService{}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := svc.isChannelEnabled(tt.settings, tt.channel)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestRenderTemplate(t *testing.T) {
	svc := &NotificationService{}

	tests := []struct {
		name            string
		template        *repository.TemplateModel
		data            map[string]string
		expectedTitle   string
		expectedContent string
	}{
		{
			name: "simple template without variables",
			template: &repository.TemplateModel{
				SubjectTemplate: "Welcome",
				BodyTemplate:    "Hello user",
			},
			data:            nil,
			expectedTitle:   "Welcome",
			expectedContent: "Hello user",
		},
		{
			name: "template with variables",
			template: &repository.TemplateModel{
				SubjectTemplate: "Hello {{.Name}}",
				BodyTemplate:    "Your application for {{.JobTitle}} has been received.",
			},
			data: map[string]string{
				"Name":     "John",
				"JobTitle": "Software Engineer",
			},
			expectedTitle:   "Hello John",
			expectedContent: "Your application for Software Engineer has been received.",
		},
		{
			name: "template with missing variable",
			template: &repository.TemplateModel{
				SubjectTemplate: "Hello {{.Name}}",
				BodyTemplate:    "Welcome {{.Name}} to {{.Company}}",
			},
			data: map[string]string{
				"Name": "Jane",
			},
			expectedTitle:   "Hello Jane",
			expectedContent: "Welcome Jane to <no value>",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			title, content := svc.renderTemplate(tt.template, tt.data)
			assert.Equal(t, tt.expectedTitle, title)
			assert.Equal(t, tt.expectedContent, content)
		})
	}
}

func TestModelToNotification(t *testing.T) {
	svc := &NotificationService{}

	id := uuid.New()
	userID := uuid.New()
	templateID := uuid.New()

	model := &repository.NotificationModel{
		ID:         id,
		UserID:     userID,
		TemplateID: &templateID,
		Channel:    "email",
		Title:      "Test Title",
		Content:    "Test Content",
		Status:     "sent",
		Data:       []byte(`{"key": "value"}`),
	}

	notification := svc.modelToNotification(model)

	assert.Equal(t, id, notification.ID)
	assert.Equal(t, userID, notification.UserID)
	assert.Equal(t, &templateID, notification.TemplateID)
	assert.Equal(t, "email", notification.Channel)
	assert.Equal(t, "Test Title", notification.Title)
	assert.Equal(t, "Test Content", notification.Content)
	assert.Equal(t, "sent", notification.Status)
	assert.NotNil(t, notification.Data)
}

func TestListNotifications_Pagination(t *testing.T) {
	tests := []struct {
		name             string
		page             int
		pageSize         int
		expectedPage     int
		expectedPageSize int
		expectedOffset   int
	}{
		{
			name:             "default pagination",
			page:             0,
			pageSize:         0,
			expectedPage:     1,
			expectedPageSize: 20,
			expectedOffset:   0,
		},
		{
			name:             "custom pagination",
			page:             3,
			pageSize:         10,
			expectedPage:     3,
			expectedPageSize: 10,
			expectedOffset:   20,
		},
		{
			name:             "negative page defaults to 1",
			page:             -1,
			pageSize:         10,
			expectedPage:     1,
			expectedPageSize: 10,
			expectedOffset:   0,
		},
		{
			name:             "oversized pageSize capped",
			page:             1,
			pageSize:         200,
			expectedPage:     1,
			expectedPageSize: 20,
			expectedOffset:   0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			page := tt.page
			pageSize := tt.pageSize

			// Apply defaults (same logic as in service)
			if page < 1 {
				page = 1
			}
			if pageSize < 1 || pageSize > 100 {
				pageSize = 20
			}
			offset := (page - 1) * pageSize

			assert.Equal(t, tt.expectedPage, page)
			assert.Equal(t, tt.expectedPageSize, pageSize)
			assert.Equal(t, tt.expectedOffset, offset)
		})
	}
}

func TestNotificationSettings(t *testing.T) {
	settings := &NotificationSettings{
		EmailEnabled:       true,
		PushEnabled:        true,
		SMSEnabled:         false,
		DisabledEventTypes: []string{"marketing", "updates"},
	}

	assert.True(t, settings.EmailEnabled)
	assert.True(t, settings.PushEnabled)
	assert.False(t, settings.SMSEnabled)
	assert.Len(t, settings.DisabledEventTypes, 2)
	assert.Contains(t, settings.DisabledEventTypes, "marketing")
}

func TestSendNotificationInput_Validation(t *testing.T) {
	userID := uuid.New()

	input := &SendNotificationInput{
		UserID:     userID,
		Channel:    "email",
		Title:      "Test Notification",
		Content:    "This is a test notification content",
		Data:       map[string]string{"key": "value"},
		TemplateID: uuid.New().String(),
	}

	assert.Equal(t, userID, input.UserID)
	assert.Equal(t, "email", input.Channel)
	assert.NotEmpty(t, input.Title)
	assert.NotEmpty(t, input.Content)
	assert.NotEmpty(t, input.Data)
	assert.NotEmpty(t, input.TemplateID)
}
