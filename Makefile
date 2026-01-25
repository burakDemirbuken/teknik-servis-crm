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

.PHONY: all down clean re list shell-backend logs log-backend studio studio-stop studio-logs db-reset db-reset-with-seed db-fresh

