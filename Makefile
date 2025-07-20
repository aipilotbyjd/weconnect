# WeConnect - Workflow Automation Platform
# Development and deployment commands

.PHONY: help install dev build test clean up down logs shell seed reset

# Default target
help: ## Show this help message
	@echo "WeConnect - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development commands
install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run start:dev

build: ## Build the application
	npm run build

test: ## Run tests
	npm run test

test-e2e: ## Run end-to-end tests
	npm run test:e2e

test-cov: ## Run tests with coverage
	npm run test:cov

lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

format: ## Format code
	npm run format

typecheck: ## Run TypeScript type checking
	npm run typecheck

# Service commands (Redis, MongoDB, etc.)
services-up: ## Start external services (Redis, MongoDB)
	docker-compose up -d

services-down: ## Stop external services
	docker-compose down

services-logs: ## View service logs
	docker-compose logs -f

services-restart: ## Restart services
	docker-compose restart

services-status: ## Show service status
	docker-compose ps

# Database commands
seed: ## Seed database with sample data
	npm run db:seed

reset: ## Reset database (WARNING: Deletes all data)
	npm run db:reset

mongo: ## Connect to MongoDB shell
	docker-compose exec mongodb mongosh -u weconnect -p weconnect123 --authenticationDatabase admin weconnect

redis: ## Connect to Redis CLI
	docker-compose exec redis redis-cli

# Utility commands
clean: ## Clean build artifacts and dependencies
	npm run clean
	docker-compose down -v

clean-all: ## Clean everything including node_modules
	npm run clean:all
	docker-compose down -v --remove-orphans

deps-check: ## Check dependencies
	npm run deps:check

deps-update: ## Update dependencies
	npm run deps:update

deps-audit: ## Audit dependencies for security issues
	npm run deps:audit

# Health checks
health: ## Check application health
	curl -f http://localhost:3000/health || echo "Application not responding"

# Development workflow
setup: install services-up seed ## Complete development setup
	@echo ""
	@echo "🎉 WeConnect development environment is ready!"
	@echo ""
	@echo "📋 Services:"
	@echo "  • MongoDB: localhost:27017"
	@echo "  • Redis: localhost:6379"
	@echo "  • MongoDB GUI: http://localhost:8080 (admin/admin)"
	@echo "  • Redis GUI: http://localhost:8081"
	@echo ""
	@echo "🚀 Start the application:"
	@echo "  • Development: npm run start:dev"
	@echo "  • Production: npm run start:prod"
	@echo ""
	@echo "📚 Available commands: make help"

# Backup and restore
backup: ## Backup MongoDB data
	@echo "Creating MongoDB backup..."
	docker-compose exec -T mongodb mongodump --username weconnect --password weconnect123 --authenticationDatabase admin --db weconnect --archive > backup-$(shell date +%Y%m%d-%H%M%S).archive
	@echo "Backup created: backup-$(shell date +%Y%m%d-%H%M%S).archive"

restore: ## Restore MongoDB data (requires BACKUP_FILE variable)
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Usage: make restore BACKUP_FILE=backup-file.archive"; exit 1; fi
	@echo "Restoring MongoDB from $(BACKUP_FILE)..."
	docker-compose exec -T mongodb mongorestore --username weconnect --password weconnect123 --authenticationDatabase admin --db weconnect --archive < $(BACKUP_FILE)
	@echo "Restore completed"

# Monitoring
monitor: ## Show real-time service stats
	docker stats $(shell docker-compose ps -q)

# Security
security-scan: ## Run security audit
	npm audit
	docker run --rm -v $(PWD):/app -w /app node:20-alpine npm audit --audit-level moderate

# Documentation
docs: ## Generate API documentation
	@echo "Generating API documentation..."
	npm run build
	@echo "Documentation available at: http://localhost:3000/api"

# Quick commands for common workflows
quick-start: services-up dev ## Quick start services and app
quick-restart: services-restart ## Quick restart services
quick-test: services-up test ## Quick test run with services
quick-deploy: build services-up ## Quick deployment setup