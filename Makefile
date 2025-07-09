# Makefile for WeConnect (Docker-First Workflow)
.PHONY: help up down logs shell test lint format db-migrate db-seed clean prod-up prod-down prod-logs ci

# ==============================================================================
# VARIABLES
# ==============================================================================

# Dynamically get the main service name from the docker-compose.dev.yml file
APP_SERVICE_NAME := $(shell sed -n 's/^\s*\([a-zA-Z0-9_-]\+\):.*/\1/p' docker-compose.dev.yml | head -n 1)
CYAN := \033[36m
GREEN := \033[32m
RESET := \033[0m

# ==============================================================================
# HELP
# ==============================================================================

help: ## 📖 Show this help message
	@echo "$(CYAN)WeConnect - Project Commands$(RESET)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(GREEN)%-18s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ==============================================================================
# DEVELOPMENT (via Docker)
# ==============================================================================

up: ## 🚀 Start development environment with hot-reloading
	@echo "$(CYAN)Starting development containers...$(RESET)"
	docker-compose up --build -d

down: ## 🛑 Stop development environment
	@echo "$(CYAN)Stopping development containers...$(RESET)"
	docker-compose down --remove-orphans

logs: ## 📜 View live logs from the app container
	@echo "$(CYAN)Tailing logs... (Press Ctrl+C to stop)$(RESET)"
	docker-compose logs -f $(APP_SERVICE_NAME)

shell: ## 💻 Get a shell inside the running app container
	@echo "$(CYAN)Opening shell inside $(APP_SERVICE_NAME) container...$(RESET)"
	docker-compose exec $(APP_SERVICE_NAME) sh

# ==============================================================================
# TASKS (Executed inside Docker)
# ==============================================================================

test: ## 🧪 Run tests inside the Docker container
	@echo "$(CYAN)Running tests inside Docker...$(RESET)"
	docker-compose exec $(APP_SERVICE_NAME) npm run test

lint: ## 👕 Run the linter inside the Docker container
	@echo "$(CYAN)Running linter inside Docker...$(RESET)"
	docker-compose exec $(APP_SERVICE_NAME) npm run lint

format: ## ✨ Format code inside the Docker container
	@echo "$(CYAN)Formatting code inside Docker...$(RESET)"
	docker-compose exec $(APP_SERVICE_NAME) npm run format

db-migrate: ## 🗄️ Run database migrations inside the Docker container
	@echo "$(CYAN)Running database migrations inside Docker...$(RESET)"
	docker-compose exec $(APP_SERVICE_NAME) npm run typeorm:migration:run

db-seed: ## 🌱 Seed the database inside the Docker container
	@echo "$(CYAN)Seeding database inside Docker...$(RESET)"
	docker-compose exec $(APP_SERVICE_NAME) npm run seed

clean: ## 🧹 Clean the dist folder inside the Docker container
	@echo "$(CYAN)Cleaning build artifacts inside Docker...$(RESET)"
	docker-compose exec $(APP_SERVICE_NAME) rm -rf dist

# ==============================================================================
# PRODUCTION
# ==============================================================================

prod-up: ## 🏭 Start production environment
	@echo "$(CYAN)Starting production containers...$(RESET)"
	docker-compose -f docker-compose.yml up --build -d

prod-down: ## 🛑 Stop production environment
	@echo "$(CYAN)Stopping production containers...$(RESET)"
	docker-compose -f docker-compose.yml down --remove-orphans

prod-logs: ## 📜 View live logs from the production app container
	@echo "$(CYAN)Tailing production logs...$(RESET)"
	docker-compose -f docker-compose.yml logs -f app

# ==============================================================================
# CI/CD
# ==============================================================================

ci: ## ⚙️ Simulate a CI pipeline run
	@echo "$(CYAN)Running CI checks...$(RESET)"
	@make lint
	@make test
	@echo "$(GREEN)CI checks passed!$(RESET)"