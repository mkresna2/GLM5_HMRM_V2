# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hotel Revenue Management System (HMRM) for Sakala Resort Bali — combines a Next.js booking engine (guest-facing) and revenue dashboard (internal) with a Python microservices backend that runs hybrid ML + Monte Carlo stochastic optimization for dynamic room pricing.

## Commands

```bash
# Development
bun dev              # Next.js dev server on port 3000 (logs to dev.log)
bun lint             # ESLint

# Production build (Vercel: prisma migrate deploy + next build)
bun build            # migrate deploy + next build
bun build:standalone # next build + copy assets for local standalone
bun start            # Run standalone server (production)

# Database (Neon — DATABASE_URL pooled, DIRECT_URL for migrations)
bun db:generate      # Regenerate Prisma client
bun db:migrate       # Create and apply migration (dev)
bun db:migrate:deploy # Apply migrations (production / Vercel)
bun db:push          # Push schema without migration (dev only)
bun db:seed          # Sakala Resort demo data
bun db:reset         # Reset DB, migrations, and seed

# Python microservices (Docker)
docker compose -f docker-compose.services.yml up -d    # Start all 5 services
docker compose -f docker-compose.services.yml down     # Stop services
docker compose -f docker-compose.services.yml logs -f  # Stream logs
```

## Architecture

### Dual-Mode Frontend (`/src/app/page.tsx`)
Single-page app with a toggle between two views:
- **Booking Engine** (`/src/components/booking/`) — guest-facing: search → hold → confirm
- **Revenue Dashboard** (`/src/components/dashboard/`) — internal KPI management and pricing recommendations

### Next.js API Routes (`/src/app/api/`)
| Route | Purpose |
|-------|---------|
| `POST /api/booking/search` | Availability search with real-time pricing |
| `POST /api/booking/hold` | Reserve room for 15 min (session-based) |
| `POST /api/booking/confirm` | Finalize booking, persist to DB |
| `POST /api/pricing/optimize` | Trigger ML + MC pricing run |
| `POST /api/pricing/apply` | Commit new prices to inventory |
| `GET /api/dashboard` | KPIs, revenue charts, recent bookings |
| `GET /api/features` | Demand signals from feature store |

### Python Microservices (`/mini-services/`, Docker Compose)
```
Pricing Gateway  :8001  — orchestrator/facade, routes all external pricing requests
HMRM Engine      :8002  — core logic: selects ML-only, hybrid, or full MC mode
ML Inference     :8003  — LightGBM surrogate model (revenue/occupancy prediction)
Monte Carlo      :8004  — NumPy-based stochastic simulator
Optimization     :8009  — SciPy constraint solver for price bounds
```

Services communicate via HTTP. The HMRM Engine implements a **control variate technique** using ML predictions to reduce Monte Carlo variance. Pricing mode (ML-only / hybrid / full MC) is selected dynamically based on demand signals.

### Database (`/prisma/schema.prisma`, Neon Postgres)
Key models: `Property`, `RoomType`, `Booking`, `InventoryDaily`, `PricingDecision`, `FeatureStore`. Prisma client is instantiated as a singleton in `/src/lib/db.ts`.

### State Management
- **Zustand** store at `/src/store/booking-store.ts` manages booking session state
- **TanStack Query** for server state / caching
- Session IDs stored in `sessionStorage` to track search/hold across steps

### Key Shared Files
- `/src/lib/api.ts` — all client-side fetch calls, single abstraction layer
- `/src/lib/pricing-engine.ts` — pricing logic used by API routes
- `/src/types/` — shared TypeScript interfaces between frontend and API routes

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui (New York style) |
| State | Zustand, TanStack Query 5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animation | Framer Motion |
| Database | Neon Postgres + Prisma ORM 6 |
| Backend | Python 3.10, FastAPI, Uvicorn |
| ML/Data | LightGBM, NumPy, SciPy, Scikit-learn, Pandas |
| Runtime | Bun |
| Proxy | Caddy (`Caddyfile`) |

## Important Notes

- **Build errors are ignored** (`typescript.ignoreBuildErrors: true` in `next.config.ts`) — TypeScript errors won't fail `bun build`
- **Standalone output** is configured; after `bun build`, static files are copied manually to `.next/standalone/`
- **No test suite** is currently configured
- Python service URLs are injected via environment variables: `HMRM_ENGINE_URL`, `ML_SERVICE_URL`, `MONTE_CARLO_URL`, `OPTIMIZATION_URL` — services must be running for pricing routes to work
- shadcn/ui components live in `/src/components/ui/` — add new ones with `bunx shadcn@latest add <component>`
