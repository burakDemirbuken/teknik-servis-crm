COMPOSE_COMMAND = docker compose

COMPOSE_FILE = ./docker-compose.yml





all: up

up:
	@$(COMPOSE_COMMAND) up --build -d

down:
	@$(COMPOSE_COMMAND) down

clean: down
	@$(COMPOSE_COMMAND) down -v --rmi all --remove-orphans

rf: clean all

re: down all


list:
	@$(COMPOSE_COMMAND) ps


shell-backend:
	@$(COMPOSE_COMMAND) exec backend sh



logs:
	@$(COMPOSE_COMMAND) logs -f

log-backend:
	@$(COMPOSE_COMMAND) logs -f backend
	
studio:
	@cd backend && nohup npx prisma studio --port 5555 > prisma-studio.log 2>&1 &

studio-stop:
	@pkill -f "prisma studio" || echo "Prisma Studio not running"

studio-logs:
	@tail -f backend/prisma-studio.log

db-reset:
	@cd backend && npx prisma migrate reset --force --skip-seed

db-reset-with-seed:
	@cd backend && npx prisma migrate reset --force

db-fresh:
	@$(COMPOSE_COMMAND) down -v
	@$(COMPOSE_COMMAND) up -d db

## up: Start containers
## down: Stop containers
## clean: Clean everything (volumes + images)
## rf: Full reset (clean + up)
## re: Restart (down + up)
## list: List running containers
## shell-backend: Enter backend container
## logs: Show all logs
## log-backend: Show backend logs only
## studio: Start Prisma Studio (background)
## studio-stop: Stop Prisma Studio
## studio-logs: Show Prisma Studio logs
## db-reset: Reset database (without seed)
## db-reset-with-seed: Reset database (with seed)
## db-fresh: Drop database and recreate
## help: Show this help message
help:
	@echo "Available Commands:"
	@echo ""
	@grep -E '^## ' $(MAKEFILE_LIST) | \
		sed 's/^## //' | \
		awk 'BEGIN {FS = ":"}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'


.PHONY: all down clean re list shell-backend logs log-backend studio studio-stop studio-logs db-reset db-reset-with-seed db-fresh help

