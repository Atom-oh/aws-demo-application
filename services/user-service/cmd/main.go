package main

import (
	"database/sql"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	"github.com/hirehub/services/user-service/internal/repository"
	"github.com/hirehub/services/user-service/internal/server"
	"github.com/hirehub/services/user-service/internal/service"
)

const (
	defaultPort   = "8001"
	defaultDBHost = "localhost"
	defaultDBPort = "5432"
	defaultDBName = "hirehub_users"
	defaultDBUser = "postgres"
)

func main() {
	// Load configuration from environment
	port := getEnv("PORT", defaultPort)
	dbHost := getEnv("DB_HOST", defaultDBHost)
	dbPort := getEnv("DB_PORT", defaultDBPort)
	dbName := getEnv("DB_NAME", defaultDBName)
	dbUser := getEnv("DB_USER", defaultDBUser)
	dbPassword := getEnv("DB_PASSWORD", "")

	// Build database connection string
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	// Connect to database
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Verify database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to database successfully")

	// Initialize repository layer
	userRepo := repository.NewUserRepository(db)
	jobseekerProfileRepo := repository.NewJobseekerProfileRepository(db)
	companyRepo := repository.NewCompanyRepository(db)
	companyMemberRepo := repository.NewCompanyMemberRepository(db)

	// Initialize service layer
	userService := service.NewUserService(
		userRepo,
		jobseekerProfileRepo,
		companyRepo,
		companyMemberRepo,
	)

	// Create gRPC server
	grpcServer := grpc.NewServer()

	// Register user service
	userServer := server.NewUserServer(userService)
	server.RegisterUserServiceServer(grpcServer, userServer)

	// Register health service
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("", grpc_health_v1.HealthCheckResponse_SERVING)

	// Enable reflection for development
	reflection.Register(grpcServer)

	// Start listening
	listener, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen on port %s: %v", port, err)
	}

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("Shutting down gRPC server...")
		grpcServer.GracefulStop()
	}()

	log.Printf("User service starting on port %s", port)
	if err := grpcServer.Serve(listener); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
