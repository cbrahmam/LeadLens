from typing import Literal, Optional
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


class EnrichRequest(BaseModel):
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


class FundingInfo(BaseModel):
    total_raised: Optional[str] = None
    last_round: Optional[str] = None
    last_round_date: Optional[str] = None
    investors: list[str] = []
    source: str = ""


class CompanyEnrichedData(BaseModel):
    domain: str
    company_name: str
    industry: Optional[str] = None
    estimated_size: Optional[str] = None
    headquarters: Optional[str] = None
    tech_stack: list[str] = []
    social_links: dict = {}
    funding: Optional[FundingInfo] = None
    recent_news: list[str] = []
    linkedin_data: Optional[dict] = None
    emails_found: list[str] = []
    raw_scraped: ScrapedData
    cached_at: Optional[str] = None


# --- Research Brief Models ---

class KeyContact(BaseModel):
    name: str
    title: str
    relevance: str


class PainPoint(BaseModel):
    pain: str
    evidence: str
    confidence: Literal["high", "medium", "low"]


class OutreachAngle(BaseModel):
    approach: str
    message_hook: str
    reasoning: str
    best_channel: str


class CompetitorMention(BaseModel):
    competitor: str
    relationship: str


class ResearchBrief(BaseModel):
    company_name: str
    one_liner: str
    executive_summary: str
    business_model: str
    target_market: str
    company_stage: str
    estimated_arr: Optional[str] = None
    key_contacts: list[KeyContact] = []
    pain_points: list[PainPoint] = []
    outreach_angles: list[OutreachAngle] = []
    competitors: list[CompetitorMention] = []
    tech_stack_analysis: str = ""
    recent_activity: str = ""
    conversation_starters: list[str] = []
    research_confidence: Literal["high", "medium", "low"] = "medium"
    data_gaps: list[str] = []


class ResearchRequest(BaseModel):
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


class BatchResearchRequest(BaseModel):
    urls: list[str]

    @field_validator("urls")
    @classmethod
    def validate_urls(cls, v: list[str]) -> list[str]:
        if len(v) > 5:
            raise ValueError("Maximum 5 URLs per batch")
        if len(v) == 0:
            raise ValueError("At least one URL is required")
        return v


class ResearchResponse(BaseModel):
    domain: str
    researched_at: str
    brief: ResearchBrief
    enriched_data: CompanyEnrichedData


class ColdEmailRequest(BaseModel):
    research_brief: ResearchBrief
    angle_index: int


class ColdEmailResponse(BaseModel):
    subject: str
    body: str
    angle_used: str
