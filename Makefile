COMPOSE_FILE = ./docker-compose.yml





all: 
	@docker-compose up --build -d

down:
	@docker-compose down

clean:
	@docker-compose down -v --rmi all --remove-orphans

re: clean all


list:
	@docker-compose ps


shell-backend:
	@docker-compose exec backend sh



logs:
	@docker-compose logs -f

log-backend:
	@docker-compose logs -f backend

.PHONY: all down clean re list shell-backend logs log-backend