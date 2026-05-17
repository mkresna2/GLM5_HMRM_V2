# 📘 Product Requirements Document (PRD)

## Product: Hotel Revenue Management & Booking Engine
### HMRM Engine — Hybrid ML + Monte Carlo Revenue Optimization System
**Version:** 2.0 | **Status:** Production-Ready Specification | **Author:** bagustwidia@gmail.com

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Business Context](#2-business-context)
3. [Problem Statement](#3-problem-statement)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Core Domain Models](#5-core-domain-models)
6. [Microservices Specification](#6-microservices-specification)
7. [Database Schema](#7-database-schema)
8. [API Contracts — Internal Services](#8-api-contracts--internal-services)
9. [API Contracts — Public Booking Engine](#9-api-contracts--public-booking-engine)
10. [Event Schema Contract](#10-event-schema-contract)
11. [ML & Monte Carlo Engine Design](#11-ml--monte-carlo-engine-design)
12. [Booking Engine Frontend](#12-booking-engine-frontend)
13. [Revenue Management Dashboard](#13-revenue-management-dashboard)
14. [Pricing Logic & Trigger Rules](#14-pricing-logic--trigger-rules)
15. [KPIs & Validation Framework](#15-kpis--validation-framework)
16. [Security & Compliance](#16-security--compliance)
17. [Infrastructure & Deployment](#17-infrastructure--deployment)
18. [Phase Roadmap](#18-phase-roadmap)

---

# 1. Product Overview

## 1.1 Purpose

Build a **full-stack Hotel Revenue Management (HRM) platform** combining:

- A **guest-facing Booking Engine** (web + mobile) for direct hotel reservations
- A **Revenue Manager Dashboard** for pricing control, forecasting, and analytics
- A **Hybrid ML + Monte Carlo (HMRM) pricing engine** that optimizes room prices under real-world demand uncertainty

## 1.2 Core Product Components

| Component | Role |
|---|---|
| **Booking Engine (BE)** | Guest-facing search, availability, checkout, confirmation |
| **Revenue Management System (RMS)** | Internal pricing, forecasting, analytics dashboard |
| **HMRM Pricing Engine** | ML + Monte Carlo hybrid optimizer (core intelligence) |
| **Event Streaming Layer** | Real-time behavioral signal processing (Kafka) |
| **Feature Store** | Low-latency feature serving for ML inference (Redis + Postgres) |
| **Conversion Scoring Service** | Predicts guest booking probability per session |

## 1.3 Target Users

| User | Role |
|---|---|
| **Hotel Guest** | Searches availability, selects rooms, completes booking via Booking Engine |
| **Revenue Manager** | Reviews pricing recommendations, adjusts strategy, monitors KPIs |
| **System (Automated)** | HMRM Engine applies pricing recommendations automatically based on triggers |

## 1.4 Deployment Context

Designed for properties like:
- **Independent resorts** (e.g., Bali beachfront resorts with 80–200 rooms)
- **Urban boutique hotels** with high OTA dependency
- **Multi-property portfolios** (Phase 3)

---

# 2. Business Context

## 2.1 Revenue Drivers in Hotel RM

```
RevPAR = ADR × Occupancy Rate
Net Revenue = Gross Revenue − OTA Commission − Overbooking Cost
GOPPAR = (Gross Operating Profit) / Available Rooms Per Night
```

## 2.2 Channel Economics

| Channel | Typical Commission | Direct Booking Goal |
|---|---|---|
| OTA (Booking.com, Expedia) | 15–25% | Minimize share |
| Direct (Website) | 0% | Maximize share |
| Corporate / B2B | 10–15% | Stable base load |
| Metasearch (Google) | 5–12% CPC | Growth channel |

## 2.3 Key Revenue Challenges

- Booking windows of 30–120 days create demand uncertainty
- Cancellation rates of 20–40% require overbooking decisions
- OTA pricing parity rules limit direct pricing flexibility
- Length-of-stay (LOS) effects impact total revenue per booking
- Room-type upsell (trade-up) behavior affects actual revenue mix

---

# 3. Problem Statement

## 3.1 Current-State Gaps

Traditional Revenue Management Software (RMS):
- Uses **deterministic forecasts** — fails to model demand tails
- Applies **heuristic rules** — brittle in volatile demand
- **No explicit uncertainty quantification** — cannot simulate risk
- **Slow Monte Carlo** alone is impractical for daily pricing decisions (<200ms required)
- **Pure ML models** predict demand well but fail on distribution tails and cancellation risk

## 3.2 Desired Outcome

A hybrid system that:
- **Preserves uncertainty modeling** (via Monte Carlo simulation)
- **Improves pricing speed** (via ML surrogate, <150ms for daily decisions)
- **Reduces estimation variance** (via control variate technique)
- **Enables risk-aware pricing** (via variance-penalized objective)
- **Learns continuously** from actual booking outcomes (closed-loop retraining)

---

# 4. System Architecture Overview

## 4.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        GUEST-FACING LAYER                        │
│             Booking Engine Web/Mobile (Next.js / React)          │
└───────────────────────────────┬──────────────────────────────────┘
                                │ REST API
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BOOKING ENGINE API                          │
│           (Search / Availability / Pricing / Checkout)           │
│                    Node.js / FastAPI Gateway                     │
└──────────────┬───────────────────────────────┬───────────────────┘
               │ Async Events                  │ Sync Pricing
               ▼                               ▼
┌──────────────────────┐          ┌────────────────────────────────┐
│   Event Collector    │          │        Pricing Gateway          │
│   (Kafka Producer)   │          │   (Orchestrates pricing modes)  │
└──────────┬───────────┘          └──────────────┬─────────────────┘
           │                                     │
           ▼                                     ▼
┌──────────────────────┐          ┌────────────────────────────────┐
│   Kafka Event Bus    │          │      HMRM Pricing Engine        │
│  (booking.events)    │          │   (ML Surrogate + MC Hybrid)    │
└──────────┬───────────┘          └─────────────┬──────────────────┘
           │                                    │
           ▼                            ┌───────┴──────────┐
┌───────────────────────┐               ▼                  ▼
│  Real-Time Signal     │  ┌─────────────────┐  ┌──────────────────┐
│     Processor         │  │  ML Inference   │  │  Monte Carlo     │
│ (demand, intent,      │  │  Service        │  │  Service         │
│  cancellation)        │  │  (XGBoost/LightGB│  │  (NumPy/SciPy)   │
└──────────┬────────────┘  └────────┬────────┘  └────────┬─────────┘
           │                        │                    │
           ▼                        ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                         FEATURE STORE                            │
│           Redis (hot: real-time) + PostgreSQL (cold: historical) │
└──────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│              REVENUE MANAGER DASHBOARD (React)                   │
│     Pricing control / KPIs / Forecasting / Scenario Simulation   │
└──────────────────────────────────────────────────────────────────┘
```

## 4.2 Technology Stack

| Layer | Technology |
|---|---|
| **Booking Engine Frontend** | Next.js 14, TailwindCSS, React Query |
| **Revenue Manager Dashboard** | React + Recharts / ApexCharts + TailwindCSS |
| **Booking Engine API** | Node.js (Express) or Python FastAPI |
| **HMRM Pricing Engine** | Python FastAPI microservice |
| **ML Inference Service** | Python FastAPI + scikit-learn / LightGBM / XGBoost |
| **Monte Carlo Service** | Python + NumPy + SciPy (parallel workers via Ray or Celery) |
| **Event Streaming** | Apache Kafka (or Redpanda) |
| **Feature Store Hot** | Redis 7+ (cluster) |
| **Primary Database** | PostgreSQL 15+ |
| **Cache Layer** | Redis |
| **Authentication** | JWT (guests) + mTLS (internal services) |
| **Container Orchestration** | Docker Compose (dev) → Kubernetes (prod) |
| **Observability** | OpenTelemetry + Grafana + Prometheus |

---

# 5. Core Domain Models

## 5.1 Property

```json
{
  "property_id": "H001",
  "name": "Sakala Resort Bali",
  "timezone": "Asia/Makassar",
  "currency": "USD",
  "total_rooms": 120,
  "room_types": ["STD", "DLX", "STE"],
  "channels": ["direct", "booking_com", "expedia", "corporate"],
  "overbooking_tolerance": 0.05,
  "risk_aversion_lambda": 0.25
}
```

## 5.2 Room Type

```json
{
  "room_type_code": "DLX",
  "name": "Deluxe Ocean View",
  "total_inventory": 40,
  "min_price": 230,
  "max_price": 500,
  "default_price": 275,
  "amenities": ["ocean_view", "balcony", "king_bed"],
  "upgrade_from": "STD",
  "upgrade_probability": 0.15
}
```

## 5.3 Booking

```json
{
  "booking_id": "BK-2026-123456",
  "property_id": "H001",
  "room_type": "DLX",
  "rate_plan": "BAR",
  "channel": "direct",
  "arrival_date": "2026-07-15",
  "departure_date": "2026-07-18",
  "los": 3,
  "guests": { "adults": 2, "children": 0 },
  "price_per_night": 275,
  "gross_revenue": 825,
  "commission_rate": 0.0,
  "net_revenue": 825,
  "addons_total": 60,
  "lead_time_days": 45,
  "is_refundable": true,
  "cancellation_policy": "flexible",
  "status": "confirmed",
  "created_at": "2026-06-01T10:15:00Z"
}
```

## 5.4 Rate Plan

```json
{
  "rate_plan_code": "BAR",
  "name": "Best Available Rate",
  "is_refundable": true,
  "deposit_required": false,
  "cancellation_deadline_hours": 48,
  "penalty_amount": 0,
  "min_los": 1,
  "max_los": 30,
  "channels_available": ["direct", "booking_com", "expedia"]
}
```

## 5.5 Inventory Snapshot

```json
{
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "snapshot_time": "2026-06-01T10:00:00Z",
  "inventory": {
    "STD": { "total": 20, "otb": 12, "available": 8, "held": 0 },
    "DLX": { "total": 15, "otb": 10, "available": 5, "held": 0 },
    "STE": { "total": 5, "otb": 3, "available": 2, "held": 0 }
  }
}
```

---

# 6. Microservices Specification

## 6.1 Service Registry

| Service | Port | Language | Responsibility |
|---|---|---|---|
| `booking-engine-api` | 3000 | Node.js | Guest-facing search, checkout, booking CRUD |
| `pricing-gateway` | 8001 | Python FastAPI | Pricing request orchestration |
| `hmrm-engine` | 8002 | Python FastAPI | ML+MC hybrid pricing logic |
| `ml-inference-service` | 8003 | Python FastAPI | ML surrogate model serving |
| `monte-carlo-service` | 8004 | Python FastAPI | Stochastic simulation service |
| `event-collector` | 8005 | Python FastAPI | Kafka event producer |
| `signal-processor` | 8006 | Python (consumer) | Kafka consumer, feature aggregation |
| `conversion-scoring` | 8007 | Python FastAPI | Session conversion probability |
| `feature-store-api` | 8008 | Python FastAPI | Redis/Postgres feature read/write |
| `optimization-service` | 8009 | Python FastAPI | Price solver (scipy.optimize) |
| `rm-dashboard-api` | 8010 | Python FastAPI | Revenue manager data endpoints |

## 6.2 Communication Patterns

- **Synchronous (REST):** Booking Engine API → Pricing Gateway → HMRM Engine → ML/MC/Optimizer
- **Asynchronous (Kafka):** Booking Engine → Event Collector → Kafka → Signal Processor → Feature Store
- **Read-through:** All pricing decisions read from Feature Store (Redis hot layer)

---

# 7. Database Schema

## 7.1 PostgreSQL Tables

### `properties`
```sql
CREATE TABLE properties (
  property_id       VARCHAR(20) PRIMARY KEY,
  name              VARCHAR(255) NOT NULL,
  timezone          VARCHAR(50) NOT NULL,
  currency          CHAR(3) DEFAULT 'USD',
  total_rooms       INT NOT NULL,
  overbooking_tol   DECIMAL(4,3) DEFAULT 0.05,
  risk_lambda       DECIMAL(4,3) DEFAULT 0.25,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### `room_types`
```sql
CREATE TABLE room_types (
  id                SERIAL PRIMARY KEY,
  property_id       VARCHAR(20) REFERENCES properties(property_id),
  room_type_code    VARCHAR(10) NOT NULL,
  name              VARCHAR(255),
  total_inventory   INT NOT NULL,
  min_price         DECIMAL(10,2) NOT NULL,
  max_price         DECIMAL(10,2) NOT NULL,
  default_price     DECIMAL(10,2) NOT NULL,
  upgrade_from      VARCHAR(10),
  upgrade_prob      DECIMAL(4,3) DEFAULT 0.0,
  UNIQUE (property_id, room_type_code)
);
```

### `rate_plans`
```sql
CREATE TABLE rate_plans (
  id                    SERIAL PRIMARY KEY,
  property_id           VARCHAR(20) REFERENCES properties(property_id),
  rate_plan_code        VARCHAR(20) NOT NULL,
  name                  VARCHAR(255),
  is_refundable         BOOLEAN DEFAULT TRUE,
  cancel_deadline_hours INT DEFAULT 48,
  min_los               INT DEFAULT 1,
  max_los               INT DEFAULT 30,
  UNIQUE (property_id, rate_plan_code)
);
```

### `bookings`
```sql
CREATE TABLE bookings (
  booking_id            VARCHAR(50) PRIMARY KEY,
  property_id           VARCHAR(20) REFERENCES properties(property_id),
  room_type             VARCHAR(10) NOT NULL,
  rate_plan             VARCHAR(20) NOT NULL,
  channel               VARCHAR(50) NOT NULL,
  arrival_date          DATE NOT NULL,
  departure_date        DATE NOT NULL,
  los                   INT NOT NULL,
  adults                INT DEFAULT 2,
  children              INT DEFAULT 0,
  price_per_night       DECIMAL(10,2) NOT NULL,
  gross_revenue         DECIMAL(12,2) NOT NULL,
  commission_rate       DECIMAL(5,4) DEFAULT 0,
  commission_amount     DECIMAL(12,2) DEFAULT 0,
  net_revenue           DECIMAL(12,2) NOT NULL,
  addons_total          DECIMAL(12,2) DEFAULT 0,
  lead_time_days        INT,
  is_refundable         BOOLEAN,
  cancellation_policy   VARCHAR(50),
  status                VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled, no_show, checked_in
  guest_email           VARCHAR(255),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at          TIMESTAMPTZ,
  cancellation_reason   VARCHAR(255),
  refund_amount         DECIMAL(12,2)
);

CREATE INDEX idx_bookings_arrival ON bookings(property_id, arrival_date, status);
CREATE INDEX idx_bookings_created ON bookings(created_at);
```

### `inventory_daily`
```sql
CREATE TABLE inventory_daily (
  id              SERIAL PRIMARY KEY,
  property_id     VARCHAR(20) REFERENCES properties(property_id),
  arrival_date    DATE NOT NULL,
  room_type       VARCHAR(10) NOT NULL,
  total           INT NOT NULL,
  otb             INT DEFAULT 0,
  available       INT,
  held            INT DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (property_id, arrival_date, room_type)
);
```

### `pricing_decisions`
```sql
CREATE TABLE pricing_decisions (
  id                  SERIAL PRIMARY KEY,
  property_id         VARCHAR(20),
  arrival_date        DATE NOT NULL,
  decision_time       TIMESTAMPTZ DEFAULT NOW(),
  pricing_mode        VARCHAR(30), -- ML_ONLY, ML_CONTROL_VARIATE, FULL_MC
  prices_before       JSONB,
  prices_after        JSONB,
  expected_net_revenue DECIMAL(15,2),
  revenue_variance    DECIMAL(20,2),
  confidence_low      DECIMAL(15,2),
  confidence_high     DECIMAL(15,2),
  trigger_reason      VARCHAR(100),
  computation_ms      INT
);
```

### `ml_training_events`
```sql
CREATE TABLE ml_training_events (
  id              SERIAL PRIMARY KEY,
  event_id        UUID UNIQUE NOT NULL,
  event_type      VARCHAR(50) NOT NULL,
  property_id     VARCHAR(20),
  arrival_date    DATE,
  payload         JSONB NOT NULL,
  processed       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_events_unprocessed ON ml_training_events(processed, created_at) WHERE processed = FALSE;
```

### `processed_events` (idempotency table)
```sql
CREATE TABLE processed_events (
  event_id    UUID PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
-- TTL via pg_cron: DELETE FROM processed_events WHERE processed_at < NOW() - INTERVAL '7 days';
```

## 7.2 Redis Key Design (Feature Store)

```
# On-the-books by date + room type
otb:{property_id}:{arrival_date}:{room_type}         → INT

# Real-time demand signals per date
demand:search_intensity:{property_id}:{arrival_date}  → FLOAT  (TTL: 1hr)
demand:price_check_freq:{property_id}:{arrival_date}  → FLOAT  (TTL: 1hr)
demand:geo_spike:{property_id}:{arrival_date}         → FLOAT  (TTL: 1hr)

# Conversion & intent per session
session:score:{session_id}                            → FLOAT  (TTL: 30min)
session:cart:{session_id}                             → JSON   (TTL: 30min)

# Competitor index per date
competitor:index:{property_id}:{arrival_date}         → FLOAT  (TTL: 4hr)

# Current recommended prices
prices:recommended:{property_id}:{arrival_date}       → JSON   (TTL: 15min)

# Cancellation velocity
cancel:velocity:{property_id}:{arrival_date}          → FLOAT  (TTL: 1hr)

# Pickup pace (bookings in last 24hrs for a given arrival date)
pickup:pace:{property_id}:{arrival_date}              → FLOAT  (TTL: 6hr)
```

---

# 8. API Contracts — Internal Services

All internal APIs require header: `x-service-name: <service>` and `Authorization: Bearer <internal-jwt>`

## 8.1 Pricing Gateway → HMRM Engine

### `POST /internal/pricing/evaluate`

**Request:**
```json
{
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "los": 3,
  "currency": "USD",
  "room_inventory": { "STD": 20, "DLX": 15, "STE": 5 },
  "otb": { "STD": 12, "DLX": 10, "STE": 3 },
  "real_time_signals": {
    "search_intensity_index": 1.35,
    "conversion_probability": 0.18,
    "competitor_price_index": 1.08,
    "cancellation_velocity_index": 0.95,
    "pickup_pace_index": 1.12,
    "geo_demand_spike_index": 1.25
  },
  "mode": "hybrid",
  "risk_aversion_lambda": 0.25
}
```

**Response:**
```json
{
  "recommended_prices": { "STD": 220, "DLX": 275, "STE": 420 },
  "expected_net_revenue": 51200.45,
  "revenue_variance": 820000.12,
  "confidence_interval": [49000.00, 54000.00],
  "optimization_mode_used": "ML_CONTROL_VARIATE",
  "computation_time_ms": 428,
  "trace_id": "uuid-v4",
  "service_version": "2.0.1"
}
```

## 8.2 HMRM Engine → ML Inference Service

### `POST /internal/ml/predict`

**Request:**
```json
{
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "features": {
    "days_to_arrival": 45,
    "otb_ratio": 0.65,
    "pickup_pace_index": 1.12,
    "search_intensity_index": 1.35,
    "competitor_price_index": 1.08,
    "seasonality_index": 1.20,
    "day_of_week": 6,
    "is_event_day": false,
    "cancellation_velocity_index": 0.95
  },
  "price_vector": { "STD": 220, "DLX": 275, "STE": 420 }
}
```

**Response:**
```json
{
  "expected_revenue": 52500.10,
  "expected_net_revenue": 51200.45,
  "expected_occupancy": { "STD": 0.85, "DLX": 0.78, "STE": 0.60 },
  "elasticity_estimates": { "STD": -1.45, "DLX": -1.20, "STE": -0.95 },
  "prediction_variance_proxy": 650000.00,
  "model_version": "v2026.07.01",
  "trace_id": "uuid-v4"
}
```

## 8.3 HMRM Engine → Monte Carlo Service

### `POST /internal/mc/simulate`

**Request:**
```json
{
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "simulation_runs": 5000,
  "price_vector": { "STD": 220, "DLX": 275, "STE": 420 },
  "distribution_parameters": {
    "arrival_rate_lambda": 18.5,
    "cancellation_rate_by_room": { "STD": 0.22, "DLX": 0.20, "STE": 0.15 },
    "los_distribution": "empirical",
    "channel_mix": { "direct": 0.40, "booking_com": 0.45, "corporate": 0.15 },
    "trade_up_matrix": { "STD_to_DLX": 0.15, "DLX_to_STE": 0.10 },
    "overbooking_tolerance": 0.05
  },
  "control_variate_prediction": 51200.45
}
```

**Response:**
```json
{
  "mc_mean_revenue": 51800.22,
  "mc_adjusted_mean_revenue": 51450.33,
  "mc_variance": 790000.12,
  "control_variate_coefficient": 0.82,
  "overbooking_cost_mean": 1200.00,
  "denied_bookings_mean": 2.3,
  "occupancy_distribution": { "p10": 0.65, "p50": 0.82, "p90": 0.95 },
  "cancellation_adjusted_revenue": 50250.00,
  "simulation_time_ms": 1350,
  "trace_id": "uuid-v4"
}
```

## 8.4 HMRM Engine → Optimization Service

### `POST /internal/optimizer/solve`

**Request:**
```json
{
  "objective": {
    "expected_net_revenue": 51200.45,
    "revenue_variance": 820000.12,
    "lambda": 0.25
  },
  "current_prices": { "STD": 210, "DLX": 265, "STE": 410 },
  "constraints": {
    "inventory": { "STD": 20, "DLX": 15, "STE": 5 },
    "otb": { "STD": 12, "DLX": 10, "STE": 3 },
    "min_price": { "STD": 180, "DLX": 230, "STE": 350 },
    "max_price": { "STD": 300, "DLX": 400, "STE": 650 },
    "max_price_delta_pct": 0.15,
    "rate_fences": { "STD_DLX_min_diff": 30, "DLX_STE_min_diff": 100 },
    "min_los": 1
  }
}
```

**Response:**
```json
{
  "optimal_prices": { "STD": 225, "DLX": 280, "STE": 430 },
  "objective_value": 50150.22,
  "solver_status": "optimal",
  "constraint_violations": [],
  "trace_id": "uuid-v4"
}
```

## 8.5 Feature Store API

### `POST /internal/features/update`
```json
{
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "metrics": {
    "search_intensity_index": 1.42,
    "price_check_frequency": 2.8,
    "geo_demand_spike_index": 1.25,
    "cart_abandonment_rate": 0.34,
    "cancellation_velocity_index": 0.95
  }
}
```

### `GET /internal/features/get?property_id=H001&arrival_date=2026-07-15`

**Response:**
```json
{
  "otb": { "STD": 12, "DLX": 10, "STE": 3 },
  "available": { "STD": 8, "DLX": 5, "STE": 2 },
  "search_intensity_index": 1.42,
  "conversion_probability": 0.18,
  "pickup_pace_index": 1.12,
  "competitor_price_index": 1.08,
  "cancellation_velocity_index": 0.95,
  "last_updated": "2026-06-01T10:14:50Z"
}
```

## 8.6 Conversion Scoring Service

### `POST /internal/conversion/score`

**Request:**
```json
{
  "session_id": "abc123",
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "room_type": "DLX",
  "device_type": "mobile",
  "geo_country": "AU",
  "price_offered": 275,
  "search_depth": 4,
  "price_views": 3,
  "time_on_page_seconds": 85,
  "referrer": "google_ads",
  "has_promo_code": false
}
```

**Response:**
```json
{
  "conversion_probability": 0.18,
  "confidence": 0.82,
  "intent_tier": "high",
  "recommended_action": "show_urgency_badge",
  "model_version": "conv_v2026.06",
  "trace_id": "uuid-v4"
}
```

---

# 9. API Contracts — Public Booking Engine

Base URL: `https://api.{hotel-domain}.com/v1`

All public endpoints require `Content-Type: application/json`. Rate limit: 100 req/min per IP.

## 9.1 Search Availability

### `POST /booking/search`

**Request:**
```json
{
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "departure_date": "2026-07-18",
  "adults": 2,
  "children": 0,
  "rooms": 1,
  "currency": "USD",
  "promo_code": null
}
```

**Response:**
```json
{
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "departure_date": "2026-07-18",
  "los": 3,
  "currency": "USD",
  "rooms": [
    {
      "room_type": "STD",
      "name": "Standard Garden View",
      "available_count": 8,
      "rate_plans": [
        {
          "rate_plan_code": "BAR",
          "name": "Best Available Rate",
          "price_per_night": 220,
          "total_price": 660,
          "is_refundable": true,
          "cancellation_deadline": "2026-07-13T12:00:00Z",
          "includes_breakfast": false,
          "urgency_badge": null
        },
        {
          "rate_plan_code": "NON_REF",
          "name": "Non-Refundable Rate",
          "price_per_night": 195,
          "total_price": 585,
          "is_refundable": false,
          "discount_pct": 11,
          "urgency_badge": "Save 11%"
        }
      ]
    },
    {
      "room_type": "DLX",
      "name": "Deluxe Ocean View",
      "available_count": 5,
      "rate_plans": [
        {
          "rate_plan_code": "BAR",
          "price_per_night": 275,
          "total_price": 825,
          "is_refundable": true,
          "urgency_badge": "Only 5 left!"
        }
      ]
    }
  ],
  "pricing_note": "Prices may change based on demand",
  "search_id": "uuid-v4"
}
```

## 9.2 Hold Room (Pre-Checkout)

### `POST /booking/hold`

**Request:**
```json
{
  "property_id": "H001",
  "search_id": "uuid-v4",
  "room_type": "DLX",
  "rate_plan_code": "BAR",
  "arrival_date": "2026-07-15",
  "departure_date": "2026-07-18",
  "adults": 2,
  "children": 0,
  "session_id": "abc123"
}
```

**Response:**
```json
{
  "hold_id": "HOLD-abc123-DLX",
  "expires_at": "2026-06-01T10:30:00Z",
  "room_type": "DLX",
  "price_per_night": 275,
  "total_price": 825,
  "addons_available": [
    { "code": "BREAKFAST", "name": "Daily Breakfast", "price_per_night": 20 },
    { "code": "AIRPORT_TRANSFER", "name": "Airport Transfer", "price": 45 }
  ]
}
```

## 9.3 Confirm Booking

### `POST /booking/confirm`

**Request:**
```json
{
  "hold_id": "HOLD-abc123-DLX",
  "guest": {
    "first_name": "James",
    "last_name": "Wilson",
    "email": "james.wilson@email.com",
    "phone": "+61412345678",
    "country": "AU"
  },
  "addons": [
    { "code": "BREAKFAST", "quantity": 2 }
  ],
  "special_requests": "High floor preferred",
  "payment": {
    "method": "credit_card",
    "token": "stripe_payment_method_id"
  },
  "session_id": "abc123"
}
```

**Response:**
```json
{
  "booking_id": "BK-2026-123456",
  "status": "confirmed",
  "arrival_date": "2026-07-15",
  "departure_date": "2026-07-18",
  "room_type": "DLX",
  "rate_plan": "BAR",
  "price_per_night": 275,
  "gross_revenue": 825,
  "addons_total": 120,
  "total_charged": 945,
  "cancellation_deadline": "2026-07-13T12:00:00Z",
  "confirmation_email_sent": true,
  "voucher_url": "https://..."
}
```

## 9.4 Cancel Booking

### `POST /booking/{booking_id}/cancel`

**Request:**
```json
{
  "reason": "change_of_plan"
}
```

**Response:**
```json
{
  "booking_id": "BK-2026-123456",
  "status": "cancelled",
  "refund_amount": 825.00,
  "refund_status": "pending",
  "refund_eta_days": 5
}
```

## 9.5 Get Booking

### `GET /booking/{booking_id}`

Returns full booking object (see Section 5.3).

---

# 10. Event Schema Contract

## 10.1 Global Event Envelope

Every event MUST use this wrapper before publishing to Kafka:

```json
{
  "event_id": "uuid-v4",
  "event_type": "string",
  "event_version": "1.0.0",
  "source": "booking_engine",
  "property_id": "H001",
  "timestamp_utc": "2026-06-01T10:15:30Z",
  "correlation_id": "uuid-v4",
  "session_id": "string",
  "user_id": "string|null",
  "trace_id": "uuid-v4",
  "payload": {}
}
```

**Envelope Field Rules:**
- `event_id` — UUID v4, unique per event, used for idempotency
- `event_version` — semver; minor version = backward compatible, major = breaking
- `correlation_id` — same UUID across entire session flow
- All monetary values: numeric, 2 decimal places, positive or zero
- All dates: ISO 8601; all timestamps: UTC

## 10.2 Event Types

### `search`
```json
{
  "arrival_date": "2026-07-15",
  "departure_date": "2026-07-18",
  "los": 3,
  "guests": { "adults": 2, "children": 1 },
  "rooms_requested": 1,
  "promo_code": null,
  "geo": { "country": "AU", "city": "Sydney" },
  "device": { "type": "mobile", "os": "iOS", "browser": "Safari" },
  "referrer": "google_ads",
  "rate_plan_filter": ["BAR", "NON_REF"]
}
```

### `price_view`
```json
{
  "arrival_date": "2026-07-15",
  "search_id": "uuid-v4",
  "room_types_displayed": [
    { "room_type": "STD", "price": 220, "currency": "USD", "rate_plan": "BAR", "inventory_remaining": 8 },
    { "room_type": "DLX", "price": 275, "currency": "USD", "rate_plan": "BAR", "inventory_remaining": 5 }
  ],
  "competitor_price_index_snapshot": 1.08
}
```

### `room_view`
```json
{
  "arrival_date": "2026-07-15",
  "room_type": "DLX",
  "rate_plan": "BAR",
  "price_displayed": 275,
  "time_spent_seconds": 42
}
```

### `add_to_cart`
```json
{
  "arrival_date": "2026-07-15",
  "room_type": "DLX",
  "rate_plan": "BAR",
  "price": 275,
  "currency": "USD",
  "los": 3,
  "inventory_snapshot": 5
}
```

### `checkout_start`
```json
{
  "arrival_date": "2026-07-15",
  "room_type": "DLX",
  "price": 275,
  "rate_plan": "BAR",
  "payment_method_selected": "credit_card",
  "add_ons": [{ "code": "BREAKFAST", "price": 20 }]
}
```

### `booking_confirmed`
```json
{
  "booking_id": "BK-2026-123456",
  "arrival_date": "2026-07-15",
  "departure_date": "2026-07-18",
  "los": 3,
  "room_type": "DLX",
  "rate_plan": "BAR",
  "channel": "direct",
  "price_paid": 275,
  "currency": "USD",
  "gross_revenue": 825,
  "net_revenue": 825,
  "commission_amount": 0,
  "lead_time_days": 45,
  "cancellation_policy": "flexible",
  "is_refundable": true,
  "addons_total": 120
}
```

### `booking_cancelled`
```json
{
  "booking_id": "BK-2026-123456",
  "arrival_date": "2026-07-15",
  "room_type": "DLX",
  "cancel_timestamp_utc": "2026-07-01T08:15:00Z",
  "days_before_arrival": 14,
  "refund_amount": 825.00,
  "cancellation_reason": "change_of_plan"
}
```

### `session_timeout`
```json
{
  "last_step": "checkout_start",
  "arrival_date": "2026-07-15",
  "time_since_last_action_seconds": 900,
  "cart_value": 825
}
```

### `demand_surge_detected` (system-generated)
```json
{
  "arrival_date": "2026-07-15",
  "search_intensity_index": 1.52,
  "surge_threshold": 1.30,
  "geo_concentration": { "AU": 0.45, "SG": 0.20 }
}
```

### `price_recommendation_applied` (system-generated)
```json
{
  "arrival_date": "2026-07-15",
  "previous_prices": { "STD": 210, "DLX": 265, "STE": 410 },
  "new_prices": { "STD": 220, "DLX": 275, "STE": 420 },
  "trigger_reason": "search_surge",
  "pricing_mode": "ML_CONTROL_VARIATE",
  "expected_revenue_uplift_pct": 4.2
}
```

## 10.3 Kafka Topic Design

| Topic | Partition Key | Purpose | Retention |
|---|---|---|---|
| `booking.events` | `property_id:arrival_date` | All user funnel events | 30 days |
| `booking.confirmed` | `property_id:arrival_date` | Confirmed bookings only | 365 days |
| `booking.cancelled` | `property_id:arrival_date` | Cancellation events | 365 days |
| `rm.signals` | `property_id:arrival_date` | Derived demand signals | 7 days |
| `rm.pricing.decisions` | `property_id:arrival_date` | Applied pricing logs | 365 days |

**Idempotency:** Signal processor must check `processed_events` table before processing. Ignore duplicate `event_id`.

---

# 11. ML & Monte Carlo Engine Design

## 11.1 ML Surrogate Model

### Objective
Predict without running full simulation:
- Expected net revenue for given price vector
- Expected occupancy per room type
- Price elasticity estimates per room type
- Cancellation-adjusted demand

### Feature Set

| Feature | Description | Type |
|---|---|---|
| `days_to_arrival` | Booking window | INT |
| `otb_ratio` | OTB / total inventory | FLOAT |
| `pickup_pace_index` | Bookings pace vs historical norm | FLOAT |
| `search_intensity_index` | Real-time search demand index | FLOAT |
| `competitor_price_index` | Competitor price vs own price | FLOAT |
| `seasonality_index` | Historical seasonal multiplier | FLOAT |
| `day_of_week` | 0=Monday, 6=Sunday | INT |
| `is_event_day` | Local event flag | BOOL |
| `cancellation_velocity` | Current cancellation rate | FLOAT |
| `geo_demand_spike` | Geographic demand concentration | FLOAT |
| `price_STD`, `price_DLX`, `price_STE` | Proposed price vector | FLOAT |
| `price_ladder_STD_DLX` | DLX − STD price difference | FLOAT |
| `price_ladder_DLX_STE` | STE − DLX price difference | FLOAT |

### Model Architecture
- **Primary:** LightGBM (gradient boosting) — fast inference, handles tabular data well
- **Fallback:** XGBoost
- **Retraining cadence:** Weekly (minimum), drift-triggered
- **Training data:** Historical `booking_confirmed` events + `pricing_decisions` logs
- **Target:** `net_revenue` per arrival date

### Retraining Pipeline
```
booking.confirmed (Kafka) 
→ ml_training_events table (Postgres) 
→ Weekly batch job: feature engineering → model training → validation 
→ Model Registry (MLflow or S3) 
→ ML Inference Service hot-reload
```

## 11.2 Monte Carlo Simulation Design

### Simulation Flow (per scenario run)

1. Sample demand arrival count from Poisson(λ × demand_index)
2. For each arrival: sample booking timing (lead time distribution)
3. Assign channel (multinomial from channel mix)
4. Sample room-type preference (multinomial + price elasticity effect)
5. Apply price elasticity: demand reduction = elasticity × (price/base_price − 1)
6. Apply upgrade/trade-up probability matrix
7. Simulate cancellation: Bernoulli(p_cancel) per booking, time-dependent
8. Apply overbooking logic (accept/deny based on tolerance)
9. Calculate per-run output

### Per-Simulation Output
```python
{
    "arrival_date": "2026-07-15",
    "price_vector": {"STD": 220, "DLX": 275, "STE": 420},
    "final_occupancy": {"STD": 0.85, "DLX": 0.78, "STE": 0.60},
    "gross_revenue": 52000.00,
    "net_revenue": 50800.00,
    "adr": 262.00,
    "revpar": 220.00,
    "cancellations": {"STD": 2, "DLX": 1, "STE": 0},
    "overbooking_cost": 0.00,
    "denied_bookings": 0
}
```

### Control Variate Variance Reduction

The adjusted Monte Carlo estimator using ML prediction as control variate:

```
mc_adjusted = mc_mean + c* × (ml_prediction − mc_mean_f)

where c* = -Cov(mc_output, ml_prediction) / Var(ml_prediction)
```

This reduces variance of the revenue estimate by 30–50% vs. plain Monte Carlo.

## 11.3 Pricing Modes

| Mode | When Used | Latency | MC Runs |
|---|---|---|---|
| **ML_ONLY** | Routine pricing, search events | <150ms | 0 |
| **ML_CONTROL_VARIATE** | High-value dates, OTB change >5% | <2s | 500–1000 |
| **FULL_MC** | Stress testing, batch strategy planning | Batch | 10,000–50,000 |

## 11.4 Optimization Objective

```
Maximize: E[NetRevenue(p)] − λ × Var(Revenue)

Subject to:
  - inventory[r] − otb[r] ≥ 0  ∀ room_type r
  - min_price[r] ≤ p[r] ≤ max_price[r]
  - |p[r] − p_prev[r]| / p_prev[r] ≤ max_delta_pct
  - p[DLX] − p[STD] ≥ min_ladder_gap
  - p[STE] − p[DLX] ≥ min_ladder_gap
  - LOS constraints apply per rate plan
```

---

# 12. Booking Engine Frontend

## 12.1 Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | `HomePage` | Property hero, search widget |
| `/search` | `SearchResultsPage` | Available rooms for selected dates |
| `/room/:type` | `RoomDetailPage` | Room details, photos, amenities |
| `/checkout` | `CheckoutPage` | Guest info, addons, payment |
| `/confirmation/:id` | `ConfirmationPage` | Booking confirmation, voucher |
| `/manage/:id` | `ManageBookingPage` | View/cancel booking |

## 12.2 Search Widget Component

```typescript
interface SearchWidgetProps {
  propertyId: string;
  defaultCurrency?: string;
}

interface SearchFormState {
  arrivalDate: Date | null;
  departureDate: Date | null;
  adults: number;
  children: number;
  rooms: number;
  promoCode: string;
}
```

## 12.3 Room Card Component

```typescript
interface RoomCardProps {
  roomType: string;
  name: string;
  description: string;
  images: string[];
  amenities: string[];
  ratePlans: RatePlan[];
  availableCount: number;
  urgencyBadge?: string;     // "Only 3 left!", "High demand"
  onSelect: (ratePlan: RatePlan) => void;
}
```

## 12.4 Dynamic Pricing Display Rules

```typescript
// Urgency badges (driven by HMRM signals)
const getUrgencyBadge = (availableCount: number, searchIntensity: number): string | null => {
  if (availableCount <= 3) return `Only ${availableCount} left!`;
  if (searchIntensity > 1.5) return "High demand today";
  if (availableCount <= 6) return `${availableCount} rooms remaining`;
  return null;
};

// Countdown timer (driven by conversion score)
const showCountdown = (conversionScore: number, holdExpiresAt: Date): boolean => {
  return conversionScore > 0.15;
};
```

## 12.5 Booking Engine State Management

```typescript
// React Query keys
const queryKeys = {
  search: (params: SearchParams) => ['search', params],
  roomDetail: (propertyId: string, roomType: string) => ['room', propertyId, roomType],
  hold: (holdId: string) => ['hold', holdId],
  booking: (bookingId: string) => ['booking', bookingId],
};

// Event tracking (fires to Event Collector API)
const trackEvent = async (eventType: string, payload: object) => {
  await fetch('/api/events', {
    method: 'POST',
    body: JSON.stringify({ event_type: eventType, ...payload, session_id: getSessionId() })
  });
};
```

---

# 13. Revenue Management Dashboard

## 13.1 Dashboard Pages

| Page | Path | Description |
|---|---|---|
| **Overview** | `/rm` | KPI summary, RevPAR, ADR, Occ% |
| **Pricing** | `/rm/pricing` | Daily price grid, recommendations |
| **Forecast** | `/rm/forecast` | Demand forecast, booking curves |
| **Scenarios** | `/rm/scenarios` | Stress test, competitor simulations |
| **Channel Mix** | `/rm/channels` | OTA vs Direct analysis |
| **Reports** | `/rm/reports` | Revenue reports, exports |
| **Settings** | `/rm/settings` | Risk lambda, price fences, channels |

## 13.2 Pricing Grid Component

```typescript
interface PricingGridRow {
  arrivalDate: string;
  dayOfWeek: string;
  inventory: Record<RoomType, number>;
  otb: Record<RoomType, number>;
  occupancyPct: number;
  currentPrices: Record<RoomType, number>;
  recommendedPrices: Record<RoomType, number>;
  expectedRevenue: number;
  confidenceInterval: [number, number];
  pricingMode: 'ML_ONLY' | 'ML_CONTROL_VARIATE' | 'FULL_MC';
  triggerReason?: string;
  isHighDemand: boolean;
}
```

## 13.3 KPI Cards

```typescript
const kpiCards = [
  { key: 'revpar', label: 'RevPAR', format: 'currency', target: '+5% vs last year' },
  { key: 'adr', label: 'ADR', format: 'currency' },
  { key: 'occupancy', label: 'Occupancy', format: 'percent' },
  { key: 'net_revenue', label: 'Net Revenue', format: 'currency' },
  { key: 'direct_share', label: 'Direct Booking %', format: 'percent', target: '>40%' },
  { key: 'cancellation_rate', label: 'Cancellation Rate', format: 'percent', target: '<25%' },
];
```

## 13.4 Scenario Simulation (Stress Test) Endpoint

### `POST /rm/scenario/simulate`

**Request:**
```json
{
  "property_id": "H001",
  "arrival_date": "2026-07-15",
  "scenario": {
    "name": "Competitor drops 15%",
    "competitor_price_index": 0.85,
    "demand_shock_multiplier": 1.0,
    "cancellation_rate_multiplier": 1.0
  },
  "simulation_runs": 5000
}
```

**Response:**
```json
{
  "scenario_name": "Competitor drops 15%",
  "baseline_revenue": 51200.45,
  "scenario_revenue": 47800.00,
  "revenue_impact": -3400.45,
  "revenue_impact_pct": -6.6,
  "recommended_response_prices": { "STD": 205, "DLX": 255, "STE": 395 },
  "confidence_interval": [45000, 51000]
}
```

---

# 14. Pricing Logic & Trigger Rules

## 14.1 Soft Trigger → ML_ONLY Mode

Fires when any of:
- `search_intensity_index > 1.30` for a given arrival date
- High-intent session detected (`conversion_probability > 0.20`)
- Price comparison behavior detected (price_views ≥ 3 in session)

**Action:** Call ML surrogate → update price suggestion in Redis (TTL 15 min)

## 14.2 Strong Trigger → ML_CONTROL_VARIATE Mode

Fires when any of:
- OTB change > 5% in last 2 hours
- Booking pace deviation > 15% vs historical norm
- Cancellation velocity spike > 20% above 7-day average
- Competitor price shift > 10%
- High-value date (peak season / event day)

**Action:** ML + reduced MC (500–1000 runs) → risk-adjusted pricing

## 14.3 Batch Trigger → FULL_MC Mode

Fires:
- Nightly batch for next 90 days
- Weekly strategic planning run
- Manual trigger by Revenue Manager
- Model drift detected

## 14.4 Rate Lock (Anti-Oscillation) Rules

```python
# Prevent price whipsawing
if abs(new_price[r] - current_price[r]) / current_price[r] < 0.02:
    skip_update()  # Less than 2% change — don't update

# Minimum time between repricing (per arrival date)
REPRICE_COOLDOWN_MINUTES = 30

# Confidence gate: only apply if CI is narrow enough
if (ci_high - ci_low) / expected_revenue > 0.15:
    hold_recommendation()  # Too uncertain to act
```

## 14.5 Conversion × Pricing Objective

For sessions with high conversion intent, adjust objective:

```
Maximize: E[NetRevenue(p)] × ConversionProbability(p, session)
```

This enables:
- Aggressive pricing when high intent detected
- Defensive pricing (offer discount) when conversion is dropping
- Trigger countdown timer + urgency badge when `conversion_probability > 0.15 AND decreasing`

---

# 15. KPIs & Validation Framework

## 15.1 Business KPIs

| KPI | Target | Measurement |
|---|---|---|
| RevPAR uplift vs baseline | +3–7% | Monthly |
| Net revenue uplift | +4–8% | Monthly |
| Direct booking share | ≥40% | Monthly |
| OTA commission cost reduction | ≥2% mix shift | Quarterly |
| Cancellation forecast accuracy | MAPE < 15% | Weekly |
| Pricing response time (ML mode) | <150ms p99 | Real-time |
| Pricing response time (Hybrid) | <2s p99 | Real-time |

## 15.2 ML Model Metrics

| Metric | Target |
|---|---|
| Revenue prediction MAPE | <8% |
| Occupancy prediction MAPE | <10% |
| Elasticity R² | >0.75 |
| Variance reduction vs pure MC | ≥30% |

## 15.3 Backtesting Framework

Compare 4 strategies on historical data:

1. **Baseline RMS** — current static pricing
2. **Pure ML Pricing** — ML surrogate only, no MC
3. **Pure Monte Carlo** — full MC, no ML
4. **Hybrid ML–MC** — this system

Evaluation metrics:
- Out-of-sample revenue per available room (RevPAR)
- Booking curve alignment (RMSE vs actual)
- Overbooking cost accuracy
- Cancellation forecast accuracy

---

# 16. Security & Compliance

## 16.1 Authentication

| Layer | Method |
|---|---|
| Guest API | JWT (short-lived, 1hr) issued at checkout start |
| Revenue Manager Dashboard | OAuth2 / Auth0 |
| Internal Services | mTLS + internal JWT signed with shared secret |
| Kafka | SASL/SCRAM-SHA-512 |

## 16.2 Required Headers (Internal APIs)

```http
x-service-name: pricing-gateway
x-correlation-id: uuid-v4
Authorization: Bearer <internal-jwt>
Content-Type: application/json
```

## 16.3 Observability

Every response body must include:
```json
{
  "trace_id": "uuid-v4",
  "service_version": "2.0.1"
}
```

Distributed tracing: OpenTelemetry → Jaeger / Grafana Tempo

## 16.4 PCI Compliance

- Never store raw credit card data; use Stripe payment tokens only
- PCI-DSS scope limited to Stripe tokenization flow
- All payment data transmitted via HTTPS TLS 1.3+

## 16.5 Data Privacy

- Guest PII (email, phone) encrypted at rest (Postgres column encryption)
- Session data in Redis: TTL 30 minutes, no PII stored
- Booking data retained 7 years (tax compliance)
- Right-to-deletion: anonymize guest fields on request (GDPR)

---

# 17. Infrastructure & Deployment

## 17.1 Docker Compose (Development)

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hmrm
      POSTGRES_USER: hmrm
      POSTGRES_PASSWORD: secret

  redis:
    image: redis:7-cluster

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on: [zookeeper]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0

  booking-engine-api:
    build: ./services/booking-engine-api
    ports: ["3000:3000"]
    depends_on: [postgres, redis, kafka]

  pricing-gateway:
    build: ./services/pricing-gateway
    ports: ["8001:8001"]
    depends_on: [hmrm-engine, feature-store-api]

  hmrm-engine:
    build: ./services/hmrm-engine
    ports: ["8002:8002"]

  ml-inference-service:
    build: ./services/ml-inference
    ports: ["8003:8003"]
    volumes: ["./models:/models"]

  monte-carlo-service:
    build: ./services/monte-carlo
    ports: ["8004:8004"]

  event-collector:
    build: ./services/event-collector
    ports: ["8005:8005"]

  signal-processor:
    build: ./services/signal-processor
    depends_on: [kafka, redis, postgres]

  conversion-scoring:
    build: ./services/conversion-scoring
    ports: ["8007:8007"]

  feature-store-api:
    build: ./services/feature-store-api
    ports: ["8008:8008"]
    depends_on: [redis, postgres]

  rm-dashboard-api:
    build: ./services/rm-dashboard-api
    ports: ["8010:8010"]

  booking-engine-frontend:
    build: ./frontend/booking-engine
    ports: ["3001:3000"]

  rm-dashboard-frontend:
    build: ./frontend/rm-dashboard
    ports: ["3002:3000"]
```

## 17.2 SLA Targets

| Service | Latency P99 | Availability |
|---|---|---|
| Booking Engine API (search) | <300ms | 99.9% |
| Pricing Gateway (ML mode) | <150ms | 99.9% |
| Pricing Gateway (hybrid) | <2s | 99.5% |
| ML Inference Service | <100ms | 99.9% |
| Feature Store (Redis) | <20ms | 99.99% |
| Monte Carlo Service | <3s | 99.5% |
| Signal Processor (per event) | <50ms | 99.5% |

## 17.3 Scalability

| Component | Scaling Strategy |
|---|---|
| Booking Engine API | Horizontal (stateless replicas) |
| Pricing Gateway | Horizontal (stateless) |
| ML Inference Service | Horizontal (GPU optional for neural models) |
| Monte Carlo Service | Parallel workers (Ray / Celery) |
| Signal Processor | Kafka consumer group (horizontal) |
| Feature Store | Redis cluster (sharded by property_id) |
| Postgres | Read replicas for analytics queries |

---

# 18. Phase Roadmap

## Phase 1 — Single Property MVP (Months 1–3)

**Deliverables:**
- Booking Engine (Next.js): search, checkout, confirmation, cancellation
- Booking Engine API: availability, hold, confirm, cancel
- Event Collector + Kafka topic setup
- Feature Store (Redis + Postgres)
- ML Inference Service (initial LightGBM model trained on historical data)
- Pricing Gateway (ML_ONLY mode)
- Revenue Manager Dashboard: pricing grid + KPI overview
- Daily pricing recommendations via ML surrogate

**Go-live criteria:** Revenue Manager can view and apply pricing recommendations daily

## Phase 2 — Hybrid Engine + Risk Pricing (Months 4–6)

**Deliverables:**
- Monte Carlo Service
- HMRM Engine (control variate integration)
- Optimization Service (variance-penalized objective)
- Conversion Scoring Service
- Dynamic urgency badges + countdown on Booking Engine
- Aggressive push logic (intent-based pricing adjustment)
- Scenario stress-testing in RM Dashboard
- Closed-loop ML retraining pipeline (weekly)

**Go-live criteria:** System auto-reprices for peak dates using Hybrid mode

## Phase 3 — Full Automation + Multi-Property (Months 7–12)

**Deliverables:**
- Fully automated closed-loop: signal → reprice → learn
- Multi-property portfolio dashboard
- Cross-property demand spillover modeling
- Centralized model registry (MLflow)
- Drift detection + auto-triggered retraining
- Channel manager integration (SiteMinder / ChannelManager API)
- OTA parity monitoring
- Revenue forecasting (30/60/90 day forward view)
- Full CI/CD pipeline + production Kubernetes deployment

---

# Executive Summary

The HMRM Engine delivers a **full-stack hotel revenue management and booking platform** with:

- A **guest-facing Booking Engine** with real-time dynamic pricing and intent-aware urgency signals
- A **Revenue Manager Dashboard** with pricing control, forecasting, scenario simulation, and KPI monitoring
- A **Hybrid ML + Monte Carlo pricing engine** that models demand uncertainty, reduces pricing variance by ≥30%, and optimizes risk-adjusted revenue under real-world hotel constraints
- A **closed-loop learning architecture** that continuously improves from actual booking outcomes

**Key differentiators vs. traditional RMS:**
- Explicit uncertainty quantification (not just point forecasts)
- Risk-aware pricing (variance-penalized objective)
- Intent-driven pricing (conversion probability × revenue objective)
- Real-time demand signal integration (sub-second response)
- Channel profitability optimization (not just occupancy)

**Target outcomes:** +3–7% RevPAR uplift, ≥2% direct booking mix shift away from OTA, <150ms pricing response time in daily mode.

---

*PRD Version 2.0 — Ready for LLM-assisted development. All schemas, APIs, and data models are production-specified.*
