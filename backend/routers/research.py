import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException

from backend.models.schemas import (
    AnalyticsResponse,
    BatchResearchRequest,
    ColdEmailRequest,
    ColdEmailResponse,
    CompanyEnrichedData,
    EnrichRequest,
    FavoriteRequest,
    FavoriteResponse,
    LeadScoreResponse,
    LinkedInMessageRequest,
    LinkedInMessageResponse,
    ResearchBrief,
    ResearchRequest,
    ResearchResponse,
    ScrapedData,
    ScrapeRequest,
)
from backend.services.ai_researcher import (
    generate_cold_email,
    generate_linkedin_message,
    generate_research_brief,
)
from backend.services.enrichment import enrich_company
from backend.services.lead_scoring import calculate_lead_score
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


@router.post("/research/linkedin", response_model=LinkedInMessageResponse)
async def generate_linkedin_endpoint(request: LinkedInMessageRequest) -> LinkedInMessageResponse:
    brief = request.research_brief
    if request.contact_index < 0 or request.contact_index >= len(brief.key_contacts):
        raise HTTPException(status_code=422, detail="Invalid contact index")

    contact = brief.key_contacts[request.contact_index]

    try:
        return await generate_linkedin_message(brief, contact)
    except ValueError as e:
        if "not configured" in str(e):
            raise HTTPException(status_code=503, detail=str(e))
        raise HTTPException(status_code=502, detail=f"LinkedIn message generation failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LinkedIn message generation failed: {str(e)}")


@router.post("/research/score", response_model=LeadScoreResponse)
async def lead_score_endpoint(domain: str) -> LeadScoreResponse:
    cached = load_from_cache(domain, suffix="_research", ttl_hours=168)
    if not cached:
        raise HTTPException(status_code=404, detail=f"No research found for {domain}")

    response = ResearchResponse(**cached)
    score = calculate_lead_score(response.brief, response.enriched_data)
    return LeadScoreResponse(**score)


@router.get("/research/analytics", response_model=AnalyticsResponse)
async def analytics_endpoint() -> AnalyticsResponse:
    cache_path = Path(CACHE_DIR)
    if not cache_path.exists():
        return AnalyticsResponse(
            total_researched=0,
            avg_confidence="N/A",
            top_industries=[],
            stage_distribution=[],
            recent_activity=[],
        )

    research_files = list(cache_path.glob("*_research.json"))
    total = len(research_files)
    confidence_counts = {"high": 0, "medium": 0, "low": 0}
    industries: dict[str, int] = {}
    stages: dict[str, int] = {}
    recent: list[dict] = []
    score_total = 0
    score_count = 0

    for file in research_files:
        try:
            data = json.loads(file.read_text(encoding="utf-8"))
            brief_data = data.get("brief", {})
            enriched_data = data.get("enriched_data", {})

            conf = brief_data.get("research_confidence", "medium")
            confidence_counts[conf] = confidence_counts.get(conf, 0) + 1

            industry = enriched_data.get("industry")
            if industry:
                industries[industry] = industries.get(industry, 0) + 1

            stage = brief_data.get("company_stage", "Unknown")
            stages[stage] = stages.get(stage, 0) + 1

            try:
                brief_obj = ResearchBrief(**brief_data)
                enriched_obj = CompanyEnrichedData(**enriched_data)
                score = calculate_lead_score(brief_obj, enriched_obj)
                score_total += score["total_score"]
                score_count += 1
            except Exception:
                pass

            recent.append({
                "domain": data.get("domain", ""),
                "company_name": brief_data.get("company_name", ""),
                "researched_at": data.get("researched_at", ""),
            })
        except (json.JSONDecodeError, KeyError):
            continue

    max_conf = max(confidence_counts, key=confidence_counts.get) if total > 0 else "N/A"
    top_ind = sorted(industries.items(), key=lambda x: x[1], reverse=True)[:5]
    stage_dist = sorted(stages.items(), key=lambda x: x[1], reverse=True)
    recent.sort(key=lambda x: x.get("researched_at", ""), reverse=True)

    return AnalyticsResponse(
        total_researched=total,
        avg_confidence=max_conf,
        top_industries=[{"name": k, "count": v} for k, v in top_ind],
        stage_distribution=[{"stage": k, "count": v} for k, v in stage_dist],
        recent_activity=recent[:10],
        avg_lead_score=round(score_total / score_count, 1) if score_count > 0 else None,
    )


