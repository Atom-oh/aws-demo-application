package sender

import (
	"context"
	"fmt"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

// PushSender sends push notifications via Firebase Cloud Messaging
type PushSender struct {
	client          *messaging.Client
	credentialsPath string
}

// NewPushSender creates a new push notification sender
func NewPushSender(credentialsPath string) *PushSender {
	return &PushSender{
		credentialsPath: credentialsPath,
	}
}

// Initialize initializes the Firebase client
func (s *PushSender) Initialize(ctx context.Context) error {
	opt := option.WithCredentialsFile(s.credentialsPath)
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return fmt.Errorf("failed to initialize Firebase app: %w", err)
	}

	client, err := app.Messaging(ctx)
	if err != nil {
		return fmt.Errorf("failed to get messaging client: %w", err)
	}

	s.client = client
	return nil
}

// Send sends a push notification to a single device
func (s *PushSender) Send(ctx context.Context, token, title, body string, data map[string]string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	message := &messaging.Message{
		Token: token,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: data,
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Sound:       "default",
				ClickAction: "OPEN_ACTIVITY",
			},
		},
		APNS: &messaging.APNSConfig{
			Payload: &messaging.APNSPayload{
				Aps: &messaging.Aps{
					Sound:            "default",
					ContentAvailable: true,
				},
			},
		},
	}

	_, err := s.client.Send(ctx, message)
	if err != nil {
		return fmt.Errorf("failed to send push notification: %w", err)
	}

	return nil
}

// SendMulticast sends a push notification to multiple devices
func (s *PushSender) SendMulticast(ctx context.Context, tokens []string, title, body string, data map[string]string) (*messaging.BatchResponse, error) {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return nil, err
		}
	}

	message := &messaging.MulticastMessage{
		Tokens: tokens,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: data,
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				Sound:       "default",
				ClickAction: "OPEN_ACTIVITY",
			},
		},
		APNS: &messaging.APNSConfig{
			Payload: &messaging.APNSPayload{
				Aps: &messaging.Aps{
					Sound:            "default",
					ContentAvailable: true,
				},
			},
		},
	}

	response, err := s.client.SendEachForMulticast(ctx, message)
	if err != nil {
		return nil, fmt.Errorf("failed to send multicast push notification: %w", err)
	}

	return response, nil
}

// SendToTopic sends a push notification to a topic
func (s *PushSender) SendToTopic(ctx context.Context, topic, title, body string, data map[string]string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	message := &messaging.Message{
		Topic: topic,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: data,
	}

	_, err := s.client.Send(ctx, message)
	if err != nil {
		return fmt.Errorf("failed to send topic push notification: %w", err)
	}

	return nil
}

// SubscribeToTopic subscribes tokens to a topic
func (s *PushSender) SubscribeToTopic(ctx context.Context, tokens []string, topic string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	_, err := s.client.SubscribeToTopic(ctx, tokens, topic)
	if err != nil {
		return fmt.Errorf("failed to subscribe to topic: %w", err)
	}

	return nil
}

// UnsubscribeFromTopic unsubscribes tokens from a topic
func (s *PushSender) UnsubscribeFromTopic(ctx context.Context, tokens []string, topic string) error {
	// Lazy initialization
	if s.client == nil {
		if err := s.Initialize(ctx); err != nil {
			return err
		}
	}

	_, err := s.client.UnsubscribeFromTopic(ctx, tokens, topic)
	if err != nil {
		return fmt.Errorf("failed to unsubscribe from topic: %w", err)
	}

	return nil
}
