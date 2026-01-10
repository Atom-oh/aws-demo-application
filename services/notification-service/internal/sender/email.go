package sender

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
)

// EmailSender sends emails via AWS SES
type EmailSender struct {
	client      *ses.Client
	senderEmail string
	region      string
}

// NewEmailSender creates a new email sender
func NewEmailSender(region, senderEmail string) *EmailSender {
	return &EmailSender{
		region:      region,
		senderEmail: senderEmail,
	}
}

// Initialize initializes the SES client
func (s *EmailSender) Initialize(ctx context.Context) error {
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(s.region))
	if err != nil {
		return fmt.Errorf("failed to load AWS config: %w", err)
	}

	s.client = ses.NewFromConfig(cfg)
	return nil
}

// Send sends an email
func (s *EmailSender) Send(ctx context.Context, to, subject, body string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	input := &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{to},
		},
		Message: &types.Message{
			Subject: &types.Content{
				Charset: aws.String("UTF-8"),
				Data:    aws.String(subject),
			},
			Body: &types.Body{
				Html: &types.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(body),
				},
				Text: &types.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(body),
				},
			},
		},
		Source: aws.String(s.senderEmail),
	}

	_, err := s.client.SendEmail(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

// SendBatch sends emails to multiple recipients
func (s *EmailSender) SendBatch(ctx context.Context, recipients []string, subject, body string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	input := &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: recipients,
		},
		Message: &types.Message{
			Subject: &types.Content{
				Charset: aws.String("UTF-8"),
				Data:    aws.String(subject),
			},
			Body: &types.Body{
				Html: &types.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(body),
				},
			},
		},
		Source: aws.String(s.senderEmail),
	}

	_, err := s.client.SendEmail(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to send batch email: %w", err)
	}

	return nil
}

// SendTemplated sends an email using an SES template
func (s *EmailSender) SendTemplated(ctx context.Context, to, templateName string, templateData map[string]string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	// Convert template data to JSON string
	templateDataJSON := "{"
	first := true
	for k, v := range templateData {
		if !first {
			templateDataJSON += ","
		}
		templateDataJSON += fmt.Sprintf(`"%s":"%s"`, k, v)
		first = false
	}
	templateDataJSON += "}"

	input := &ses.SendTemplatedEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{to},
		},
		Source:       aws.String(s.senderEmail),
		Template:     aws.String(templateName),
		TemplateData: aws.String(templateDataJSON),
	}

	_, err := s.client.SendTemplatedEmail(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to send templated email: %w", err)
	}

	return nil
}