FAVORITES_FILE = Path(CACHE_DIR) / "_favorites.json"


def _load_favorites() -> list[dict]:
    if not FAVORITES_FILE.exists():
        return []
    try:
        return json.loads(FAVORITES_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, ValueError):
        return []


def _save_favorites(favorites: list[dict]) -> None:
    FAVORITES_FILE.parent.mkdir(parents=True, exist_ok=True)
    FAVORITES_FILE.write_text(json.dumps(favorites, indent=2), encoding="utf-8")


@router.get("/favorites")
async def get_favorites() -> list[FavoriteResponse]:
    return [FavoriteResponse(**f) for f in _load_favorites()]


@router.post("/favorites", response_model=FavoriteResponse)
async def add_favorite(request: FavoriteRequest) -> FavoriteResponse:
    favorites = _load_favorites()

    for fav in favorites:
        if fav["domain"] == request.domain:
            raise HTTPException(status_code=409, detail="Already in favorites")

    cached = load_from_cache(request.domain, suffix="_research", ttl_hours=168)
    company_name = request.domain
    if cached:
        company_name = cached.get("brief", {}).get("company_name", request.domain)

    entry = {
        "domain": request.domain,
        "company_name": company_name,
        "notes": request.notes or "",
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    favorites.append(entry)
    _save_favorites(favorites)
    return FavoriteResponse(**entry)


@router.put("/favorites/{domain}")
async def update_favorite(domain: str, request: FavoriteRequest) -> FavoriteResponse:
    favorites = _load_favorites()
    for fav in favorites:
        if fav["domain"] == domain:
            fav["notes"] = request.notes or ""
            _save_favorites(favorites)
            return FavoriteResponse(**fav)
    raise HTTPException(status_code=404, detail="Favorite not found")


@router.delete("/favorites/{domain}")
async def delete_favorite(domain: str) -> dict:
    favorites = _load_favorites()
    new_favorites = [f for f in favorites if f["domain"] != domain]
    if len(new_favorites) == len(favorites):
        raise HTTPException(status_code=404, detail="Favorite not found")
    _save_favorites(new_favorites)
    return {"status": "removed", "domain": domain}


@router.get("/research/compare")
async def compare_companies(domains: str) -> list[dict]:
    domain_list = [d.strip() for d in domains.split(",") if d.strip()]
    if len(domain_list) < 2:
        raise HTTPException(status_code=422, detail="At least 2 domains required")
    if len(domain_list) > 5:
        raise HTTPException(status_code=422, detail="Maximum 5 domains for comparison")

    results = []
    for domain in domain_list:
        cached = load_from_cache(domain, suffix="_research", ttl_hours=168)
        if not cached:
            results.append({"domain": domain, "status": "not_found"})
            continue

        response = ResearchResponse(**cached)
        score = calculate_lead_score(response.brief, response.enriched_data)
        results.append({
            "domain": domain,
            "status": "found",
            "brief": response.brief.model_dump(),
            "enriched_data": {
                "industry": response.enriched_data.industry,
                "estimated_size": response.enriched_data.estimated_size,
                "headquarters": response.enriched_data.headquarters,
                "tech_stack": response.enriched_data.tech_stack,
                "funding": response.enriched_data.funding.model_dump() if response.enriched_data.funding else None,
            },
            "lead_score": score,
        })

    return results
