# Product Intelligence Dashboard

A web app for e-commerce sellers to monitor product listing quality, track competitor prices, and get actionable alerts. Built for the Quantacus internship assignment.

---

## Deployment Links

| Resource | URL |
|----------|-----|
| **Frontend (Vercel)** | https://product-intel-tbeb.vercel.app/ |
| **Backend API (Render)** | https://product-intel.onrender.com |
| **Swagger API Docs** | `{https://product-intel.onrender.com}/api-docs` |
| **GitHub Repo** | https://github.com/Aryan-kamal/Product-Intel |
| **Demo video** | https://drive.google.com/file/d/1vfp3FveQzO6yIVj0MQrQUTk6aiTCbkBz/view?usp=sharing |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, TanStack Query, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL (Neon) |
| Video Processing | FFmpeg (frame extraction) + Vision API via OpenRouter |
| Auth | JWT + bcrypt |
| API Docs | Swagger / OpenAPI |
| Deployment | Vercel (frontend), Render (backend) |

---

## Architecture

```
┌──────────────────────┐         ┌─────────────────────────────┐
│  React Frontend      │  REST   │  Express Backend            │
│  (Vercel)            │ ──────► │  (Render)                   │
│                      │         │                             │
│  Dashboard           │         │  REST API Routes            │
│  Upload (Video/CSV)  │         │  Validation Engine          │
│  Products / Detail   │         │  Video Processor (FFmpeg)   │
│  Competitor Pricing  │         │  Price Comparator           │
│  Jobs / Alerts       │         │  Alert Engine               │
│  Auth                │         │  Prisma ORM                   │
└──────────────────────┘         └──────────┬──────────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │  PostgreSQL (Neon)       │
                               └─────────────────────────┘
                                            │
                               ┌────────────┴───────────┐
                               │                        │
                     ┌─────────▼───────┐   ┌────────────▼────┐
                     │  Vision API     │   │  FFmpeg          │
                     │  (OpenRouter)   │   │  (Frame Extract) │
                     └─────────────────┘   └─────────────────┘
```

