import asyncio
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

from backend.models.schemas import ScrapedData

CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
CACHE_TTL_HOURS = 24
MAX_BODY_TEXT_CHARS = 10_000
MAX_PAGE_BYTES = 1_000_000
RATE_LIMIT_SECONDS = 1.0

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

SUBPAGE_PATTERNS = {
    "about": ["/about", "/about-us", "/about-us/", "/about/"],
    "team": ["/team", "/people", "/our-team", "/leadership"],
    "careers": ["/careers", "/jobs", "/join", "/join-us", "/work-with-us"],
    "pricing": ["/pricing", "/plans"],
    "blog": ["/blog", "/news", "/insights", "/resources"],
}

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
FAKE_EMAILS = {"example@example.com", "email@example.com", "info@example.com", "test@test.com"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"}


def extract_domain(url: str) -> str:
    netloc = urlparse(url).netloc
    if netloc.startswith("www."):
        netloc = netloc[4:]
    return netloc


def get_cache_path(domain: str, suffix: str = "") -> Path:
    safe_name = domain.replace("/", "_").replace(":", "_")
    return CACHE_DIR / f"{safe_name}{suffix}.json"


def load_from_cache(domain: str, suffix: str = "", ttl_hours: int = CACHE_TTL_HOURS) -> Optional[dict]:
    path = get_cache_path(domain, suffix)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        cached_at = data.get("cached_at")
        if cached_at:
            cached_time = datetime.fromisoformat(cached_at)
            age_hours = (datetime.now(timezone.utc) - cached_time).total_seconds() / 3600
            if age_hours > ttl_hours:
                return None
        return data
    except (json.JSONDecodeError, ValueError):
        return None


def save_to_cache(domain: str, data: dict, suffix: str = "") -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = get_cache_path(domain, suffix)
    data["cached_at"] = datetime.now(timezone.utc).isoformat()
    path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")


def extract_text(soup: BeautifulSoup) -> str:
    for tag in soup.find_all(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()

    main_content = soup.find("main") or soup.find("article") or soup.find("body")
    if not main_content:
        return ""

    text = main_content.get_text(separator="\n", strip=True)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    cleaned = "\n".join(lines)
    return cleaned[:MAX_BODY_TEXT_CHARS]


def extract_emails(text: str) -> list[str]:
    found = set(EMAIL_REGEX.findall(text))
    filtered = []
    for email in found:
        email_lower = email.lower()
        if email_lower in FAKE_EMAILS:
            continue
        ext = "." + email_lower.rsplit(".", 1)[-1]
        if ext in IMAGE_EXTENSIONS:
            continue
        filtered.append(email)
    return sorted(filtered)


def discover_subpages(soup: BeautifulSoup, base_url: str) -> dict[str, str]:
    discovered: dict[str, str] = {}
    base_domain = extract_domain(base_url)

    for link in soup.find_all("a", href=True):
        href = link["href"].strip()
        if href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue

        absolute_url = urljoin(base_url, href)
        link_domain = extract_domain(absolute_url)

        if link_domain != base_domain:
            continue

        path = urlparse(absolute_url).path.rstrip("/").lower()

        for page_type, patterns in SUBPAGE_PATTERNS.items():
            if page_type in discovered:
                continue
            for pattern in patterns:
                if path == pattern or path.endswith(pattern):
                    discovered[page_type] = absolute_url
                    break

    return discovered


async def fetch_page(client: httpx.AsyncClient, url: str) -> tuple[str, dict, list[str]]:
    warnings: list[str] = []
    try:
        response = await client.get(url, follow_redirects=True)
        response.raise_for_status()

        content_length = len(response.content)
        if content_length > MAX_PAGE_BYTES:
            warnings.append(f"Page {url} truncated ({content_length} bytes)")

        encoding = response.encoding or "utf-8"
        html = response.content[:MAX_PAGE_BYTES].decode(encoding, errors="replace")
        headers = dict(response.headers)
        return html, headers, warnings

    except httpx.TimeoutException:
        warnings.append(f"Timeout fetching {url}")
        return "", {}, warnings
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status in (403, 429):
            warnings.append(f"Blocked by {url} (HTTP {status})")
        else:
            warnings.append(f"HTTP error {status} fetching {url}")
        return "", {}, warnings
    except httpx.HTTPError as e:
        warnings.append(f"Error fetching {url}: {str(e)}")
        return "", {}, warnings


async def scrape_website(url: str) -> ScrapedData:
    domain = extract_domain(url)
    all_warnings: list[str] = []
    subpages_scraped: list[str] = []

    async with httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT},
        timeout=httpx.Timeout(15.0),
    ) as client:
        homepage_html, response_headers, warnings = await fetch_page(client, url)
        all_warnings.extend(warnings)

        if not homepage_html:
            return ScrapedData(
                url=url,
                domain=domain,
                title="",
                meta_description="",
                body_text="",
                emails_found=[],
                subpages_scraped=[],
                scrape_warnings=all_warnings or ["Failed to fetch homepage"],
                raw_html="",
                response_headers=response_headers,
            )

        soup = BeautifulSoup(homepage_html, "lxml")

        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else ""

        meta_desc_tag = soup.find("meta", attrs={"name": "description"})
        if not meta_desc_tag:
            meta_desc_tag = soup.find("meta", attrs={"property": "og:description"})
        meta_description = meta_desc_tag.get("content", "") if meta_desc_tag else ""

        body_text = extract_text(BeautifulSoup(homepage_html, "lxml"))
        all_text = homepage_html

        subpage_results: dict[str, Optional[str]] = {}
        discovered = discover_subpages(soup, url)

        for page_type, page_url in discovered.items():
            await asyncio.sleep(RATE_LIMIT_SECONDS)
            page_html, _, page_warnings = await fetch_page(client, page_url)
            all_warnings.extend(page_warnings)

            if page_html:
                subpages_scraped.append(page_url)
                page_soup = BeautifulSoup(page_html, "lxml")
                page_text = extract_text(page_soup)
                subpage_results[page_type] = page_text[:5000]
                all_text += " " + page_html
            else:
                subpage_results[page_type] = None

        emails = extract_emails(all_text)

        return ScrapedData(
            url=url,
            domain=domain,
            title=title,
            meta_description=meta_description,
            body_text=body_text,
            about_text=subpage_results.get("about"),
            team_text=subpage_results.get("team"),
            careers_text=subpage_results.get("careers"),
            pricing_text=subpage_results.get("pricing"),
            blog_text=subpage_results.get("blog"),
            emails_found=emails,
            subpages_scraped=subpages_scraped,
            scrape_warnings=all_warnings,
            raw_html=homepage_html[:50_000],
            response_headers=response_headers,
        )
