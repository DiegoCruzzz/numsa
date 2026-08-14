# Numsa — Documento de proyecto

## Origen
Proyecto personal de Diego, estudiante de Ingeniería en Robótica Industrial 
en el IPN. Nace de una necesidad real: manejar mejor las finanzas personales, 
reducir deudas activas y mantener una salud financiera estable con un empleo 
formal. La idea es que funcione primero para uso personal y pueda escalar 
después a otros usuarios, emprendimientos o pequeños negocios.

## Nombre
Numsa — de "numerus" (latín). Neutro, técnico, escalable a B2B.

## Objetivo principal
Una app de finanzas personales con:
- Dashboard visual para entender el estado financiero de un vistazo
- Agente de IA para registrar gastos y hacer consultas en lenguaje natural
- Integración con mensajería (WhatsApp/Telegram) para interactuar sin abrir la app
- Escalable a multi-usuario y negocios pequeños

## Infraestructura de trabajo
- Laptop del trabajo (Mac) — desarrollo principal
- Laptop personal — secundaria
- Mini PC con N100 (por adquirir) — donde vivirán los proyectos en producción
- Claude.ai (Proyectos) — planeación y decisiones
- Claude Code (terminal Mac) — implementación
- GitHub Desktop — control de versiones
- Docker Desktop — entorno local

## Repositorio
github.com/DiegoCruzzz/numsa (cuenta personal)
Monorepo: /backend (FastAPI) + /frontend (Next.js)

## Stack elegido y por qué
- FastAPI: Diego trabaja principalmente en Python, API rápida de construir y mantener
- Next.js + TypeScript: experiencia previa en frontend JS, app router moderno
- PostgreSQL: relacional, robusto para datos financieros estructurados
- Redis: caché y sesiones, base para la Fase 3 (agente con memoria)
- Docker: todo corre igual en Mac de desarrollo y en la mini PC de producción
- LangChain + Claude API: Fase 3, agente conversacional con herramientas custom

