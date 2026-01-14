FROM golang:1.23-alpine AS builder
RUN apk add --no-cache git ca-certificates tzdata
WORKDIR /build
COPY services/notification-service/go.mod services/notification-service/go.sum ./
RUN go mod download && go mod verify
COPY services/notification-service/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /app/notification-service ./cmd/main.go

FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
RUN addgroup -g 1000 -S appgroup && adduser -u 1000 -S appuser -G appgroup -h /app -s /sbin/nologin
WORKDIR /app
COPY --from=builder /app/notification-service .
RUN mkdir -p ./migrations && chown -R appuser:appgroup /app
USER appuser
ENV TZ=UTC APP_ENV=production
EXPOSE 8007
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8007/health || exit 1
ENTRYPOINT ["./notification-service"]
