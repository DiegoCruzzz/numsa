# Numsa

App de finanzas personales con dashboard visual y un agente de IA para registrar gastos y consultar tus finanzas por chat, en lenguaje natural. Pensada para uso personal, escalable a multi-usuario o pequeños negocios.

## Stack

- **Backend**: FastAPI + PostgreSQL + Redis
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Auth**: JWT (HTTPBearer)
- **Agente de chat**: [LiteLLM](https://docs.litellm.ai/) (proveedor por defecto: Gemini vía Google AI Studio, cambiable sin tocar código)

## Empezar en local

Quick start con todo en Docker:

```bash
git clone https://github.com/DiegoCruzzz/numsa.git
cd numsa
cp .env.example .env
make docker-dev
```

(`make` sin argumentos muestra todos los atajos disponibles — desarrollo nativo, full-Docker, producción)

- Frontend: http://localhost:3000
- Backend: http://localhost:8000 (docs interactivos en `/docs`)

Para usar el chat con IA, consigue una API key gratuita en [Google AI Studio](https://aistudio.google.com/apikey) y ponla en `GEMINI_API_KEY` dentro de `.env`.

Para desarrollo activo (hot-reload nativo, sin el overhead de Docker) o para desplegar en producción, ver la guía completa en [DEPLOY.md](DEPLOY.md).

## Estructura

```
backend/    FastAPI, modelos SQLAlchemy, servicios, migraciones Alembic
frontend/   Next.js, componentes, hooks de React Query
```

Más contexto de arquitectura y decisiones de diseño en [CONTEXT.md](CONTEXT.md) y [PROJECT.md](PROJECT.md).

## Licencia

MIT — ver [LICENSE](LICENSE). Úsalo, despliégalo y modifícalo como quieras.
