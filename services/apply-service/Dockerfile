FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git ca-certificates tzdata
WORKDIR /build
COPY proto/ /proto/
COPY services/apply-service/go.mod services/apply-service/go.sum ./
RUN go mod edit -replace github.com/hirehub/proto=/proto && go mod download && go mod verify
COPY services/apply-service/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /app/apply-service ./cmd/main.go

FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
RUN addgroup -g 1000 -S appgroup && adduser -u 1000 -S appuser -G appgroup -h /app -s /sbin/nologin
WORKDIR /app
COPY --from=builder /app/apply-service .
RUN mkdir -p ./migrations && chown -R appuser:appgroup /app
USER appuser
ENV TZ=UTC APP_ENV=production
EXPOSE 8004
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8004/health || exit 1
ENTRYPOINT ["./apply-service"]