**Flow:** User uploads video or CSV → job is created → backend validates products and calculates quality scores → competitor prices are imported or mocked → alerts are generated → dashboard and product pages show results.

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- PostgreSQL (or [Neon](https://neon.tech) free tier)
- OpenRouter API key — [openrouter.ai](https://openrouter.ai)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill DATABASE_URL, OPENROUTER_API_KEY, JWT_SECRET, PORT, CLIENT_URL

npx prisma migrate dev   # or: npx prisma db push
npm run dev
```

Runs at `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:3001/api

npm run dev
```

Runs at `http://localhost:5173`.

---

## How to Use the Deployed App

Same flow as local, but use your Vercel frontend URL:

1. **Register / Login** on the auth page
2. **Upload** → choose Video or CSV, optionally enable title enhancement
3. **Jobs** → monitor processing until complete
4. **Dashboard** → quality metrics, charts, download report
5. **Products** → filter, search, sort, open product detail
6. **Product Detail** → issues, enhanced title, competitor prices, price history chart
7. **Pricing** → upload competitor CSV or refresh mock prices
8. **Alerts** → review and mark as read

---

## Sample Data

| File | Description |
|------|-------------|
| `sample-data/products.csv` | 38 products across 7 categories with intentional data issues for validation testing |
| `sample-data/competitor-prices.csv` | 120+ entries across Amazon, Myntra, Ajio, Nykaa, Tata Cliq, Meesho with multi-date history |

Use these files on Upload and Pricing pages during demo.

---

## API Documentation

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/upload-video` | Upload product video |
| POST | `/api/upload-products-csv` | Upload product CSV |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/:jobId` | Job details |
| GET | `/api/products` | List products (filter, paginate, sort) |
| GET | `/api/products/:skuId` | Product details |
| POST | `/api/products/:skuId/enhance-title` | Generate enhanced title |
| GET | `/api/products/:skuId/issues` | Product issues |
| GET | `/api/products/:skuId/competitor-prices` | Competitor prices + comparison |
| GET | `/api/products/:skuId/price-history` | Price history for chart |
| GET | `/api/dashboard/quality-summary` | Dashboard metrics |
| GET | `/api/dashboard/quality-report` | Download quality CSV report |
| POST | `/api/competitor-prices/upload` | Upload competitor CSV |
| POST | `/api/competitor-prices/refresh` | Simulate price refresh |
| POST | `/api/competitor-prices/manual` | Manual competitor price entry |
| GET | `/api/competitor-prices/all` | All products price comparison |
| GET | `/api/alerts` | List alerts |
| PATCH | `/api/alerts/:alertId/read` | Mark alert read |
| PATCH | `/api/alerts/mark-all-read` | Mark all read |

Interactive docs: `{BACKEND_URL}/api-docs`

All errors return: `{ "success": false, "message": "..." }`

---

## Data Model

| Model | Key Fields |
|-------|-----------|
| **User** | id, name, email, password, createdAt |
| **Job** | id, type (VIDEO/CSV), status, progress, enhanceTitle, fileName, startedAt, completedAt, errorMessage |
| **Product** | skuId (unique), productTitle, brand, category, price, mrp, imageUrl, availability, color, size, material, enhancedTitle, qualityScore |
| **ProductIssue** | skuId, issueType, severity, message, suggestedFix |
| **CompetitorPrice** | skuId, platform, competitorPrice, currency, lastCheckedAt |
| **Alert** | skuId, type, severity, message, isRead |

**Quality score:** starts at 100. Deduct 20 per HIGH issue, 10 per MEDIUM, 5 per LOW (min 0).

---

## Implementation Summary

### Fully implemented

- Video upload + frame extraction (FFmpeg) + Vision API extraction (OpenRouter)
- CSV upload fallback with validation and quality scoring
- Title enhancement flag + rule-based title suggestions
- Quality dashboard with charts and metrics
- Competitor price CSV upload, mock refresh, manual entry, comparison views
- In-app alerts for listing and pricing issues
- Job tracking (PENDING → RUNNING → COMPLETED / FAILED)
- Price history chart (bonus)
- Downloadable quality report CSV (bonus)
- JWT authentication (bonus)
- Swagger API docs (bonus)
- Deployed frontend + backend

### Mocked / simulated

- Competitor price refresh (random variation, not live scraping)
- Most competitor prices unless loaded via CSV
- Title enhancement (rule-based, not AI keyword trends)
- Notifications (in-app only — no email/Slack/WhatsApp)

### Would improve next

- Scheduled background price refresh (cron)
- Retry failed jobs
- Manual product edit UI after video extraction
- Email/Slack alerts
- WebSocket for live job progress
- Docker Compose for one-command local setup
- Automated tests (unit + integration)

---

## What's Real vs Mocked

| Feature | Implementation |
|---------|---------------|
| Video frame extraction | Real (FFmpeg) |
| Product extraction from video | Real (Vision API via OpenRouter) |
| CSV parsing and validation | Real |
| Title enhancement | Rule-based (deterministic) |
| Competitor prices | Mock generation + CSV import |
| Price refresh | Simulated |
| Alerts | Real (rule-based generation) |
| Authentication | Real (JWT + bcrypt) |

---

## Assumptions

- Seller platform is **Flipkart** (our price = Flipkart price)
- One middle frame is extracted from video and sent to the Vision API
- Competitor prices use mock data or CSV — no live scraping
- Jobs run in-process with `setTimeout` (no Redis/queue)
- Temporary upload files are deleted after processing
- Reviewers create their own account on the deployed app

---

## Trade-offs and Limitations

- **Single frame video analysis** — faster and simpler, but less accurate than multi-frame OCR
- **No live price scraping** — avoids legal/technical issues; CSV + mock data used instead
- **In-process jobs** — server restart loses running jobs; fine for demo scale
- **No manual product edit UI** — CSV fallback covers incomplete video extraction
- **Polling for job status** — frontend refreshes every few seconds, not WebSocket
- **Render free tier** — backend may sleep after inactivity (cold start on first request)
- **No sample video file in repo** — CSV sample provided; any short product MP4 works for video demo

---