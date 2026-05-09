# LeadLens — AI Lead Research Tool

> Know everything about a company in 30 seconds.

LeadLens is an AI-powered sales research assistant that takes a company URL and generates a comprehensive research brief with pain points, outreach angles, and personalized cold email drafts.

## The Problem

Sales teams spend 30-45 minutes manually researching each prospect. Most of that time is spent copying and pasting from LinkedIn, Crunchbase, and company websites — repetitive work that doesn't scale.

## The Solution

LeadLens automates the entire research process. Paste a URL, get a comprehensive research brief with actionable pain points and outreach angles in under 60 seconds.

## Features

- **Automated website scraping** — Scrapes homepage, about, team, careers, pricing, and blog pages
- **Tech stack detection** — Identifies 30+ technologies from HTML source and response headers
- **AI-generated pain points** — Evidence-based pain points with confidence scoring (high/medium/low)
- **Personalized outreach angles** — Company-specific approaches with message hooks, not generic templates
- **Cold email generation** — AI-crafted cold emails based on selected outreach angles
- **Batch research** — Research up to 5 companies at once
- **Export options** — PDF report, Markdown (for Notion/Docs), and raw JSON
- **Google search enrichment** — Funding info, recent news, and LinkedIn data (best-effort)

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React (Vite) + TailwindCSS v4 | Fast dev server, modern styling, rapid iteration |
| Backend | Python (FastAPI) | Async-first, type-safe, great for API services |
| AI | Claude API (Anthropic) | Structured analysis with high-quality reasoning |
| Scraping | httpx + BeautifulSoup | Async HTTP with robust HTML parsing |
| Icons | Lucide React | Clean, consistent icon set |
| PDF Export | jsPDF | Client-side PDF generation |

## Architecture

```
URL Input → Web Scraper → Data Enrichment → AI Analysis → Research Brief
               │                │                │
          Homepage +        Tech stack       Claude API
          Subpages          Google search    (claude-sonnet-4-20250514)
          Email extraction  Social links
               │                │                │
          Cache (JSON)    Cache (JSON)      Cache (JSON)
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Backend Setup

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start the server
uvicorn backend.main:app --reload --port 8000
```

### Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

### Open the app

Navigate to [http://localhost:5173](http://localhost:5173)

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI app with CORS and sample data seeding
│   ├── requirements.txt
│   ├── models/
│   │   └── schemas.py          # Pydantic models for all data types
│   ├── routers/
│   │   └── research.py         # API endpoints (/scrape, /enrich, /research, /batch)
│   ├── services/
│   │   ├── scraper.py          # Async web scraper with subpage discovery
│   │   ├── enrichment.py       # Tech stack detection + Google search enrichment
│   │   └── ai_researcher.py    # Claude API integration for research synthesis
│   ├── cache/                  # JSON file cache (auto-created)
│   └── sample_data/            # Pre-built research for sample companies
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # API client functions
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # HomePage and ResultsPage
│   │   └── utils/              # Export utilities and toast context
│   └── vite.config.js          # Vite config with API proxy
├── .env.example
└── README.md
```

## Design Decisions

- **No database** — JSON file caching keyed by domain. Sufficient for the use case and eliminates infrastructure complexity.
- **Simulated progress** — The backend processes the full pipeline and returns the final result. The frontend simulates step-by-step progress on timers for a better UX.
- **Google search is best-effort** — Google aggressively blocks automated requests. The tool handles this gracefully by falling back to AI inference from scraped data.
- **Cache aggressively** — Scrape results cached 24h, enrichment 6h, research 7 days. Avoids redundant API calls during development and demo.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scrape` | Scrape a company website |
| POST | `/api/enrich` | Enrich scraped data with tech stack + Google search |
| POST | `/api/research` | Full pipeline: scrape → enrich → AI analysis |
| POST | `/api/research/batch` | Batch research (max 5 URLs) |
| GET | `/api/research/recent` | List recently researched companies |
| GET | `/api/research/:domain` | Get cached research by domain |
| POST | `/api/research/email` | Generate a cold email for an outreach angle |
| GET | `/api/health` | Health check |
