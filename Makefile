.DEFAULT_GOAL := help
.PHONY: help install dev docker-dev docker-prod migrate test stop down

help:
	@echo "Numsa — comandos disponibles:"
	@echo ""
	@echo "  make install      Instala dependencias (venv del backend + npm del frontend)"
	@echo "  make dev          Postgres/Redis en Docker + backend y frontend nativos (hot-reload)"
	@echo "  make docker-dev   Todo en Docker, modo desarrollo (hot-reload)"
	@echo "  make docker-prod  Todo en Docker, modo producción"
	@echo "  make migrate      Aplica migraciones de Alembic (nativo, contra Postgres de Docker)"
	@echo "  make test         Corre la suite de pytest del backend (usa/crea numsa_test aparte)"
	@echo "  make stop         Detiene Postgres/Redis (deja el resto intacto)"
	@echo "  make down         Detiene y elimina todos los contenedores del proyecto"

install:
	python3.12 -m venv backend/.venv
	backend/.venv/bin/pip install --upgrade pip -q
	backend/.venv/bin/pip install -r backend/requirements-dev.txt
	cd frontend && npm install

migrate:
	cd backend && .venv/bin/alembic upgrade head

dev:
	docker compose up -d --wait postgres redis
	@$(MAKE) migrate
	@trap 'kill 0' EXIT INT TERM; \
	(cd backend && .venv/bin/uvicorn app.main:app --reload) & \
	(cd frontend && npm run dev) & \
	wait

docker-dev:
	docker compose up -d --build
	docker compose exec backend alembic upgrade head

docker-prod:
	docker compose -f docker-compose.prod.yml up -d --build

test:
	docker compose up -d --wait postgres redis
	cd backend && .venv/bin/pytest tests/ -v

stop:
	docker compose stop postgres redis

down:
	docker compose down
	-docker compose -f docker-compose.prod.yml down
