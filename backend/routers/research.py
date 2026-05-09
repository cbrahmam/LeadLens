from fastapi import APIRouter, HTTPException

from backend.models.schemas import ScrapeRequest, ScrapedData
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
