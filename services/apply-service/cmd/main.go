package main

import (
	"context"
	"fmt"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	applyv1 "github.com/hirehub/proto/apply/v1"
	"github.com/hirehub/services/apply-service/internal/repository"
	"github.com/hirehub/services/apply-service/internal/server"
	"github.com/hirehub/services/apply-service/internal/service"
)

const (
	defaultPort    = "8004"
	defaultDBURL   = "postgres://postgres:postgres@localhost:5432/hirehub_apply?sslmode=disable"
	kafkaBrokers   = "localhost:9092"
	kafkaTopic     = "application-events"
)

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Get configuration from environment
	port := getEnv("PORT", defaultPort)
	dbURL := getEnv("DATABASE_URL", defaultDBURL)

	// Initialize database connection pool
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	poolConfig, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		logger.Fatal("Failed to parse database config", zap.Error(err))
	}

	poolConfig.MaxConns = 20
	poolConfig.MinConns = 5
	poolConfig.MaxConnLifetime = time.Hour
	poolConfig.MaxConnIdleTime = 30 * time.Minute

	dbPool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		logger.Fatal("Failed to create database pool", zap.Error(err))
	}
	defer dbPool.Close()

	// Verify database connection
	if err := dbPool.Ping(ctx); err != nil {
		logger.Fatal("Failed to ping database", zap.Error(err))
	}
	logger.Info("Connected to database")

	// Initialize Kafka writer
	kafkaWriter := &kafka.Writer{
		Addr:         kafka.TCP(getEnv("KAFKA_BROKERS", kafkaBrokers)),
		Topic:        kafkaTopic,
		Balancer:     &kafka.LeastBytes{},
		BatchTimeout: 10 * time.Millisecond,
		RequiredAcks: kafka.RequireOne,
	}
	defer kafkaWriter.Close()

	// Initialize repositories
	applicationRepo := repository.NewApplicationRepository(dbPool)
	eventRepo := repository.NewEventRepository(dbPool)
	interviewRepo := repository.NewInterviewRepository(dbPool)

	// Initialize services
	applicationService := service.NewApplicationService(applicationRepo, eventRepo, kafkaWriter, logger)
	interviewService := service.NewInterviewService(interviewRepo, applicationRepo, eventRepo, kafkaWriter, logger)

	// Initialize gRPC server
	grpcServer := grpc.NewServer(
		grpc.ChainUnaryInterceptor(
			loggingInterceptor(logger),
			recoveryInterceptor(logger),
		),
	)

	// Register services
	applyServer := server.NewApplyServer(applicationService, interviewService, logger)
	applyv1.RegisterApplyServiceServer(grpcServer, applyServer)

	// Register health check
	healthServer := health.NewServer()
	healthpb.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("", healthpb.HealthCheckResponse_SERVING)

	// Enable reflection for development
	reflection.Register(grpcServer)

	// Start gRPC server
	listener, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		logger.Fatal("Failed to listen", zap.Error(err), zap.String("port", port))
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		logger.Info("Shutting down gRPC server...")
		healthServer.SetServingStatus("", healthpb.HealthCheckResponse_NOT_SERVING)
		grpcServer.GracefulStop()
	}()

	logger.Info("Starting apply-service", zap.String("port", port))
	if err := grpcServer.Serve(listener); err != nil {
		logger.Fatal("Failed to serve", zap.Error(err))
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func loggingInterceptor(logger *zap.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		start := time.Now()
		resp, err := handler(ctx, req)
		duration := time.Since(start)

		if err != nil {
			logger.Error("gRPC call failed",
				zap.String("method", info.FullMethod),
				zap.Duration("duration", duration),
				zap.Error(err),
			)
		} else {
			logger.Info("gRPC call completed",
				zap.String("method", info.FullMethod),
				zap.Duration("duration", duration),
			)
		}

		return resp, err
	}
}

func recoveryInterceptor(logger *zap.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("Recovered from panic",
					zap.String("method", info.FullMethod),
					zap.Any("panic", r),
				)
				err = fmt.Errorf("internal server error")
			}
		}()
		return handler(ctx, req)
	}
}
