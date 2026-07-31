FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

COPY mvnw pom.xml ./
COPY .mvn .mvn

RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

COPY src src

RUN ./mvnw -B -DskipTests package \
    && cp target/recallpath-backend-*.jar target/app.jar

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S spring \
    && adduser -S spring -G spring

RUN apk add --no-cache curl

COPY --from=build /workspace/target/app.jar app.jar

RUN mkdir -p /app/documents && chown -R spring:spring /app/documents

USER spring:spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS "http://localhost:${PORT:-8080}/actuator/health" >/dev/null 2>&1 || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
