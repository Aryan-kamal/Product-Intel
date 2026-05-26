# Product Intelligence Dashboard

A web app for e-commerce sellers to monitor product listing quality, track competitor prices, and get actionable alerts — built as part of the Quantacus assessment.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, TanStack Query, Recharts |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL (Neon) |
| Video Processing | FFmpeg (frame extraction) + Vision API via OpenRouter |
| API Docs | Swagger / OpenAPI |

## Architecture

```
┌──────────────────────┐         ┌─────────────────────────────┐
│  React Frontend      │  REST   │  Express Backend            │
│                      │ ──────► │                             │
│  - Dashboard         │         │  - REST API Routes          │
│  - Upload (Video/CSV)│         │  - Validation Engine        │
│  - Products List     │         │  - Video Processor (FFmpeg) │
│  - Product Detail    │         │  - Price Comparator         │
│  - Competitor Pricing│         │  - Alert Engine             │
│  - Jobs Monitor      │         │  - Prisma ORM              │
│  - Alerts            │         └──────────┬──────────────────┘
└──────────────────────┘                    │
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

## Assessment Requirements — What's Implemented

### Core Features (from PDF)

1. **Product Data Ingestion**
   - Video upload — extracts frames using FFmpeg, sends to Vision API to identify product attributes (title, brand, price, category, etc.)
   - CSV upload — parses product feed CSVs and ingests into the database
   - Both methods trigger validation and quality scoring automatically

2. **Product Listing Quality Analysis**
   - 11 rule-based validation checks with HIGH / MEDIUM / LOW severity
   - Quality score calculated per product (starts at 100, deductions per issue)
   - Issues include: missing title, missing image, invalid price, MRP inconsistencies, weak descriptions, missing attributes, etc.

3. **Competitor Price Tracking**
   - CSV import for competitor prices across platforms (Amazon, Myntra, Ajio, etc.)
   - Mock price generation for demo purposes
   - Gap analysis: lowest, highest, average competitor price, percentage difference
   - Per-product and all-products comparison views
   - Actionable pricing recommendations

4. **Quality Dashboard**
   - Summary cards: total products, weak listings, missing images, invalid prices, high-severity issues
   - Bar chart for issue distribution by type
   - Pie chart for severity breakdown
   - Quality score ring with average score

5. **Automated Alerts**
   - Generated automatically when quality score drops below thresholds or pricing gaps are detected
   - Severity-tagged (HIGH / MEDIUM / LOW)
   - Mark as read / mark all read functionality

6. **Title Enhancement**
   - Rule-based title improvement (not AI — deterministic logic)
   - Extracts brand, category, color, size, material and restructures the title
   - Shows extracted attributes and suggested keywords

7. **Job Tracking**
   - Background processing with status updates (PENDING → RUNNING → COMPLETED/FAILED)
   - Progress percentage and timestamps
   - Auto-refreshing job list

### Bonus Features (from PDF)

1. **Price History Chart** — Line chart on each product's detail page showing our price vs competitor prices over time, using Recharts
2. **Downloadable Quality Report** — CSV export from the dashboard with all products, scores, issues, competitor data, and recommendations

### Additional Features (beyond the PDF)

1. **Authentication** — JWT-based login/register with protected API routes and persistent sessions
2. **Dark / Light Theme** — Toggle between themes with a button in the navbar; persisted in localStorage
3. **Sidebar + Navbar Layout** — Left sidebar for main pages (Dashboard, Upload, Products, Pricing), top navbar for Jobs, Alerts, and user actions
4. **Competitor Pricing Overview Page** — Dedicated page showing price comparison for all products at a glance with expandable cards
5. **Filtering, Sorting, Pagination** — Products list supports filtering by severity/category/brand/availability, search by SKU or title, sorting by score/price/date, and pagination
6. **Swagger API Docs** — Interactive API documentation at `/api-docs`
7. **Consistent Error Handling** — All API errors return `{ success: false, message: "..." }` format
8. **Loading, Empty, and Error States** — Every page has proper UI states for loading, empty data, and errors
9. **Responsive Design** — Works on desktop and mobile with collapsible sidebar
10. **File Cleanup** — Temporary video/frame files are deleted after processing

## How to Run Locally

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use [Neon](https://neon.tech) free tier)
- OpenRouter API key (for video processing) — [Get one here](https://openrouter.ai)

### Backend

```bash
cd backend
npm install

# Create .env file with these variables:
# DATABASE_URL=postgresql://...@neon.tech/dbname?sslmode=require
# OPENROUTER_API_KEY=your_key_here
# JWT_SECRET=any_secret_string
# PORT=3001
# CLIENT_URL=http://localhost:5173

# Run database migrations
npx prisma migrate dev

# Start server
npm run dev
```

### Frontend

```bash
cd frontend
npm install

# Optional: create .env with VITE_API_URL=http://localhost:3001/api
# (defaults to localhost:3001 if not set)

npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

