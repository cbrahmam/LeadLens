import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException

from backend.models.schemas import (
    BatchResearchRequest,
    ColdEmailRequest,
    ColdEmailResponse,
    CompanyEnrichedData,
    EnrichRequest,
    ResearchBrief,
    ResearchRequest,
    ResearchResponse,
    ScrapedData,
    ScrapeRequest,
)
from backend.services.ai_researcher import generate_cold_email, generate_research_brief
from backend.services.enrichment import enrich_company
from backend.services.scraper import (
    CACHE_DIR,
    extract_domain,
    load_from_cache,
    save_to_cache,
    scrape_website,
)

router = APIRouter()


@router.post("/scrape", response_model=ScrapedData)
async def scrape_endpoint(request: ScrapeRequest) -> ScrapedData:
    domain = extract_domain(request.url)

    cached = load_from_cache(domain)
    if cached:
        return ScrapedData(**cached)

    try:
        result = await scrape_website(request.url)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

    save_to_cache(domain, result.model_dump())
    return result


@router.post("/enrich", response_model=CompanyEnrichedData)
async def enrich_endpoint(request: EnrichRequest) -> CompanyEnrichedData:
    domain = extract_domain(request.url)

    cached_enriched = load_from_cache(domain, suffix="_enriched", ttl_hours=6)
    if cached_enriched:
        return CompanyEnrichedData(**cached_enriched)

    cached_scrape = load_from_cache(domain)
    if cached_scrape:
        scraped = ScrapedData(**cached_scrape)
    else:
        try:
            scraped = await scrape_website(request.url)
            save_to_cache(domain, scraped.model_dump())
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

    try:
        enriched = await enrich_company(domain, scraped)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")

    save_to_cache(domain, enriched.model_dump(), suffix="_enriched")
    return enriched


async def _run_full_pipeline(url: str) -> ResearchResponse:
    domain = extract_domain(url)

    cached_research = load_from_cache(domain, suffix="_research", ttl_hours=168)
    if cached_research:
        return ResearchResponse(**cached_research)

    cached_enriched = load_from_cache(domain, suffix="_enriched", ttl_hours=6)
    if cached_enriched:
        enriched = CompanyEnrichedData(**cached_enriched)
    else:
        cached_scrape = load_from_cache(domain)
        if cached_scrape:
            scraped = ScrapedData(**cached_scrape)
        else:
            scraped = await scrape_website(url)
            save_to_cache(domain, scraped.model_dump())

        enriched = await enrich_company(domain, scraped)
        save_to_cache(domain, enriched.model_dump(), suffix="_enriched")

    try:
        brief = await generate_research_brief(enriched)
    except ValueError as e:
        error_msg = str(e)
        if "not configured" in error_msg:
            raise HTTPException(status_code=503, detail=error_msg)
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {error_msg}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)}")

    response = ResearchResponse(
        domain=domain,
        researched_at=datetime.now(timezone.utc).isoformat(),
        brief=brief,
        enriched_data=enriched,
    )

    save_to_cache(domain, response.model_dump(), suffix="_research")
    return response


@router.post("/research", response_model=ResearchResponse)
async def research_endpoint(request: ResearchRequest) -> ResearchResponse:
    return await _run_full_pipeline(request.url)


@router.post("/research/batch")
async def batch_research_endpoint(request: BatchResearchRequest) -> list[dict]:
    results: list[dict] = []

    for url in request.urls:
        try:
            response = await _run_full_pipeline(url)
            results.append({"status": "success", "data": response.model_dump()})
        except HTTPException as e:
            results.append({"status": "error", "url": url, "detail": e.detail})
        except Exception as e:
            results.append({"status": "error", "url": url, "detail": str(e)})

        await asyncio.sleep(2.0)

    return results


@router.get("/research/recent")
async def recent_research_endpoint() -> list[dict]:
    results: list[dict] = []
    cache_path = Path(CACHE_DIR)

    if not cache_path.exists():
        return results

    for file in cache_path.glob("*_research.json"):
        try:
            data = json.loads(file.read_text(encoding="utf-8"))
            results.append({
                "domain": data.get("domain", ""),
                "company_name": data.get("brief", {}).get("company_name", ""),
                "researched_at": data.get("researched_at", ""),
                "research_confidence": data.get("brief", {}).get("research_confidence", ""),
                "one_liner": data.get("brief", {}).get("one_liner", ""),
            })
        except (json.JSONDecodeError, KeyError):
            continue

    results.sort(key=lambda x: x.get("researched_at", ""), reverse=True)
    return results


@router.get("/research/{domain}")
async def get_research_by_domain(domain: str) -> ResearchResponse:
    cached = load_from_cache(domain, suffix="_research", ttl_hours=168)
    if not cached:
        raise HTTPException(status_code=404, detail=f"No research found for {domain}")
    return ResearchResponse(**cached)


@router.post("/research/email", response_model=ColdEmailResponse)
async def generate_email_endpoint(request: ColdEmailRequest) -> ColdEmailResponse:
    brief = request.research_brief
    if request.angle_index < 0 or request.angle_index >= len(brief.outreach_angles):
        raise HTTPException(status_code=422, detail="Invalid angle index")

    angle = brief.outreach_angles[request.angle_index]

    try:
        return await generate_cold_email(brief, angle)
    except ValueError as e:
        if "not configured" in str(e):
            raise HTTPException(status_code=503, detail=str(e))
        raise HTTPException(status_code=502, detail=f"Email generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Email generation failed: {str(e)}")
