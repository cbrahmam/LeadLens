import asyncio
import re
from typing import Optional
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from backend.models.schemas import CompanyEnrichedData, FundingInfo, ScrapedData

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

TECH_SIGNATURES: dict[str, list[str]] = {
    "React": ["react", "data-reactroot", "data-reactid", "_reactRootContainer"],
    "Next.js": ["_next/static", "__NEXT_DATA__", "next/dist"],
    "Vue.js": ["__VUE__", "vue.js", "vue.min.js", "vue@"],
    "Nuxt.js": ["__NUXT__", "_nuxt/", "nuxt.js"],
    "Angular": ["ng-version", "ng-app", "angular.js", "angular.min.js"],
    "Svelte": ["__svelte", "svelte"],
    "Gatsby": ["___gatsby", "gatsby-"],
    "jQuery": ["jquery", "jQuery"],
    "WordPress": ["wp-content", "wp-includes", "WordPress"],
    "Webflow": ["webflow.js", "wf-"],
    "Squarespace": ["squarespace.com", "static.squarespace"],
    "Shopify": ["cdn.shopify.com", "shopify"],
    "Wix": ["wix.com", "parastorage.com"],
    "Google Analytics": ["google-analytics.com", "gtag(", "UA-", "G-"],
    "Google Tag Manager": ["googletagmanager.com", "gtm.js"],
    "Segment": ["segment.com/analytics", "analytics.js/v1"],
    "Mixpanel": ["mixpanel.com", "mixpanel"],
    "Amplitude": ["amplitude.com", "amplitude"],
    "Hotjar": ["hotjar.com", "hj("],
    "HubSpot": ["hubspot.com", "hs-scripts", "hbspt"],
    "Intercom": ["intercom.io", "intercomSettings"],
    "Drift": ["drift.com", "driftt"],
    "Zendesk": ["zendesk.com", "zopim"],
    "Stripe": ["js.stripe.com", "stripe.js"],
    "Tailwind CSS": ["tailwindcss", "tailwind"],
    "Bootstrap": ["bootstrap.min.css", "bootstrap.min.js"],
}

HEADER_SIGNATURES: dict[str, dict[str, list[str]]] = {
    "Cloudflare": {"cf-ray": [""], "server": ["cloudflare"]},
    "Vercel": {"x-vercel-id": [""], "server": ["vercel"]},
    "Netlify": {"x-nf-request-id": [""], "server": ["netlify"]},
    "AWS CloudFront": {"x-amz-cf-id": [""], "via": ["cloudfront"]},
    "Nginx": {"server": ["nginx"]},
    "Apache": {"server": ["apache"]},
    "Express": {"x-powered-by": ["express"]},
    "PHP": {"x-powered-by": ["php"]},
    "ASP.NET": {"x-powered-by": ["asp.net"], "x-aspnet-version": [""]},
}

SOCIAL_PATTERNS: dict[str, list[str]] = {
    "twitter": ["twitter.com/", "x.com/"],
    "linkedin": ["linkedin.com/company/"],
    "github": ["github.com/"],
    "youtube": ["youtube.com/", "youtu.be/"],
    "facebook": ["facebook.com/"],
    "instagram": ["instagram.com/"],
}

FUNDING_AMOUNT_RE = re.compile(
    r"\$\s*[\d,.]+\s*(?:billion|million|B|M|K)?",
    re.IGNORECASE,
)
ROUND_RE = re.compile(
    r"(?:Series\s+[A-Z]|Seed|Pre-Seed|Angel|Series\s+[A-Z]\d?)",
    re.IGNORECASE,
)


def detect_tech_stack(html: str, headers: dict) -> list[str]:
    detected: set[str] = set()
    html_lower = html.lower()

    for tech, signatures in TECH_SIGNATURES.items():
        for sig in signatures:
            if sig.lower() in html_lower:
                detected.add(tech)
                break

    headers_lower = {k.lower(): v.lower() for k, v in headers.items()}
    for tech, header_checks in HEADER_SIGNATURES.items():
        for header_name, patterns in header_checks.items():
            header_val = headers_lower.get(header_name, "")
            if not header_val:
                continue
            for pattern in patterns:
                if pattern == "" or pattern in header_val:
                    detected.add(tech)
                    break

    return sorted(detected)


def extract_social_links(html: str) -> dict[str, str]:
    soup = BeautifulSoup(html, "lxml")
    links: dict[str, str] = {}

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        for platform, patterns in SOCIAL_PATTERNS.items():
            if platform in links:
                continue
            for pattern in patterns:
                if pattern in href.lower():
                    links[platform] = href
                    break

    return links


