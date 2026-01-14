package sender

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sns/types"
)

// SMSSender sends SMS messages via AWS SNS
type SMSSender struct {
	client *sns.Client
	region string
}

// NewSMSSender creates a new SMS sender
func NewSMSSender(region string) *SMSSender {
	return &SMSSender{
		region: region,
	}
}

// Initialize initializes the SNS client
func (s *SMSSender) Initialize(ctx context.Context) error {
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(s.region))
	if err != nil {
		return fmt.Errorf("failed to load AWS config: %w", err)
	}

	s.client = sns.NewFromConfig(cfg)
	return nil
}

// Send sends an SMS message
func (s *SMSSender) Send(ctx context.Context, phoneNumber, message string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	input := &sns.PublishInput{
		PhoneNumber: aws.String(phoneNumber),
		Message:     aws.String(message),
		MessageAttributes: map[string]types.MessageAttributeValue{
			"AWS.SNS.SMS.SMSType": {
				DataType:    aws.String("String"),
				StringValue: aws.String("Transactional"),
			},
			"AWS.SNS.SMS.SenderID": {
				DataType:    aws.String("String"),
				StringValue: aws.String("HireHub"),
			},
		},
	}

	_, err := s.client.Publish(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to send SMS: %w", err)
	}

	return nil
}

// SendBatch sends SMS messages to multiple recipients
func (s *SMSSender) SendBatch(ctx context.Context, phoneNumbers []string, message string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	for _, phoneNumber := range phoneNumbers {
		if err := s.Send(ctx, phoneNumber, message); err != nil {
			// Log error but continue with other recipients
			fmt.Printf("Failed to send SMS to %s: %v\n", phoneNumber, err)
		}
	}

	return nil
}

// SendToTopic sends an SMS to all subscribers of a topic
func (s *SMSSender) SendToTopic(ctx context.Context, topicArn, message string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	input := &sns.PublishInput{
		TopicArn: aws.String(topicArn),
		Message:  aws.String(message),
		MessageAttributes: map[string]types.MessageAttributeValue{
			"AWS.SNS.SMS.SMSType": {
				DataType:    aws.String("String"),
				StringValue: aws.String("Transactional"),
			},
		},
	}

	_, err := s.client.Publish(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to send SMS to topic: %w", err)
	}

	return nil
}

// CreateTopic creates an SNS topic for SMS subscriptions
func (s *SMSSender) CreateTopic(ctx context.Context, name string) (string, error) {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return "", err
		}
	}

	input := &sns.CreateTopicInput{
		Name: aws.String(name),
	}

	result, err := s.client.CreateTopic(ctx, input)
	if err != nil {
		return "", fmt.Errorf("failed to create topic: %w", err)
	}

	return *result.TopicArn, nil
}

// SubscribePhone subscribes a phone number to a topic
func (s *SMSSender) SubscribePhone(ctx context.Context, topicArn, phoneNumber string) (string, error) {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return "", err
		}
	}

	input := &sns.SubscribeInput{
		Protocol: aws.String("sms"),
		TopicArn: aws.String(topicArn),
		Endpoint: aws.String(phoneNumber),
	}

	result, err := s.client.Subscribe(ctx, input)
	if err != nil {
		return "", fmt.Errorf("failed to subscribe phone: %w", err)
	}

	return *result.SubscriptionArn, nil
}

// Unsubscribe removes a subscription
func (s *SMSSender) Unsubscribe(ctx context.Context, subscriptionArn string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	input := &sns.UnsubscribeInput{
		SubscriptionArn: aws.String(subscriptionArn),
	}

	_, err := s.client.Unsubscribe(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to unsubscribe: %w", err)
	}

	return nil
}
