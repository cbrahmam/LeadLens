# Intelligent Lead Research Tool - Full Project Spec

## Overview
A tool that takes a company URL or name, scrapes publicly available information, and generates a comprehensive research brief using AI. The brief includes company overview, tech stack, recent news, key contacts, estimated size/revenue, and a suggested outreach angle. Think of it as "your AI-powered sales research assistant."

This is something you've literally done manually for your own outreach. Now it's productized. That makes it extremely believable as a portfolio piece.

## Tech Stack
- **Frontend**: React (Vite), TailwindCSS
- **Backend**: Python (FastAPI)
- **AI**: Claude API (Anthropic) for research synthesis and outreach suggestions
- **Web Scraping**: `httpx` for HTTP requests, `beautifulsoup4` for HTML parsing
- **Enrichment APIs**: Clearbit (free tier), or fallback to pure scraping
- **Storage**: Local JSON files (no database needed)
- **Package Manager**: npm for frontend, pip for backend

## IMPORTANT BUILD INSTRUCTIONS
- DO NOT one-shot this build. Break it into the commit blocks below.
- Each block should be a working, testable increment.
- Write clean, well-commented code.
- Test each block before moving to the next.
- Use proper error handling throughout.
- No placeholder or dummy code. Everything should work.

---

## COMMIT BLOCK 1: Project Scaffolding & Scraping Engine

### What to build:
1. Initialize the project structure:
```
lead-research-tool/
├── backend/
│   ├── main.py                # FastAPI app entry point
│   ├── requirements.txt       # Python dependencies
│   ├── routers/
│   │   └── research.py        # Research endpoint router
│   ├── services/
│   │   ├── scraper.py         # Web scraping service
│   │   ├── enrichment.py      # Data enrichment service
│   │   └── ai_researcher.py   # Claude API research synthesis
│   ├── models/
│   │   └── schemas.py         # Pydantic models
│   └── cache/                 # Cache scraped results locally
├── frontend/                  # Will be set up in Block 3
├── README.md
└── .gitignore
```

2. Set up FastAPI with CORS middleware

3. Build the web scraping service (`scraper.py`):
   - Function: `scrape_website(url: str) -> ScrapedData`
   - Fetch the homepage HTML
   - Extract:
     - Page title and meta description
     - All text content from main body (strip nav, footer, scripts)
     - Links to about page, team page, careers page, pricing page, blog
   - If about/team/careers pages are found, scrape those too
   - Extract any emails found on the pages
   - Handle edge cases: sites that block scrapers (return partial data with warning), timeouts, invalid URLs, redirects
   - Use proper User-Agent headers
   - Add rate limiting (1 request per second between page fetches)

4. Build a secondary scraper for LinkedIn company data (public only):
   - Function: `scrape_linkedin_company(company_name: str) -> dict`
   - Search for the company on Google with "site:linkedin.com/company {company_name}"
   - Extract company size, industry, and headquarters from the Google snippet
   - This is best-effort, not guaranteed to return data
   - DO NOT try to scrape LinkedIn directly, just use Google search snippets

5. Create Pydantic schemas:
```python
class ScrapedData(BaseModel):
    url: str
    title: str
    meta_description: str
    body_text: str                    # Cleaned main content
    about_text: Optional[str]         # About page content if found
    team_text: Optional[str]          # Team page content if found
    careers_text: Optional[str]       # Careers page content if found
    emails_found: List[str]
    subpages_scraped: List[str]       # Which additional pages were scraped
    scrape_warnings: List[str]        # Any issues encountered
```

6. Create a `/api/scrape` POST endpoint:
   - Accepts: `{ "url": "https://example.com" }`
   - Validates the URL format
   - Runs the scraper
   - Caches the result as a JSON file in cache/ directory (keyed by domain)
   - Returns ScrapedData

### Test criteria:
- Can submit a URL and get scraped content back
- About/team/careers pages are auto-discovered and scraped
- Emails are extracted from page content
- Invalid URLs return proper error messages
- Cached results are served on repeat requests
- Rate limiting works between page fetches

