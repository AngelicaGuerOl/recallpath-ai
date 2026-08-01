# Development Guide

This guide covers setting up, running, and testing the RecallPath AI environment.

## Required Versions
If you prefer not to use Docker for local execution, ensure you have the following installed:
- **Java**: 21 (Temurin or OpenJDK recommended)
- **Node.js**: 20+
- **Maven**: 3.9+ (or use the included `./mvnw` wrapper)
- **PostgreSQL**: 16+

*Note: The recommended approach is to use the provided Docker Compose configuration and the `Makefile`, which automatically manages these dependencies.*

## Environment Setup

Before starting, configure your environment variables. 
Copy the example file:
```bash
cp .env.example .env
```

Open `.env` and review the variables. For local development without an internet connection or an API key, leave `AI_PROVIDER=fake`. 
If you wish to test with Google Gemini, set `AI_PROVIDER=gemini` and provide a valid `GEMINI_API_KEY`.

## Running the Application

The application provides a `Makefile` to simplify Docker commands.

### Start Development Environment
```bash
make dev
# or
make dev-up
```
This command builds and starts the backend, frontend, and database containers in the background. **Note:** `make dev-up` does *not* start pgAdmin by default.

### Start Development Tools (including pgAdmin)
```bash
make dev-tools
```
This starts the database and pgAdmin.

### Stop Services
```bash
make dev-down
```

### Run Only the Database
```bash
make dev-db
```

### Production Commands
- Build production images: `make prod-build`
- Start production environment: `make prod-up`
- Stop production environment: `make prod-down`

### Viewing Logs
- All services: `make logs`
- Backend only: `make logs-backend`
- Frontend only: `make logs-frontend`

### Checking Container Status and Configuration
- List running containers: `make ps`
- Validate compose configs: `make config`, `make config-dev`, `make config-prod`

## Backend and Frontend Execution (Local / Host)

When running via Docker Compose, the backend may be exposed only within the Docker network. The frontend Vite server acts as a proxy to consume the API.

If you wish to run the services directly on your host machine instead of inside Docker (e.g., for IDE debugging):

1. **Start the Database**:
   ```bash
   make dev-db
   ```
2. **Start the Backend**:
   ```bash
   cd recallpath-backend
   ./mvnw spring-boot:run
   ```
   *(Note: Ensure `http://localhost:8080` is published or accessible if you are not using the frontend proxy).*
3. **Start the Frontend**:
   ```bash
   cd recallpath-frontend/app
   npm install
   npm run dev
   ```

## Rebuilding and Recreating Containers Safely

If you change frontend code, Vite's hot-reload handles it automatically.
To rebuild and restart just the frontend container safely:
```bash
make dev-frontend
```

To safely rebuild the backend without touching the database, you can run:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build --force-recreate backend
```

> [!WARNING]
> **Data Persistence**: Do not use `docker compose down -v` unless you intentionally want to delete the database and document volumes.

## Tests and Builds

The backend uses JUnit 5, Mockito, and Testcontainers.
To run the backend test suite on your host:
```bash
cd recallpath-backend
./mvnw test
```

To compile the backend application for production:
```bash
cd recallpath-backend
./mvnw clean package -DskipTests
```

To build the frontend:
```bash
cd recallpath-frontend/app
npm run build
```

## Flyway Migrations

Database schema changes are managed by Flyway. 
Migrations are located in `recallpath-backend/src/main/resources/db/migration/`. 
When the backend starts (either via `spring-boot:run` or inside Docker), Flyway automatically detects new `.sql` files and applies them to the PostgreSQL database.

## Safe Verification of Gemini Configuration

To verify your Gemini setup:
1. Set `AI_PROVIDER=gemini` and `GEMINI_API_KEY=your_key` in `.env`.
2. Restart the backend container (e.g., using `docker compose up -d backend` or just restarting the compose stack).
3. Upload a small PDF and request generation.
4. Check the logs (`make logs-backend`) for successful JSON parsing. If you see HTTP 429 or 503 errors, verify your API key limits in Google AI Studio.
