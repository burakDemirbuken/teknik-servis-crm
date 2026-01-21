COMPOSE_COMMAND = docker compose

COMPOSE_FILE = ./docker-compose.yml





all: up

up:
	@$(COMPOSE_COMMAND) up --build -d

down:
	@$(COMPOSE_COMMAND) down

clean:
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

.PHONY: all down clean re list shell-backend logs log-backend