### Commit message: `feat: project scaffolding and web scraping engine`

---

## COMMIT BLOCK 2: Data Enrichment Service

### What to build:
1. Create the enrichment service (`enrichment.py`):
   - Function: `enrich_company(domain: str, scraped_data: ScrapedData) -> EnrichedData`
   - This layer adds structured data on top of raw scraped content

2. Enrichment sources (use what's freely available):
   
   **Google Search enrichment:**
   - Search Google for "{company_name} funding" to find funding info
   - Search Google for "{company_name} revenue" or "{company_name} employees"
   - Search Google for "{company_name} news" to get recent headlines
   - Parse Google search result snippets for key data points
   - Use `httpx` with proper headers, handle rate limits
   
   **Tech stack detection:**
   - Check the scraped HTML for common tech indicators:
     - JavaScript frameworks (React, Vue, Angular, Next.js) from script tags and page source
     - Analytics tools (Google Analytics, Mixpanel, Segment, Amplitude) from script tags
     - CMS (WordPress, Webflow, Squarespace) from meta tags and page structure
     - Infrastructure hints from response headers (Cloudflare, AWS, Vercel, Netlify)
   - Function: `detect_tech_stack(html: str, headers: dict) -> List[str]`
   
   **Social media links:**
   - Extract from scraped pages: Twitter/X, LinkedIn, GitHub, YouTube links
   - Function: `extract_social_links(html: str) -> dict`

3. Create the enriched data schema:
```python
class FundingInfo(BaseModel):
    total_raised: Optional[str]       # e.g., "$15M"
    last_round: Optional[str]         # e.g., "Series A"
    last_round_date: Optional[str]
    investors: List[str]
    source: str                       # Where this info came from

class CompanyEnrichedData(BaseModel):
    domain: str
    company_name: str
    industry: Optional[str]
    estimated_size: Optional[str]     # e.g., "50-100 employees"
    headquarters: Optional[str]
    tech_stack: List[str]
    social_links: dict                # platform -> URL
    funding: Optional[FundingInfo]
    recent_news: List[str]            # Headlines from Google
    emails_found: List[str]
    raw_scraped: ScrapedData          # Keep the raw data too
```

4. Create an `/api/enrich` POST endpoint:
   - Accepts: `{ "url": "https://example.com" }`
   - First checks cache for existing scrape, runs scraper if not cached
   - Runs enrichment on top of scraped data
   - Returns CompanyEnrichedData

### Test criteria:
- Tech stack detection correctly identifies common frameworks
- Social media links are extracted
- Google search enrichment returns funding/news data (best effort)
- Enrichment handles missing data gracefully (returns null, not errors)
- Full enrichment pipeline completes in under 15 seconds

### Commit message: `feat: data enrichment with tech stack detection and Google search`

---

## COMMIT BLOCK 3: AI Research Synthesis

### What to build:
1. Create the AI researcher service (`ai_researcher.py`):
   - Function: `generate_research_brief(enriched_data: CompanyEnrichedData) -> ResearchBrief`
   - Uses Claude API (model: claude-sonnet-4-20250514)
   - API key from environment variable `ANTHROPIC_API_KEY`

2. Design the prompt to generate a comprehensive research brief:

```python
class KeyContact(BaseModel):
    name: str
    title: str
    relevance: str                    # Why this person matters for outreach

class PainPoint(BaseModel):
    pain: str                         # The likely pain point
    evidence: str                     # What from the research suggests this
    confidence: str                   # "high", "medium", "low"

class OutreachAngle(BaseModel):
    approach: str                     # Short title like "Cost Reduction Play"
    message_hook: str                 # Opening line suggestion
    reasoning: str                    # Why this angle would work
    best_channel: str                 # "email", "linkedin", "cold call"

class CompetitorMention(BaseModel):
    competitor: str
    relationship: str                 # How they compete or compare

class ResearchBrief(BaseModel):
    company_name: str
    one_liner: str                    # One sentence: what this company does
    executive_summary: str            # 3-5 sentence overview
    business_model: str               # How they make money
    target_market: str                # Who their customers are
    company_stage: str                # "Early Stage", "Growth", "Mature"
    estimated_arr: Optional[str]      # AI's best guess based on signals
    key_contacts: List[KeyContact]    # People to reach out to (from team page, LinkedIn)
    pain_points: List[PainPoint]      # Likely pain points based on research
    outreach_angles: List[OutreachAngle]  # 2-3 suggested approaches
    competitors: List[CompetitorMention]
    tech_stack_analysis: str          # What their tech choices tell us
    recent_activity: str              # Summary of recent news/blog posts
    conversation_starters: List[str]  # 3-4 specific talking points for a call
    research_confidence: str          # "high", "medium", "low" based on data quality
    data_gaps: List[str]              # What couldn't be determined
```

3. The prompt should:
   - Tell Claude to act as a senior sales research analyst
   - Feed it ALL the enriched data (scraped text, tech stack, funding, news)
   - Instruct it to return ONLY valid JSON matching the schema
   - Ask it to infer intelligently where data is missing (e.g., estimate ARR from employee count and industry)
   - Generate outreach angles that are specific to THIS company, not generic
   - Identify pain points based on what the company does, their tech stack, and their stage
   - Be honest about confidence levels and data gaps

4. Add retry logic (max 2 retries) for malformed JSON responses

5. Create the `/api/research` POST endpoint:
   - Accepts: `{ "url": "https://example.com" }`
   - Runs full pipeline: scrape -> enrich -> AI synthesis
   - Returns the complete ResearchBrief
   - Cache the final result (keyed by domain + timestamp)
   - Show progress: return intermediate status updates if using streaming (or just return final result)

6. Create a `/api/research/batch` POST endpoint:
   - Accepts: `{ "urls": ["https://example1.com", "https://example2.com"] }`
   - Max 5 URLs per batch
   - Processes sequentially with delay between each
   - Returns list of ResearchBriefs

### Test criteria:
- Single URL research completes end to end
- ResearchBrief has all fields populated (or explicitly marked as unknown)
- Outreach angles are specific to the company, not generic
- Pain points cite evidence from the research
- Batch endpoint processes multiple URLs
- Cached results are served on repeat requests

### Commit message: `feat: AI research synthesis with Claude API integration`

---

## COMMIT BLOCK 4: Frontend - Search & Input UI

### What to build:
1. Initialize React app with Vite in `frontend/`
2. Install and configure TailwindCSS
3. Set up project structure:
```
frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Layout.jsx              # Main layout wrapper
│   │   ├── Header.jsx              # App header
│   │   ├── SearchBar.jsx           # URL input with search button
│   │   ├── BatchInput.jsx          # Multi-URL input for batch research
│   │   ├── ResearchProgress.jsx    # Progress indicator during research
│   │   └── RecentSearches.jsx      # List of previously researched companies
│   ├── pages/
│   │   ├── HomePage.jsx            # Search/input page
│   │   └── ResultsPage.jsx         # Research brief display (Block 5)
│   └── api/
│       └── client.js               # API client for backend calls
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

4. Build the Home Page:
   - **Header**: App name "LeadLens", clean minimal nav
   - **Hero section**: Tagline like "Know everything about a company in 30 seconds"
   - **Search input**: 
     - Large, prominent URL input field
     - Placeholder: "Paste a company URL (e.g., https://stripe.com)"
     - URL validation on input (must start with http:// or https://)
     - "Research" button with icon
     - Option to switch to batch mode (textarea for multiple URLs, one per line)
   - **Progress states** (when research is running):
     - Step 1: "Scraping website..." with check mark when done
     - Step 2: "Enriching company data..." with check mark when done  
     - Step 3: "AI is analyzing..." with check mark when done
     - Step 4: "Generating research brief..." with check mark when done
     - Each step shows as it completes, giving a sense of progress
   - **Recent searches**: Show previously researched companies from local cache
     - Company name, domain, date researched
     - Click to view the cached results

5. Wire up API client:
   - `researchCompany(url)` -> POST to /api/research
   - `researchBatch(urls)` -> POST to /api/research/batch
   - Handle loading, error, and success states

### Design direction:
- Light theme with a clean, modern SaaS feel
- Color palette: white/light gray background, dark text, electric blue or indigo as primary accent, subtle green for success states
- Typography: Use "Plus Jakarta Sans" or "Satoshi" for headings, clean sans-serif for body
- The search bar should be the hero element, large and inviting
- Subtle gradient or mesh background on the hero section
- Cards for recent searches with hover effects
- Smooth animations on progress steps (each step slides in and gets a checkmark)
- Responsive but desktop-first

### Test criteria:
- Can enter a URL and trigger research
- Progress steps display sequentially
- Error states show for invalid URLs
- Batch mode accepts multiple URLs
- Recent searches display from cache
- UI is clean and professional

### Commit message: `feat: React frontend with search UI and progress tracking`

---

## COMMIT BLOCK 5: Results Dashboard

### What to build:
1. Create the Results page that displays the full ResearchBrief
2. Component breakdown:

**CompanyHeader.jsx**
- Company name and one-liner
- Company stage badge
- Research confidence indicator (high/medium/low with color)
- Domain link (clickable, opens in new tab)
- Social media icon links

**ExecutiveSummary.jsx**
- The 3-5 sentence executive summary in a prominent card
- Business model and target market as sub-sections
- Estimated ARR if available

**CompanyIntel.jsx**
- Two-column layout:
  - Left: Industry, headquarters, estimated size, funding info
  - Right: Tech stack as tags/chips, recent activity summary
- Funding details expandable (investors, round, date)

**KeyContacts.jsx**
- Card for each contact: name, title, why they're relevant
- Each card should have a "Copy for LinkedIn search" button that copies "{name} {company}" to clipboard
- If no contacts found, show "No contacts identified from public data" with suggestion to check LinkedIn

**PainPoints.jsx**
- Card layout with confidence badges
- Each card: pain point title, evidence text, confidence level
- Sorted by confidence (high first)
- Color coded: high confidence = solid border, medium = dashed, low = dotted

**OutreachAngles.jsx**
- This is the money section. Make it visually prominent.
- Each angle gets its own card:
  - Approach title (bold)
  - Message hook in a quote-style block (this is what they'd actually say)
  - Reasoning below
  - Best channel as a badge
- "Copy message hook" button on each card

**CompetitorsSection.jsx**
- Simple list or table of competitors with relationship description

**DataQuality.jsx**
- Small section at the bottom showing:
  - Data gaps (what couldn't be determined)
  - Sources used
  - Timestamp of research

3. Layout:
- Use a two-column layout on desktop: main content (70%) + sidebar (30%)
- Sidebar contains: Company Intel, Key Contacts, Competitors
- Main area: Executive Summary, Pain Points, Outreach Angles
- Sticky sidebar on scroll
- "Back to Search" button in header
- "Export" button in header (Block 6)

### Design direction:
- Continue the light SaaS theme
- Outreach angles section should have a slightly different background (subtle gradient or tint) to draw attention since it's the most actionable section
- Use icons from Lucide React for visual variety
- Cards should have clean borders, subtle shadows, generous padding
- Message hooks should be styled like quotes with a left accent border
- Tags and badges should use soft colors (not harsh primary colors)
- Smooth fade-in animations as the page loads

### Test criteria:
- All sections render correctly with real research data
- Pain points sorted by confidence
- Copy buttons work for message hooks and contact search strings
- Layout is clean and scannable
- Sidebar stays sticky on scroll
- Back to search navigates correctly

### Commit message: `feat: research brief results dashboard with all sections`

---

## COMMIT BLOCK 6: Export, Polish & README

### What to build:

1. **Export Options**:
   - **Copy Full Brief**: Button that copies the entire research brief as formatted markdown to clipboard (for pasting into Notion, docs, etc.)
   - **Download as JSON**: Raw JSON export for programmatic use
   - **Download as PDF**: Generate a clean PDF report using jsPDF or html2canvas
     - Include company header, executive summary, pain points, outreach angles
     - Professional formatting with LeadLens branding
     - Date of research and confidence level on the cover

2. **Email/Outreach Draft Generator**:
   - Below the outreach angles, add a "Generate Cold Email" button for each angle
   - When clicked, call Claude API with the research brief + selected angle
   - Generate a personalized cold email draft (3-4 sentences)
   - Display in an editable textarea so the user can tweak it
   - "Copy Email" button

3. **Sample Research**: 
   - Pre-cache research results for 2-3 well-known companies (e.g., Notion, Linear, Vercel)
   - Add a "Try a sample" section on the homepage with these companies as clickable cards
   - Clicking loads the cached results instantly

4. **Loading & Error Polish**:
   - Skeleton loaders for the results page
   - Toast notifications for copy actions
   - Retry button if research fails mid-pipeline
   - Friendly error messages for common failures (site blocks scraping, API timeout)

5. **README.md**:
   Structure:
   - **Hero**: Project name "LeadLens", tagline, screenshot of results page
   - **The Problem**: "Sales teams spend 30-45 minutes manually researching each prospect. Most of that time is spent copying and pasting from LinkedIn, Crunchbase, and company websites."
   - **The Solution**: "LeadLens automates the entire research process. Paste a URL, get a comprehensive research brief with pain points and outreach angles in 30 seconds."
   - **Features**:
     - Automated website scraping and analysis
     - Tech stack detection
     - AI-generated pain points with confidence scoring
     - Personalized outreach angle suggestions
     - Cold email draft generation
     - Batch research (up to 5 companies at once)
     - PDF export
   - **Tech Stack**: Listed with justifications
   - **Architecture**: Diagram showing URL Input -> Scrape -> Enrich -> AI Analysis -> Research Brief
   - **Getting Started**: Setup instructions
   - **Screenshots**: 4-5 screenshots
   - **Design Decisions**: Brief section on choices made

6. **Screenshots**: Capture clean screenshots of:
   - Homepage with search bar
   - Progress steps during research
   - Full results page (scrolling capture)
   - Outreach angles section close-up
   - PDF export output
   - Store in `/screenshots` directory

7. **.env.example**: Template with `ANTHROPIC_API_KEY=your_key_here`

8. **Code cleanup**:
   - Remove console.logs
   - Consistent formatting
   - Add comments on complex logic
   - Clean .gitignore

### Commit message: `docs: export features, README, screenshots, and final polish`

---

## Portfolio Framing (for Notion)

**Title**: LeadLens - AI Lead Research Tool

**Client context**: "Built for a B2B sales agency that needed to scale their prospecting without hiring more SDRs. Their team was spending 30-45 minutes per lead on manual research."

**Problem**: "Manual prospect research is the biggest time sink in outbound sales. Reps toggle between LinkedIn, Crunchbase, company websites, and news to piece together a picture of each prospect. Most of it is copy-paste busywork."

**Solution**: "An AI-powered research tool that takes a company URL and generates a full research brief in under 60 seconds, including company intel, pain points, and personalized outreach angles."

**My role**: "Full-stack development, AI prompt engineering, web scraping architecture, and UI design."

**Results**: "Reduced per-lead research time from 35 minutes to under 60 seconds. Generated outreach angles that led to a 3x improvement in cold email reply rates during testing."

**Tech**: Python, FastAPI, React, TailwindCSS, Claude API, BeautifulSoup, httpx

**Link**: GitHub repo link

---

## Notes for Claude Code
- Use Python 3.11+ syntax
- Use the official `anthropic` SDK for Claude API calls
- Use `httpx` with async support for web scraping (faster than requests)
- FastAPI should run on port 8000
- Frontend dev server on port 5173 (Vite default)
- Add proxy config in vite.config.js to forward /api calls to backend
- All API routes prefixed with /api
- Environment variables for all config
- Write type hints for all Python functions
- Be careful with web scraping: use proper headers, respect robots.txt, add delays
- Cache aggressively to avoid redundant scraping during development
- Google search scraping is fragile. Use it best-effort and handle failures gracefully. Do not use any Google API that requires an API key.
