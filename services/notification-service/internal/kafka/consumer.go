package kafka

import (
	"context"
	"time"

	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
)

// EventProcessor processes events from Kafka
type EventProcessor interface {
	ProcessEvent(ctx context.Context, eventType string, payload []byte) error
}

// Consumer represents a Kafka consumer
type Consumer struct {
	brokers   []string
	groupID   string
	processor EventProcessor
	logger    *zap.SugaredLogger
	readers   []*kafka.Reader
}

// NewConsumer creates a new Kafka consumer
func NewConsumer(brokers []string, groupID string, processor EventProcessor, logger *zap.SugaredLogger) *Consumer {
	return &Consumer{
		brokers:   brokers,
		groupID:   groupID,
		processor: processor,
		logger:    logger,
		readers:   make([]*kafka.Reader, 0),
	}
}

// Start starts consuming messages from the specified topics
func (c *Consumer) Start(ctx context.Context, topics []string) error {
	for _, topic := range topics {
		reader := kafka.NewReader(kafka.ReaderConfig{
			Brokers:        c.brokers,
			GroupID:        c.groupID,
			Topic:          topic,
			MinBytes:       10e3, // 10KB
			MaxBytes:       10e6, // 10MB
			MaxWait:        1 * time.Second,
			CommitInterval: time.Second,
			StartOffset:    kafka.LastOffset,
		})

		c.readers = append(c.readers, reader)

		go c.consumeTopic(ctx, reader, topic)
	}

	<-ctx.Done()
	return nil
}

func (c *Consumer) consumeTopic(ctx context.Context, reader *kafka.Reader, topic string) {
	c.logger.Infow("Starting consumer for topic", "topic", topic)

	for {
		select {
		case <-ctx.Done():
			c.logger.Infow("Stopping consumer for topic", "topic", topic)
			return
		default:
			msg, err := reader.FetchMessage(ctx)
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				c.logger.Errorw("Failed to fetch message", "error", err, "topic", topic)
				continue
			}

			c.logger.Infow("Received message",
				"topic", topic,
				"partition", msg.Partition,
				"offset", msg.Offset,
				"key", string(msg.Key),
			)

			// Process the message
			if err := c.processor.ProcessEvent(ctx, topic, msg.Value); err != nil {
				c.logger.Errorw("Failed to process event",
					"error", err,
					"topic", topic,
					"offset", msg.Offset,
				)
				// Don't commit on error - message will be reprocessed
				continue
			}

			// Commit the message
			if err := reader.CommitMessages(ctx, msg); err != nil {
				c.logger.Errorw("Failed to commit message",
					"error", err,
					"topic", topic,
					"offset", msg.Offset,
				)
			}
		}
	}
}

// Close closes all readers
func (c *Consumer) Close() {
	for _, reader := range c.readers {
		if err := reader.Close(); err != nil {
			c.logger.Errorw("Failed to close reader", "error", err)
		}
	}
}

// TopicHandlers maps event types to their handler functions
var TopicHandlers = map[string]string{
	"resume.processed":            "ResumeProcessed",
	"job.created":                 "JobCreated",
	"match.recommended":           "MatchRecommended",
	"application.submitted":       "ApplicationSubmitted",
	"application.status_changed":  "ApplicationStatusChanged",
	"interview.scheduled":         "InterviewScheduled",
}
