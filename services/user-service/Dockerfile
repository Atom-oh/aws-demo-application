# Build stage
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Copy proto module first
COPY proto/ /proto/

# Copy service go mod files
COPY services/user-service/go.mod services/user-service/go.sum ./

# Update go.mod to point to local proto
RUN go mod edit -replace github.com/hirehub/proto=/proto && \
    go mod download && go mod verify

# Copy source code
COPY services/user-service/ .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -extldflags '-static'" \
    -tags netgo \
    -o /app/user-service \
    ./cmd/main.go

# Final stage
FROM alpine:3.19

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup -h /app -s /sbin/nologin

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/user-service .

# Copy migrations if they exist (create empty dir first as fallback)
RUN mkdir -p ./migrations

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV TZ=UTC \
    APP_ENV=production

# Expose gRPC port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8001/health || exit 1

# Run the application
ENTRYPOINT ["./user-service"]