## How to Use

1. **Register/Login** — Create an account on the login page
2. **Upload** — Go to Upload, pick Video or CSV mode, and submit a file
3. **Monitor Jobs** — Check processing progress on the Jobs page (auto-refreshes)
4. **Dashboard** — View quality metrics, issue charts, and download the quality report
5. **Products** — Browse all products, filter/search/sort, click into any product for full details
6. **Product Detail** — See extracted data, issues with fix suggestions, enhanced title, competitor prices, and price history chart
7. **Competitor Pricing** — Upload a competitor CSV or generate mock data; view all-products price comparison
8. **Alerts** — Review alerts by severity, mark as read

## Sample Data

Two sample CSV files are included for quick testing:

- `sample-data/products.csv` — 38 products across 7 categories with intentional data issues (missing titles, invalid prices, MRP inconsistencies, missing images, out-of-stock items)
- `sample-data/competitor-prices.csv` — 120+ competitor price entries across multiple platforms with multi-date history for chart visualization

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/upload-video` | Upload product video |
| POST | `/api/upload-products-csv` | Upload product CSV |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/:jobId` | Get job details |
| GET | `/api/products` | List products (paginated, filterable) |
| GET | `/api/products/:skuId` | Get product details |
| POST | `/api/products/:skuId/enhance-title` | Generate enhanced title |
| GET | `/api/products/:skuId/issues` | Get product issues |
| GET | `/api/products/:skuId/price-history` | Get price history for charting |
| GET | `/api/dashboard/quality-summary` | Dashboard metrics |
| GET | `/api/dashboard/quality-report` | Download quality report (CSV) |
| POST | `/api/competitor-prices/upload` | Upload competitor CSV |
| POST | `/api/competitor-prices/refresh` | Generate mock prices |
| POST | `/api/competitor-prices/manual` | Add a manual price entry |
| GET | `/api/products/:skuId/competitor-prices` | Get competitor prices for a product |
| GET | `/api/competitor-prices/all` | Get all products' price comparison |
| GET | `/api/alerts` | List alerts |
| PATCH | `/api/alerts/:alertId/read` | Mark alert as read |
| PATCH | `/api/alerts/mark-all-read` | Mark all alerts read |

Full interactive docs at `/api-docs` (Swagger UI).

## Validation Rules

| Rule | Severity | Trigger |
|------|----------|---------|
| Missing title | HIGH | Title is empty |
| Short title | MEDIUM | Title has fewer than 4 words |
| Missing brand | MEDIUM | Brand field is empty |
| Invalid price | HIGH | Price is non-numeric or ≤ 0 |
| MRP < selling price | HIGH | MRP is lower than the selling price |
| Missing image | HIGH | No image URL provided |
| Broken image URL | MEDIUM | URL format is invalid |
| Duplicate SKU | HIGH | SKU already exists in the database |
| Weak description | LOW | Description is under 20 characters |
| Missing attributes | MEDIUM | 2 or more of color/size/material are missing |
| Out of stock | LOW | Product availability is out_of_stock |

**Quality Score:** Starts at 100. Each HIGH issue deducts 20, MEDIUM deducts 10, LOW deducts 5. Minimum score is 0.

## Data Model

| Model | Key Fields |
|-------|-----------|
| User | id, name, email, password, createdAt |
| Job | id, type (VIDEO/CSV), status, progress, enhanceTitle, fileName, timestamps |
| Product | skuId (unique), productTitle, brand, category, price, mrp, imageUrl, availability, color, size, material, enhancedTitle, qualityScore |
| ProductIssue | skuId (FK), issueType, severity, message, suggestedFix |
| CompetitorPrice | skuId (FK), platform, competitorPrice, currency, lastCheckedAt |
| Alert | skuId (FK), type, severity, message, isRead |

## What's Real vs Mocked

| Feature | Implementation |
|---------|---------------|
| Video frame extraction | Real — FFmpeg extracts frames from uploaded videos |
| Product extraction from video | Real — Vision API (Gemini via OpenRouter) analyzes frames |
| CSV parsing and validation | Real — full parsing with 11 validation rules |
| Title enhancement | Rule-based — deterministic string logic, no AI |
| Competitor prices | Mock generation + real CSV import |
| Price refresh | Simulated — generates random price variations |
| Alerts | Real — auto-generated based on quality and pricing rules |
| Authentication | Real — bcrypt password hashing, JWT tokens |

## Assumptions

- The seller's platform is Flipkart (our prices = Flipkart prices)
- Video processing extracts a middle frame and sends it to the Vision API for analysis
- Competitor prices are mock-generated for demo; CSV upload supports real data
- Job processing is async and in-process (no external queue needed at this scale)
- Temporary files (uploaded videos, extracted frames) are cleaned up after processing

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://...@neon.tech/dbname?sslmode=require
OPENROUTER_API_KEY=your_openrouter_key
JWT_SECRET=any_secret_string
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:3001/api
```
