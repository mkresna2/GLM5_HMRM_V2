# 🏨 HMRM Engine v2 — Hybrid ML + Monte Carlo Revenue System

## What is this project?

**HMRM Engine v2** is a full-stack **Hotel Revenue Management (HRM)** platform built around a real resort scenario — **Sakala Resort Bali** (80 rooms, three room types, 90 days of inventory). It combines two products in one application:

1. **Guest Booking Engine** — Search dates, see live rates and availability, hold a room, and complete a booking (the path a traveler would use on a hotel website).
2. **Revenue Manager Dashboard** — Monitor occupancy, ADR, RevPAR, and pricing recommendations; run and apply optimized rates (the path a revenue manager would use internally).

Between those two surfaces sits the **HMRM pricing engine** — a hybrid intelligence stack that answers: *“What should we charge tonight, and for the next 90 days, given uncertain demand?”* Instead of fixed BAR tables, the system:

- Uses **machine learning** (LightGBM surrogate) for fast revenue and occupancy forecasts.
- Runs **Monte Carlo simulations** to model demand uncertainty (events, seasonality, booking curves).
- Applies a **control-variate** technique so ML predictions reduce MC variance and speed up stable recommendations.
- Solves for **optimal prices** under constraints (floor/ceiling, parity, inventory) via a dedicated optimization service.

The demo property is fully seeded in SQLite (bookings, daily inventory, feature-store signals like search intensity and competitor index), so you can explore end-to-end behavior without connecting to a live PMS or OTA.

**In short:** this repo is a reference implementation of modern hotel revenue tech — direct booking UX on the front, revenue science on the back, with Python microservices doing the heavy numerical work and Next.js orchestrating the experience.


| You get             | How                                                               |
| ------------------- | ----------------------------------------------------------------- |
| Direct bookings     | Next.js booking flow + Prisma/SQLite persistence                  |
| Revenue control     | Dashboard KPIs, pricing grid, optimize/apply APIs                 |
| Dynamic pricing     | Dockerized Python services (gateway → HMRM → ML / MC / optimizer) |
| Realistic demo data | `prisma/seed.ts` — Sakala Resort, ~200 bookings, 90-day inventory |


Toggle between **Booking** and **Dashboard** on the home page (`/`). Pricing recommendations require the Python services (see Quick Start).

## ✨ System Architecture

The application is built using a modern full-stack and microservices architecture:

### 🌐 Frontend & Gateway (Next.js)

- **Booking Engine**: Guest-facing search, availability, and checkout experience.
- **Revenue Dashboard**: Internal management views for KPIs, pricing grids, and forecasts.
- **API Layer**: Next.js App Router acting as the primary orchestrator.

### 🧠 Intelligence Layer (Python Microservices)

- **Pricing Gateway (8001)**: Orchestrates requests between Next.js and the intelligence services.
- **HMRM Engine (8002)**: Core logic implementing the Hybrid ML-MC "Control Variate" technique.
- **ML Inference (8003)**: Fast surrogate model for revenue and occupancy prediction.
- **Monte Carlo (8004)**: High-performance stochastic demand simulator using NumPy.
- **Optimization (8009)**: Constraint-based price solver using SciPy.

## 🚀 Quick Start

### 1. Prerequisites

- [Bun](https://bun.sh/) (for the Next.js app)
- [Docker & Docker Compose](https://www.docker.com/) (for microservices)
- Python 3.10+ (if running services without Docker)

### 2. Run the Microservices

The core intelligence engine must be running for optimal pricing recommendations.

```bash
# Start all 5 Python services in the background
docker-compose -f docker-compose.services.yml up --build -d
```

### 3. Setup the Database

The project uses SQLite with Prisma. You must initialize and seed the database to see realistic hotel data.

```bash
# Install Next.js dependencies
bun install

# Initialize database and generate Prisma client
npx prisma generate
npx prisma db push

# Seed the database with hotel property, rooms, and 90 days of history
npx prisma db seed
```

### 4. Run the Web Application

```bash
# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to access the platform.

## 🗄️ Database & Seed Data

The project comes with a comprehensive seeding script (`prisma/seed.ts`) that populates your local SQLite database (`db/custom.db`) with:

- **Property**: "Sakala Resort Bali" with 80 rooms across 3 categories (Standard, Deluxe, Suite).
- **Amenities & Addons**: Full mapping of room features and bookable services.
- **90-Day Inventory**: Daily snapshots of availability and on-the-books (OTB) data.
- **Booking History**: ~200 sample bookings covering the last 30 days and the next 30 days.
- **Intelligence Signals**: Pre-populated "Feature Store" with search intensity, competitor indexes, and conversion scores.

To reset your data at any time:

```bash
npx prisma migrate reset
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 16, Tailwind CSS 4, shadcn/ui, Recharts, Zustand.
- **Database**: SQLite + Prisma ORM.
- **Microservices**: Python 3.10, FastAPI, NumPy, SciPy, Scikit-learn.
- **Containerization**: Docker Compose.

## ☁️ Deploy microservices to Render (Blueprint)

The repo includes [`render.yaml`](render.yaml) to deploy all five Python services in one step.

1. Push this repository to GitHub.
2. In [Render](https://dashboard.render.com): **New → Blueprint**.
3. Connect the repo and apply the Blueprint (creates `hmrm-ml-inference`, `hmrm-monte-carlo`, `hmrm-optimization`, `hmrm-engine`, `hmrm-pricing-gateway`).
4. Wait for all services to pass `/health` checks.
5. On **Vercel**, set `PRICING_GATEWAY_URL` to the `hmrm-pricing-gateway` service URL (from the Render dashboard, e.g. `https://hmrm-pricing-gateway-xxxx.onrender.com`).

Service URLs are wired automatically via `RENDER_EXTERNAL_URL`. Local Docker Compose is unchanged.

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js pages & API routes (booking, pricing, dashboard)
│   ├── components/          # booking/, dashboard/, ui/
│   ├── lib/                 # db, pricing-engine, API client
│   └── store/               # Zustand booking session state
├── prisma/                  # schema.prisma, seed.ts
├── mini-services/           # Python FastAPI microservices
├── db/                      # SQLite database (local, gitignored)
├── render.yaml              # Render Blueprint (5 web services)
└── docker-compose.services.yml
```

