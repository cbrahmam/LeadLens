from fastapi import APIRouter, HTTPException

from backend.models.schemas import (
    CompanyEnrichedData,
    EnrichRequest,
    ScrapedData,
    ScrapeRequest,
)
from backend.services.enrichment import enrich_company
from backend.services.scraper import (
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