## Decisiones de producto tomadas
- Moneda default: MXN (mercado mexicano primario)
- Tema default: claro-crema (#faf9f6), no blanco puro
- Color de acento: personalizable por usuario, default verde (#16a34a)
- Dark mode: disponible con toggle, preferencia guardada por usuario en backend
- Categorías con emojis: hace la experiencia más humana y rápida de leer
- Auth con JWT (HTTPBearer): simple para la v1, sin fricción para agregar OAuth después

## Estado actual

### Completado

- Fase 1 ✅ — Backend base completo
  Modelos: User, Account, Category, Transaction, Debt, Budget
  Auth JWT, CRUD completo, seed de categorías, Docker, Alembic

- Fase 2 ✅ — Dashboard completo
  Login/Register, layout con sidebar, dashboard home con gráficas,
  páginas CRUD para transacciones, cuentas, deudas y presupuestos
  React Query + Zustand + shadcn/ui + Recharts

- Ajustes estéticos ✅ — Completados
  Backend:
    0002_user_preferences.py — migración Alembic: theme y accent_color en users
    user.py model/schemas — campos theme y accent_color, UserPreferencesUpdate
    auth.py — PATCH /auth/preferences
  Frontend:
    globals.css — paleta crema-claro/oscuro + --accent-color + transiciones
    store/theme.ts — Zustand: setTheme, setAccentColor, syncFromUser
    ThemeToggle.tsx — sol/luna, prop persistToBackend
    AccentPicker.tsx — 8 colores, dropdown, CSS var en tiempo real
    Header.tsx — toggle + picker en esquina derecha
    DynamicFavicon.tsx — canvas genera favicon $ con accentColor
    ThemeInitializer.tsx — aplica tema en mount sin flash
    layout.tsx — script anti-flash, suppressHydrationWarning
    login/page.tsx — ícono Landmark verde, toggle temporal sin persistir

### Pendiente
- Fase 3 ⏳ — Agente IA
  LangChain + Claude API
  Registro de gastos por chat en lenguaje natural
  Consultas ("¿cuánto gasté esta semana?")
  Alertas y recomendaciones personalizadas

- Fase 4 ⏳ — Mensajería
  WhatsApp via Twilio o Telegram Bot
  Registrar gastos por mensaje
  Reportes semanales automáticos

- Fase 5 ⏳ — Escalabilidad
  Multi-usuario, roles y permisos
  Workspaces para negocios
  API pública para integraciones

## Cómo trabajamos
- Este proyecto (Claude.ai) → planeación, decisiones, prompts para Code, dudas
- Claude Code (terminal) → implementación real del código
- Al completar cada fase: actualizar PROJECT.md y CONTEXT.md
- Hacer commit con mensaje descriptivo antes de arrancar fase nueva

## Despliegue a producción

### Preparación (hecha en esta revisión)
- CORS del backend ahora lee `CORS_ORIGINS` desde `.env` (antes hardcodeado a localhost)
- `NEXT_PUBLIC_API_URL` ahora sí se usa en `lib/api.ts` (antes hardcodeado a localhost, el frontend nunca iba a poder hablar con un backend remoto)
- `backend/Dockerfile`: corre `alembic upgrade head` automáticamente al arrancar (`entrypoint.sh`) y ya no depende de `--reload`
- `frontend/Dockerfile`: ahora sí compila con `npm run build` (antes solo hacía `npm install`) y arranca con `npm start`
- `.dockerignore` en frontend y backend para no filtrar `node_modules`/`.next` locales (macOS) a la imagen de Linux
- `docker-compose.prod.yml` nuevo — standalone, sin bind-mounts de desarrollo, con `restart: unless-stopped` y variables obligatorias (falla explícito si falta `SECRET_KEY`, `CORS_ORIGINS` o `NEXT_PUBLIC_API_URL`)

### Cómo desplegar en el server (mini PC)
1. `git clone`/`git pull` del repo
2. Copiar `.env.example` a `.env` y llenar con los valores reales del server:
   - `SECRET_KEY`: generar uno nuevo con `openssl rand -hex 32` — nunca usar el default
   - `POSTGRES_PASSWORD`: una contraseña real, no la default
   - `CORS_ORIGINS`: `http://IP-DEL-SERVER:3000` (o el dominio, cuando exista)
   - `NEXT_PUBLIC_API_URL`: `http://IP-DEL-SERVER:8000`
3. `docker compose -f docker-compose.prod.yml up -d --build`
4. Verificar `http://IP-DEL-SERVER:8000/health` y `http://IP-DEL-SERVER:3000`

### Pendiente antes de compartir con el círculo cercano
- Sin HTTPS todavía (decisión consciente: sin dominio/proxy por ahora) — el login viaja en claro si no se agrega TLS. Evaluar Caddy o Cloudflare Tunnel cuando haya dominio.
- Cookie de auth no es `httpOnly` ni `Secure` (se lee desde `document.cookie` en el cliente) — aceptable para círculo cercano sin HTTPS, pero revisar si se expone más ampliamente
- Sin backups automáticos del volumen `postgres_data`
- Sin rate limiting en endpoints de auth

## Historial de decisiones importantes
| Fecha | Decisión | Por qué |
|-------|----------|---------|
| May 2026 | Monorepo en lugar de repos separados | Proyecto personal, más simple de manejar |
| May 2026 | SSH key separada para cuenta personal | Mac del trabajo con cuenta del trabajo configurada |
| May 2026 | Rama main como default | Convención moderna, evitar confusión con master |
| May 2026 | Tema claro-crema como default | Más accesible para usuarios no técnicos |
| May 2026 | Accent color guardado en backend | Persistencia real entre dispositivos |
| May 2026 | ThemeToggle con prop persistToBackend | Login usa toggle sin persistir, dashboard sí |
| May 2026 | Script anti-flash en <head> | Evita parpadeo de tema al cargar la página |

## Próxima sesión
Arrancar Fase 3 — Agente IA (LangChain + Claude API)