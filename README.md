# Prodpulse

Production metrics platform on top of Splunk Cloud — fleet view for 40+ apps across 8 data centers.

See the design docs in `../` (README.md, 03-architecture.md).

## Structure

```
prodpulse/
├── apps/
│   ├── api/    NestJS backend — mock Splunk adapter, aggregation, metrics read API
│   └── web/    React + Vite frontend — fleet grid, DC view, app detail
```

## Quick Start

Terminal 1 — API (port 3001):
```
cd apps/api
npm install
copy .env.example .env
npm run build
npm start
```

Terminal 2 — Web (port 5173):
```
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173

## Features

- **Fleet grid** — health score per app × data center, auto-refresh 30s
- **App detail** — golden-signal charts (RPM, p95/p99, error %, availability), DC + range selectors
- **Onboarding wizard** — `/onboard` page or `POST /api/apps`; app joins the fleet immediately
- **Redis-backed store** — set `REDIS_URL` (e.g. `docker compose up -d redis`); falls back to in-memory if unreachable
- **Configurable DCs** — set `DC_NAMES` (comma-separated) in `.env`; defaults to 8 generic names

## Switching to real Splunk Cloud

Edit `apps/api/.env`:

```
SPLUNK_MODE=real
SPLUNK_URL=https://<your-stack>.splunkcloud.com:8089
SPLUNK_TOKEN=<bearer-token-from-splunk>
```

The real adapter expects rollups in `index=prod_summary` produced by scheduled saved
searches (see ../03-architecture.md for the SPL). Until those exist, keep SPLUNK_MODE=mock.

## Health Score

```
score = 100 - 50*min(1, errRate/errSlo) - 30*min(1, p95/p95Slo) - 20*(1-avail)
green >= 90 | amber 70-89 | red < 70
```
