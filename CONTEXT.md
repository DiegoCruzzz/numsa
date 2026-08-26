# Numsa — Context para Claude Code

## Proyecto
App de finanzas personales (escalable a B2B/multi-usuario).
Monorepo: backend en /backend, frontend en /frontend.

## Stack
- Backend: FastAPI + PostgreSQL + Redis — puerto 8000
- Frontend: Next.js 14 (app router) + TypeScript — puerto 3000
- Auth: JWT via HTTPBearer
- Estado servidor: React Query (staleTime 60s)
- Estado cliente: Zustand
- UI: shadcn/ui + Tailwind + Recharts + Lucide React

## Archivos clave — frontend
- lib/api.ts — axios con interceptor JWT + redirección 401
- lib/queryClient.ts — instancia React Query
- store/auth.ts — sesión usuario (login/logout, cookie + localStorage)
- types/api.ts — interfaces TypeScript mapeadas desde Pydantic
- middleware.ts — protege rutas excepto /login y /register
- components/layout/Sidebar.tsx — nav 240px fijo, active state
- components/layout/Header.tsx — saludo dinámico + logout

## Archivos clave — backend
- app/models/ — User, Account, Category, Transaction, Debt, Budget, ChatMessage
- app/schemas/ — Pydantic v2
- app/services/ — lógica de negocio (nunca en rutas)
- app/services/agent.py — loop de tool-calling del agente de chat (litellm)
- app/services/agent_tools.py — tools del agente, envuelven los services existentes
- app/api/v1/ — endpoints REST
- alembic/ — migraciones

## Decisiones técnicas tomadas
- PATCH en lugar de PUT para updates parciales
- Dark mode por defecto (class="dark" en <html>)
- Moneda default: MXN
- Hooks usan z.input<>/z.output<> para Zod v4 + react-hook-form v7
- GET /debts/summary y GET /budgets/status registrados antes de /{id}
- Tokens: HTTPBearer (no cookies de auth)
- Seed de 13 categorías default al registrar usuario

## Diseño visual — estado actual y ajustes pendientes
### Tema
- Default: modo claro-crema (no blanco puro) con iconos y acentos en verde
- Dark mode disponible con toggle visible en header y en login
- La preferencia de tema se guarda por usuario en backend (campo theme en User)
- En login: toggle de tema visible pero no persistido (solo sesión)

### Color de acento personalizable
- El usuario puede elegir color de acento (iconos, textos destacados, separadores)
- Default: verde (#16a34a o similar)
- Se guarda por usuario en backend (campo accent_color en User)
- Afecta: iconos Lucide, textos de énfasis, bordes activos, favicon dinámico

### Favicon
- Cambia de color dinámicamente según el accent_color del usuario
- Ícono base: símbolo $ o moneda, generado con canvas en el cliente

### Categorías
- Selector de categorías incluye emojis junto al nombre
- Categorías default del seed incluyen emoji representativo

### Paleta modo claro (default)
- Fondo: #faf9f6 (crema suave, no blanco)
- Texto principal: #1a1a1a
- Acento default: #16a34a (verde)
- Cards: #ffffff con sombra suave
- Bordes: #e5e3de

### Paleta modo oscuro
- Fondo: #0f0f0f
- Superficie cards: #1a1a1a
- Texto: #f0ede8
- Acento: hereda el accent_color del usuario
- Bordes: #2a2a2a

## Fases completadas
- Fase 1 ✅ — Backend base, modelos, auth, Docker, Alembic
- Fase 2 ✅ — Dashboard completo, auth UI, páginas CRUD, hooks, tipos
- Fase 3 ✅ — Agente IA por chat (LiteLLM, no LangChain — ver PROJECT.md)

## Fase actual
Fase 3 construida, pendiente probar con API key real de Gemini. Después: Fase 4 (mensajería) o la idea de onboarding con encuesta/chat anotada en PROJECT.md.

## Reglas para Claude Code en este proyecto
- Leer CONTEXT.md al inicio de cada sesión
- Trabajar archivo por archivo, no mostrar todo junto
- Antes de crear un archivo: una línea de qué va a hacer
- Decisiones de diseño: elegir la más simple y avisar
- No repetir código ya escrito, referenciar el archivo
- Al terminar cada módulo: resumen de una línea
- Si algo del backend no coincide: revisar localhost:8000/docs
- Nunca usar any en TypeScript
- Todo estado del servidor via React Query, nunca useEffect para HTTP