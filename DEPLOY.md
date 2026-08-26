# Numsa — Guía de despliegue y desarrollo

Tres formas de correr el proyecto, según el caso:

1. **Desarrollo nativo** (recomendado para editar código) — backend y frontend corriendo directo en tu máquina, con hot-reload rápido; solo Postgres y Redis en Docker.
2. **Desarrollo full-Docker** — todo en contenedores, útil para no instalar nada localmente o para reproducir el entorno exacto.
3. **Producción** — en el server real, sin bind-mounts de desarrollo, con migraciones automáticas.

---

## 1. Desarrollo nativo (recomendado)

Por qué: correr Postgres/Redis en contenedores desechables evita instalarlos localmente, pero el código que estás editando (backend y frontend) corre nativo — hot-reload instantáneo, debugging real con el IDE, sin el overhead de sincronizar bind-mounts de Docker en Mac.

**Requisitos**: Docker Desktop, Python 3.12, Node 20.

### Paso 1 — Postgres y Redis en Docker

```bash
docker compose up -d postgres redis
```

Quedan expuestos en `localhost:5432` y `localhost:6379`.

### Paso 2 — Backend nativo (venv)

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Crea `backend/.env` (no se sube al repo, ya está en `.gitignore`) apuntando a `localhost` en vez de a los nombres de servicio de Docker:

```bash
DATABASE_URL=postgresql+asyncpg://numsa:numsa_pass@localhost:5432/numsa_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=dev_secret_key_not_for_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
GEMINI_API_KEY=
CHAT_MODEL=gemini/gemini-3-flash
```

Aplica las migraciones y arranca:

```bash
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload
```

Backend en `http://localhost:8000` (docs en `/docs`).

### Paso 3 — Frontend nativo

Crea `frontend/.env.local` (tampoco se sube al repo):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
cd frontend
npm install
npm run dev
```

Frontend en `http://localhost:3000`.

### Día a día

Con `.venv` y `node_modules` ya instalados, para retomar solo hace falta:

```bash
docker compose up -d postgres redis
cd backend && .venv/bin/uvicorn app.main:app --reload &
cd frontend && npm run dev
```

---

## 2. Desarrollo full-Docker

Todo en contenedores, con `--reload`/`npm run dev` dentro y bind-mounts para hot-reload:

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec backend alembic upgrade head  # no corre automático en dev
```

Frontend: `http://localhost:3000` · Backend: `http://localhost:8000`.

Más lento para iterar que la vía nativa (rebuild de imagen al agregar una dependencia, sync de bind-mounts), pero no requiere instalar Python/Node localmente.

---

## 3. Producción

Ver `docker-compose.prod.yml` — standalone, sin bind-mounts, con `restart: unless-stopped`, migraciones automáticas al arrancar (`entrypoint.sh` corre `alembic upgrade head`), y variables requeridas explícitas (falla claro si falta `SECRET_KEY`, `CORS_ORIGINS` o `NEXT_PUBLIC_API_URL`).

### En el server

```bash
git clone https://github.com/DiegoCruzzz/numsa.git
cd numsa
cp .env.example .env
```

Completa en `.env`:

- `SECRET_KEY` — generar con `openssl rand -hex 32`, nunca el default
- `POSTGRES_PASSWORD` — una contraseña real
- `CORS_ORIGINS` — origen del frontend tal como lo ve el navegador, ej. `http://192.168.100.11:3000`
- `NEXT_PUBLIC_API_URL` — URL del backend tal como la ve el navegador, ej. `http://192.168.100.11:8000`
- `GEMINI_API_KEY` — si quieres el chat de Fase 3 activo

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verificar:

```bash
curl http://localhost:8000/health
```

### Actualizar una instalación existente

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Las migraciones corren solas al arrancar el backend — no hace falta ningún paso manual.

### Pendiente / notas

- Sin HTTPS todavía — válido para LAN o detrás de un túnel (Tailscale Serve) que ya cifre el tráfico; revisar antes de exponer los puertos directo a internet.
- Sin backups automáticos del volumen `postgres_data`.
- `litellm` quedó fijado a `1.85.0` en `requirements.txt` — posterior al incidente de cadena de suministro de marzo 2026 (versiones `1.82.7`/`1.82.8` comprometidas). No mover a un rango abierto sin verificar la versión primero.

Contexto de producto y decisiones de diseño: ver [PROJECT.md](PROJECT.md) y [CONTEXT.md](CONTEXT.md).
