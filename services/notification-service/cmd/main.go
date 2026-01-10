package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/hirehub/notification-service/internal/kafka"
	"github.com/hirehub/notification-service/internal/repository"
	"github.com/hirehub/notification-service/internal/sender"
	"github.com/hirehub/notification-service/internal/server"
	"github.com/hirehub/notification-service/internal/service"
)

const (
	defaultGRPCPort = "8007"
)

func main() {
	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	sugar := logger.Sugar()
	sugar.Info("Starting notification-service...")

	// Load configuration from environment
	cfg := loadConfig()

	// Initialize database connection pool
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	dbPool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		sugar.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		sugar.Fatalf("Failed to ping database: %v", err)
	}
	sugar.Info("Connected to database")

	// Initialize repositories
	notificationRepo := repository.NewNotificationRepository(dbPool)
	templateRepo := repository.NewTemplateRepository(dbPool)

	// Initialize senders
	emailSender := sender.NewEmailSender(cfg.AWSSESRegion, cfg.SenderEmail)
	pushSender := sender.NewPushSender(cfg.FirebaseCredentialsPath)
	smsSender := sender.NewSMSSender(cfg.AWSSMSRegion)

	// Initialize services
	templateSvc := service.NewTemplateService(templateRepo, sugar)
	notificationSvc := service.NewNotificationService(
		notificationRepo,
		templateRepo,
		emailSender,
		pushSender,
		smsSender,
		sugar,
	)

	// Initialize Kafka producer
	kafkaProducer := kafka.NewProducer(cfg.KafkaBrokers, sugar)
	defer kafkaProducer.Close()

	// Initialize Kafka consumer
	kafkaConsumer := kafka.NewConsumer(
		cfg.KafkaBrokers,
		cfg.KafkaGroupID,
		notificationSvc,
		sugar,
	)

	// Start Kafka consumer in background
	go func() {
		topics := []string{
			"resume.processed",
			"job.created",
			"match.recommended",
			"application.submitted",
			"application.status_changed",
			"interview.scheduled",
		}
		if err := kafkaConsumer.Start(ctx, topics); err != nil {
			sugar.Errorf("Kafka consumer error: %v", err)
		}
	}()
	sugar.Info("Kafka consumer started")

	// Initialize gRPC server
	grpcServer := grpc.NewServer()
	notificationServer := server.NewNotificationServer(notificationSvc, templateSvc, sugar)
	notificationServer.Register(grpcServer)

	// Start gRPC server
	port := cfg.GRPCPort
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		sugar.Fatalf("Failed to listen: %v", err)
	}

	go func() {
		sugar.Infof("gRPC server listening on port %s", port)
		if err := grpcServer.Serve(lis); err != nil {
			sugar.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	sugar.Info("Shutting down notification-service...")
	grpcServer.GracefulStop()
	kafkaConsumer.Close()
	cancel()
	sugar.Info("notification-service stopped")
}

type Config struct {
	GRPCPort                string
	DatabaseURL             string
	KafkaBrokers            []string
	KafkaGroupID            string
	AWSSESRegion            string
	AWSSMSRegion            string
	SenderEmail             string
	FirebaseCredentialsPath string
}

func loadConfig() *Config {
	return &Config{
		GRPCPort:                getEnv("GRPC_PORT", defaultGRPCPort),
		DatabaseURL:             getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/notification_db?sslmode=disable"),
		KafkaBrokers:            []string{getEnv("KAFKA_BROKERS", "localhost:9092")},
		KafkaGroupID:            getEnv("KAFKA_GROUP_ID", "notification-service"),
		AWSSESRegion:            getEnv("AWS_SES_REGION", "ap-northeast-2"),
		AWSSMSRegion:            getEnv("AWS_SMS_REGION", "ap-northeast-2"),
		SenderEmail:             getEnv("SENDER_EMAIL", "noreply@hirehub.com"),
		FirebaseCredentialsPath: getEnv("FIREBASE_CREDENTIALS_PATH", "/etc/secrets/firebase-credentials.json"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
