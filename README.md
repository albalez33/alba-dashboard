# Alba Lez · Instagram Analytics Dashboard

Dashboard privado de métricas de Instagram para el representante de Alba Lez. Objetivo: tomar mejores decisiones de contenido y llegar a **1M de seguidores**.

## Stack

| Capa | Tecnología | Coste |
|---|---|---|
| Frontend + API | Next.js 14 (App Router, TypeScript, Tailwind, Recharts) | — |
| Hosting + Cron | Vercel (plan Hobby) | Gratis |
| Base de datos | Supabase (Postgres) | Gratis |
| Datos | Instagram Graph API (tu app de Meta) | Gratis |

**Por qué hay base de datos:** la API de Instagram solo devuelve insights de los últimos ~30 días y no da histórico de seguidores. Un cron diario (06:00 UTC) guarda un snapshot en Supabase, construyendo el histórico real semana a semana hacia 1M.

## Qué muestra

- Progreso hacia 1M con proyección de fecha estimada según el ritmo actual
- KPIs con comparativa vs. periodo anterior: alcance, visualizaciones, interacciones, likes, comentarios, guardados, compartidos, engagement
- Gráficas: evolución de seguidores, alcance/visualizaciones, interacciones diarias
- Top contenidos (con tipo, miniatura, métricas y enlace a la publicación)
- Audiencia: países, ciudades, edad, género, mejores horas (seguidores online)
- Selector de periodo: 7 / 30 / 90 días, 1 año, histórico

---

## Puesta en marcha (≈20 min)

### 1. Requisitos de la cuenta

- La cuenta de Instagram debe ser **profesional** (Creator o Business) y estar **vinculada a una página de Facebook**.
- Tu app de Meta debe tener el producto **Instagram Graph API** añadido.

### 2. Obtener IG_USER_ID y token de larga duración

1. Ve a [Graph API Explorer](https://developers.facebook.com/tools/explorer/), selecciona tu app.
2. En "Permissions" añade: `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `pages_read_engagement`, `business_management`. Genera el token.
3. Consulta `me/accounts` → copia el `id` de la página de Facebook.
4. Consulta `{page-id}?fields=instagram_business_account` → el `id` devuelto es tu **IG_USER_ID**.
5. Convierte el token en uno de larga duración (60 días):

```
https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={TOKEN_CORTO}
```

> ⚠️ El token caduca a los 60 días. Apunta un recordatorio para regenerarlo, o crea un **System User** en Business Manager para un token sin caducidad (recomendado a largo plazo).

### 3. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (gratis).
2. SQL Editor → pega el contenido de `supabase/schema.sql` → Run.
3. Settings → API: copia la **URL** y la **service_role key**.

### 4. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub (privado).
2. En [vercel.com](https://vercel.com) → New Project → importa el repo.
3. Añade las variables de entorno (ver `.env.example`):
   - `IG_USER_ID`, `IG_ACCESS_TOKEN`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `DASHBOARD_PASSWORD` (la que usará el representante)
   - `CRON_SECRET` (cadena aleatoria larga)
4. Deploy. El cron diario queda configurado automáticamente vía `vercel.json`.

### 5. Primera carga de datos (backfill)

Tras el deploy, ejecuta una vez en el navegador o con curl:

```
https://TU-DOMINIO.vercel.app/api/cron/snapshot?secret=TU_CRON_SECRET&backfill=30
```

Esto rellena los últimos 30 días (máximo que permite la API) y sincroniza las 50 últimas publicaciones y la audiencia. A partir de ahí, el cron diario lo mantiene todo al día.

### 6. Acceso

Comparte la URL y la contraseña con el representante. La sesión dura 30 días por dispositivo.

---

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellena las variables
npm run dev                  # http://localhost:3000
```

## Notas sobre la API

- `views` sustituyó a `impressions` (Meta la retiró en v22+).
- La demografía (`follower_demographics`) requiere ~100+ seguidores.
- `online_followers` puede no estar disponible en todas las cuentas; el panel lo oculta con elegancia si no hay datos.
- Las stories solo exponen insights durante 24h; este dashboard se centra en feed y reels.

## Estructura

```
app/page.tsx               → dashboard (server component)
app/login + middleware.ts  → protección por contraseña
app/api/cron/snapshot      → snapshot diario + backfill
lib/instagram.ts           → cliente Graph API
lib/metrics.ts             → agregaciones, engagement, proyección 1M
components/                → KPIs, gráficas, top contenidos, audiencia
supabase/schema.sql        → esquema de la base de datos
```
