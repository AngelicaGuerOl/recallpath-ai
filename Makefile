.PHONY: dev dev-up dev-db dev-tools dev-frontend dev-down prod-build prod-up prod-down ps logs logs-backend logs-frontend config config-dev config-prod

COMPOSE_DEV = docker compose -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PROD = docker compose -f docker-compose.yml -f docker-compose.prod.yml

dev: dev-up

dev-up:
	$(COMPOSE_DEV) up -d --build frontend

dev-db:
	docker compose -f docker-compose.yml up -d db

dev-tools:
	docker compose -f docker-compose.yml --profile tools up -d db pgadmin

dev-frontend:
	$(COMPOSE_DEV) up -d --build frontend

dev-down:
	$(COMPOSE_DEV) down

prod-build:
	$(COMPOSE_PROD) build

prod-up:
	$(COMPOSE_PROD) up -d

prod-down:
	$(COMPOSE_PROD) down

ps:
	$(COMPOSE_PROD) ps

logs:
	$(COMPOSE_PROD) logs -f

logs-backend:
	$(COMPOSE_PROD) logs -f backend

logs-frontend:
	$(COMPOSE_PROD) logs -f frontend

config:
	docker compose -f docker-compose.yml config

config-dev:
	$(COMPOSE_DEV) config

config-prod:
	$(COMPOSE_PROD) config
