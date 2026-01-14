FROM gradle:8.5-jdk21 AS builder
WORKDIR /build
COPY proto/ /proto/
COPY services/job-service/build.gradle services/job-service/settings.gradle ./
COPY services/job-service/src ./src
# Update proto path in build.gradle for Docker context
RUN sed -i "s|srcDir '../../proto'|srcDir '/proto'|g" build.gradle && \
    gradle build -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache curl
RUN addgroup -g 1000 -S appgroup && adduser -u 1000 -S appuser -G appgroup -h /app -s /sbin/nologin
WORKDIR /app
COPY --from=builder /build/build/libs/*.jar app.jar
RUN chown -R appuser:appgroup /app
USER appuser
ENV JAVA_OPTS="-Xms256m -Xmx512m" APP_ENV=production
EXPOSE 8002
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD curl -f http://localhost:8002/actuator/health || exit 1
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
