# Makefile for WeConnect
.PHONY: help up down logs shell test lint prod-up prod-down

# --- Development ---
up: ## 🚀 Start development environment (hot-reloading)
	@echo "Starting development containers..."
	docker-compose up --build -d

down: ## 🛑 Stop development containers
	@echo "Stopping development containers..."
	docker-compose down -v --remove-orphans

logs: ## 📜 View app logs
	docker-compose logs -f app

shell: ## 💻 Get a shell inside the app container
	docker-compose exec app sh

test: ## 🧪 Run tests inside the container
	docker-compose exec app npm run test

lint: ## 👕 Run linter inside the container
	docker-compose exec app npm run lint

# --- Production ---
prod-up: ## 🏭 Start production environment
	@echo "Starting production containers..."
	docker-compose -f docker-compose.yml up --build -d

prod-down: ## 🛑 Stop production environment
	@echo "Stopping production containers..."
	docker-compose -f docker-compose.yml down -v --remove-orphans

help: ## 📖 Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'
# --- 
Database ---
db-seed: ## 🌱 Seed the database with initial data
	docker-compose exec app npm run db:seed

db-shell: ## 🗄️ Connect to MongoDB shell
	docker-compose exec mongodb mongosh -u weconnect -p weconnect123 --authenticationDatabase admin weconnect

db-gui: ## 🖥️ Open MongoDB GUI (Mongo Express)
	@echo "Opening Mongo Express at http://localhost:8080"
	@echo "Username: admin, Password: admin"