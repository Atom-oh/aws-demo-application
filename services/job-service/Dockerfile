# Build stage
FROM gradle:8.5-jdk21 AS builder

WORKDIR /build

# Copy gradle configuration files first for better layer caching
COPY build.gradle settings.gradle ./

# Copy gradle wrapper (if present)
COPY gradle ./gradle

# Download dependencies (this layer will be cached if build.gradle doesn't change)
RUN gradle dependencies --no-daemon || true

# Copy proto files for gRPC code generation
COPY --from=proto . /proto

# Copy source code
COPY src ./src

# Build the application (skip tests for Docker build)
RUN gradle bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl tzdata

# Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup -h /app -s /sbin/nologin

# Copy JAR from builder (use wildcard to handle version changes)
COPY --from=builder /build/build/libs/*.jar app.jar

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV TZ=UTC \
    APP_ENV=production \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+ExitOnOutOfMemoryError"

# Expose HTTP and gRPC ports
EXPOSE 8002 9002

# Health check using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8002/actuator/health || exit 1

# Run the application with JVM options optimized for containers
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