def extract_company_name(scraped: ScrapedData) -> str:
    html = scraped.raw_html
    if html:
        soup = BeautifulSoup(html, "lxml")
        og_name = soup.find("meta", attrs={"property": "og:site_name"})
        if og_name and og_name.get("content", "").strip():
            return og_name["content"].strip()

    title = scraped.title
    if title:
        for sep in [" | ", " - ", " — ", " – ", " :: ", " : "]:
            if sep in title:
                return title.split(sep)[0].strip()
        return title.strip()

    return scraped.domain.split(".")[0].capitalize()


async def search_google(query: str, num_results: int = 5) -> list[dict]:
    encoded = quote_plus(query)
    url = f"https://www.google.com/search?q={encoded}&num={num_results}"

    async with httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"},
        timeout=httpx.Timeout(10.0),
    ) as client:
        try:
            resp = await client.get(url, follow_redirects=True)
            resp.raise_for_status()
        except (httpx.HTTPError, httpx.TimeoutException):
            return []

        html = resp.text
        if "captcha" in html.lower() or "unusual traffic" in html.lower():
            return []

        soup = BeautifulSoup(html, "lxml")
        results: list[dict] = []

        for g_div in soup.select("div.g"):
            title_el = g_div.select_one("h3")
            snippet_el = g_div.select_one("div[data-sncf], div.VwiC3b, span.st")
            link_el = g_div.select_one("a[href]")

            title_text = title_el.get_text(strip=True) if title_el else ""
            snippet_text = snippet_el.get_text(strip=True) if snippet_el else ""
            link_href = link_el["href"] if link_el else ""

            if title_text or snippet_text:
                results.append({
                    "title": title_text,
                    "snippet": snippet_text,
                    "url": link_href,
                })

            if len(results) >= num_results:
                break

        return results


async def get_funding_info(company_name: str) -> Optional[FundingInfo]:
    try:
        results = await search_google(f'"{company_name}" funding round raised')
        if not results:
            return None

        all_text = " ".join(r["snippet"] for r in results)

        amounts = FUNDING_AMOUNT_RE.findall(all_text)
        rounds = ROUND_RE.findall(all_text)

        if not amounts and not rounds:
            return None

        return FundingInfo(
            total_raised=amounts[0] if amounts else None,
            last_round=rounds[0] if rounds else None,
            last_round_date=None,
            investors=[],
            source="Google Search",
        )
    except Exception:
        return None


async def get_recent_news(company_name: str) -> list[str]:
    try:
        results = await search_google(f'"{company_name}" news 2025 2024')
        return [r["title"] for r in results if r["title"]][:5]
    except Exception:
        return []


async def get_linkedin_data(company_name: str) -> Optional[dict]:
    try:
        results = await search_google(f'site:linkedin.com/company "{company_name}"', num_results=3)
        if not results:
            return None

        data: dict[str, Optional[str]] = {
            "url": None,
            "employee_count": None,
            "industry": None,
            "headquarters": None,
        }

        for r in results:
            if "linkedin.com/company" in r.get("url", ""):
                data["url"] = r["url"]

            snippet = r.get("snippet", "")

            employee_match = re.search(r"([\d,]+)\+?\s*(?:employees|followers)", snippet, re.IGNORECASE)
            if employee_match and not data["employee_count"]:
                data["employee_count"] = employee_match.group(0)

            for industry_kw in ["industry", "sector"]:
                if industry_kw in snippet.lower() and not data["industry"]:
                    data["industry"] = snippet[:200]

        if data["url"] or data["employee_count"]:
            return data
        return None
    except Exception:
        return None


async def enrich_company(domain: str, scraped_data: ScrapedData) -> CompanyEnrichedData:
    company_name = extract_company_name(scraped_data)

    tech_stack = detect_tech_stack(scraped_data.raw_html, scraped_data.response_headers)
    social_links = extract_social_links(scraped_data.raw_html)

    funding_task = get_funding_info(company_name)
    news_task = get_recent_news(company_name)
    linkedin_task = get_linkedin_data(company_name)

    funding, recent_news, linkedin_data = await asyncio.gather(
        funding_task, news_task, linkedin_task,
        return_exceptions=True,
    )

    if isinstance(funding, Exception):
        funding = None
    if isinstance(recent_news, Exception):
        recent_news = []
    if isinstance(linkedin_data, Exception):
        linkedin_data = None

    industry = None
    estimated_size = None
    headquarters = None

    if isinstance(linkedin_data, dict):
        industry = linkedin_data.get("industry")
        emp = linkedin_data.get("employee_count")
        if emp:
            estimated_size = emp
        headquarters = linkedin_data.get("headquarters")

    return CompanyEnrichedData(
        domain=domain,
        company_name=company_name,
        industry=industry,
        estimated_size=estimated_size,
        headquarters=headquarters,
        tech_stack=tech_stack,
        social_links=social_links,
        funding=funding,
        recent_news=recent_news,
        linkedin_data=linkedin_data,
        emails_found=scraped_data.emails_found,
        raw_scraped=scraped_data,
    )
