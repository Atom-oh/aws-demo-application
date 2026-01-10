package kafka

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
)

// Producer represents a Kafka producer
type Producer struct {
	writer *kafka.Writer
	logger *zap.SugaredLogger
}

// NewProducer creates a new Kafka producer
func NewProducer(brokers []string, logger *zap.SugaredLogger) *Producer {
	writer := &kafka.Writer{
		Addr:         kafka.TCP(brokers...),
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: kafka.RequireAll,
		Async:        false,
	}

	return &Producer{
		writer: writer,
		logger: logger,
	}
}

// PublishEvent publishes an event to a Kafka topic
func (p *Producer) PublishEvent(ctx context.Context, topic string, key string, payload interface{}) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	msg := kafka.Message{
		Topic: topic,
		Key:   []byte(key),
		Value: data,
		Headers: []kafka.Header{
			{Key: "event_id", Value: []byte(uuid.New().String())},
			{Key: "timestamp", Value: []byte(time.Now().UTC().Format(time.RFC3339))},
		},
	}

	if err := p.writer.WriteMessages(ctx, msg); err != nil {
		p.logger.Errorw("Failed to publish event",
			"error", err,
			"topic", topic,
			"key", key,
		)
		return err
	}

	p.logger.Infow("Published event",
		"topic", topic,
		"key", key,
	)

	return nil
}

// PublishNotificationSent publishes a notification.sent event
func (p *Producer) PublishNotificationSent(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID, channel string) error {
	payload := map[string]interface{}{
		"notification_id": notificationID.String(),
		"user_id":         userID.String(),
		"channel":         channel,
		"sent_at":         time.Now().UTC().Format(time.RFC3339),
	}

	return p.PublishEvent(ctx, "notification.sent", notificationID.String(), payload)
}

// PublishNotificationFailed publishes a notification.failed event
func (p *Producer) PublishNotificationFailed(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID, channel string, errorMsg string) error {
	payload := map[string]interface{}{
		"notification_id": notificationID.String(),
		"user_id":         userID.String(),
		"channel":         channel,
		"error":           errorMsg,
		"failed_at":       time.Now().UTC().Format(time.RFC3339),
	}

	return p.PublishEvent(ctx, "notification.failed", notificationID.String(), payload)
}

// Close closes the producer
func (p *Producer) Close() error {
	return p.writer.Close()
}

// OutboxEvent represents an event in the outbox table
type OutboxEvent struct {
	ID          uuid.UUID
	EventType   string
	Payload     []byte
	Status      string
	CreatedAt   time.Time
	PublishedAt *time.Time
}

// OutboxPublisher publishes events from the outbox table
type OutboxPublisher struct {
	producer *Producer
	logger   *zap.SugaredLogger
}

// NewOutboxPublisher creates a new outbox publisher
func NewOutboxPublisher(producer *Producer, logger *zap.SugaredLogger) *OutboxPublisher {
	return &OutboxPublisher{
		producer: producer,
		logger:   logger,
	}
}

// PublishPendingEvents publishes pending events from the outbox
// This would be called periodically by a background job
func (o *OutboxPublisher) PublishPendingEvents(ctx context.Context, events []*OutboxEvent) error {
	for _, event := range events {
		var payload map[string]interface{}
		if err := json.Unmarshal(event.Payload, &payload); err != nil {
			o.logger.Errorw("Failed to unmarshal outbox event payload",
				"error", err,
				"event_id", event.ID,
			)
			continue
		}

		if err := o.producer.PublishEvent(ctx, event.EventType, event.ID.String(), payload); err != nil {
			o.logger.Errorw("Failed to publish outbox event",
				"error", err,
				"event_id", event.ID,
			)
			continue
		}

		// Mark event as published (would update database)
		o.logger.Infow("Published outbox event",
			"event_id", event.ID,
			"event_type", event.EventType,
		)
	}

	return nil
}
