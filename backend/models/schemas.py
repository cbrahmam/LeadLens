from typing import Optional
from pydantic import BaseModel, field_validator
from urllib.parse import urlparse


class ScrapeRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        parsed = urlparse(v)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("URL must start with http:// or https://")
        if not parsed.netloc:
            raise ValueError("Invalid URL: missing domain")
        return v


class ScrapedData(BaseModel):
    url: str
    domain: str
    title: str
    meta_description: str
    body_text: str
    about_text: Optional[str] = None
    team_text: Optional[str] = None
    careers_text: Optional[str] = None
    pricing_text: Optional[str] = None
    blog_text: Optional[str] = None
    emails_found: list[str] = []
    subpages_scraped: list[str] = []
    scrape_warnings: list[str] = []
    raw_html: str = ""
    response_headers: dict = {}
    cached_at: Optional[str] = None
