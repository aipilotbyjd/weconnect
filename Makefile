# WeConnect Makefile
.PHONY: help install build test lint format clean dev prod docker-build docker-run docker-dev docker-prod docker-down deps-check deps-clean

# Colors for output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Default target
help: ## Show this help message
	@echo "$(CYAN)WeConnect - Development Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(GREEN)%-20s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
install: ## Install dependencies
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	npm ci

build: ## Build the application
	@echo "$(CYAN)Building application...$(RESET)"
	npm run build

dev: ## Start development server
	@echo "$(CYAN)Starting development server...$(RESET)"
	npm run start:dev

prod: ## Start production server
	@echo "$(CYAN)Starting production server...$(RESET)"
	npm run start:prod

# Testing
test: ## Run tests
	@echo "$(CYAN)Running tests...$(RESET)"
	npm run test

test-watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(RESET)"
	npm run test:watch

test-cov: ## Run tests with coverage
	@echo "$(CYAN)Running tests with coverage...$(RESET)"
	npm run test:cov

# Code Quality
lint: ## Run linter
	@echo "$(CYAN)Running linter...$(RESET)"
	npm run lint

lint-check: ## Check linting without fixing
	@echo "$(CYAN)Checking linting...$(RESET)"
	npm run lint:check

format: ## Format code
	@echo "$(CYAN)Formatting code...$(RESET)"
	npm run format

typecheck: ## Run TypeScript type checking
	@echo "$(CYAN)Running type check...$(RESET)"
	npm run typecheck

# Docker Development
docker-build: ## Build Docker image
	@echo "$(CYAN)Building Docker image...$(RESET)"
	docker build -t weconnect .

docker-run: ## Run Docker container
	@echo "$(CYAN)Running Docker container...$(RESET)"
	docker run -p 3000:3000 weconnect

docker-dev: ## Start development environment with Docker
	@echo "$(CYAN)Starting development environment...$(RESET)"
	docker-compose -f docker-compose.dev.yml up --build

docker-prod: ## Start production environment with Docker
	@echo "$(CYAN)Starting production environment...$(RESET)"
	docker-compose up --build

docker-down: ## Stop Docker containers
	@echo "$(CYAN)Stopping Docker containers...$(RESET)"
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

docker-logs: ## View Docker logs
	@echo "$(CYAN)Viewing Docker logs...$(RESET)"
	docker-compose logs -f app

# Dependencies
deps-check: ## Check for unused dependencies
	@echo "$(CYAN)Checking dependencies...$(RESET)"
	npm run deps:check

deps-update: ## Update dependencies
	@echo "$(CYAN)Updating dependencies...$(RESET)"
	npm run deps:update

deps-audit: ## Audit dependencies for vulnerabilities
	@echo "$(CYAN)Auditing dependencies...$(RESET)"
	npm run deps:audit

deps-audit-fix: ## Fix dependency vulnerabilities
	@echo "$(CYAN)Fixing dependency vulnerabilities...$(RESET)"
	npm run deps:audit:fix

deps-clean: ## Clean dependencies and reinstall
	@echo "$(CYAN)Cleaning and reinstalling dependencies...$(RESET)"
	npm run clean:all
	npm install

# Database
db-migrate: ## Run database migrations
	@echo "$(CYAN)Running database migrations...$(RESET)"
	npm run db:migrate

db-seed: ## Seed database
	@echo "$(CYAN)Seeding database...$(RESET)"
	npm run db:seed

# Cleanup
clean: ## Clean build artifacts
	@echo "$(CYAN)Cleaning build artifacts...$(RESET)"
	npm run clean

clean-all: ## Clean everything including node_modules
	@echo "$(CYAN)Cleaning everything...$(RESET)"
	npm run clean:all

# Quality Check
quality: lint typecheck test ## Run all quality checks
	@echo "$(GREEN)All quality checks passed!$(RESET)"

# Full Setup
setup: install build test ## Full project setup
	@echo "$(GREEN)Project setup complete!$(RESET)"

# CI/CD Pipeline Simulation
ci: lint typecheck test build ## Simulate CI pipeline
	@echo "$(GREEN)CI pipeline completed successfully!$(RESET)"
