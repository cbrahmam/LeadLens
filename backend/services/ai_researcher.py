import json
import os
from typing import Optional

from anthropic import AsyncAnthropic

from backend.models.schemas import (
    ColdEmailResponse,
    CompanyEnrichedData,
    OutreachAngle,
    ResearchBrief,
)

MODEL = "claude-sonnet-4-20250514"
MAX_RETRIES = 2

SYSTEM_PROMPT = """You are a senior B2B sales research analyst with 15 years of experience.
You analyze companies to identify pain points, decision makers, and the best outreach strategies.
You are thorough, specific, and never generic.

Base your pain points on actual evidence from the scraped data. Do not make up generic pain points
like "scaling challenges" unless there is specific evidence from the company's website or news.

For outreach angles, reference specific details about the company — their tech stack, recent news,
team composition, or business model. Generic angles are useless.

Be honest about confidence levels and data gaps. If you can't determine something, say so."""

RESEARCH_PROMPT_TEMPLATE = """Analyze this company and generate a comprehensive research brief.

## Company Data

**Company Name**: {company_name}
**Domain**: {domain}
**Industry**: {industry}
**Estimated Size**: {estimated_size}
**Headquarters**: {headquarters}

**Website Description**: {meta_description}

**Homepage Content**:
{body_text}

**About Page**:
{about_text}

**Team Page**:
{team_text}

**Careers Page**:
{careers_text}

**Tech Stack Detected**: {tech_stack}

**Funding**: {funding}

**Recent News**: {recent_news}

**Social Links**: {social_links}

**Emails Found**: {emails}

**LinkedIn Data**: {linkedin_data}

---

Return your analysis as a JSON object with this exact structure:
{{
  "company_name": "string",
  "one_liner": "One sentence describing what this company does",
  "executive_summary": "3-5 sentence overview",
  "business_model": "How they make money",
  "target_market": "Who their customers are",
  "company_stage": "Early Stage | Growth | Mature",
  "estimated_arr": "Best guess based on signals, or null",
  "key_contacts": [
    {{"name": "string", "title": "string", "relevance": "Why this person matters for outreach"}}
  ],
  "pain_points": [
    {{"pain": "string", "evidence": "What from the research suggests this", "confidence": "high|medium|low"}}
  ],
  "outreach_angles": [
    {{"approach": "Short title", "message_hook": "Opening line suggestion", "reasoning": "Why this angle works", "best_channel": "email|linkedin|cold call"}}
  ],
  "competitors": [
    {{"competitor": "string", "relationship": "How they compete"}}
  ],
  "tech_stack_analysis": "What their tech choices tell us about their engineering culture and needs",
  "recent_activity": "Summary of recent news and activity",
  "conversation_starters": ["3-4 specific talking points for a call"],
  "research_confidence": "high|medium|low",
  "data_gaps": ["What couldn't be determined"]
}}

Return ONLY valid JSON. No markdown, no explanation, no code fences."""

COLD_EMAIL_PROMPT = """Based on this research brief and outreach angle, write a personalized cold email.

**Research Brief**:
{brief_summary}

**Selected Outreach Angle**:
- Approach: {approach}
- Message Hook: {message_hook}
- Reasoning: {reasoning}
- Best Channel: {best_channel}

Write a cold email that:
1. Opens with the message hook (adapted naturally)
2. Is 3-4 sentences maximum
3. References specific details about the company
4. Has a clear, low-friction CTA
5. Feels personal, not templated

Return JSON with this structure:
{{"subject": "Email subject line", "body": "Email body text"}}

Return ONLY valid JSON. No markdown, no explanation."""


def _truncate(text: Optional[str], max_chars: int = 8000) -> str:
    if not text:
        return "Not available"
    return text[:max_chars]


def _get_client() -> AsyncAnthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key or api_key == "your_key_here":
        raise ValueError("ANTHROPIC_API_KEY not configured")
    return AsyncAnthropic(api_key=api_key)


def _build_research_prompt(enriched: CompanyEnrichedData) -> str:
    scraped = enriched.raw_scraped
    funding_str = "No funding data available"
    if enriched.funding:
        parts = []
        if enriched.funding.total_raised:
            parts.append(f"Total raised: {enriched.funding.total_raised}")
        if enriched.funding.last_round:
            parts.append(f"Last round: {enriched.funding.last_round}")
        if enriched.funding.investors:
            parts.append(f"Investors: {', '.join(enriched.funding.investors)}")
        funding_str = "; ".join(parts) if parts else "No funding data available"

    return RESEARCH_PROMPT_TEMPLATE.format(
        company_name=enriched.company_name,
        domain=enriched.domain,
        industry=enriched.industry or "Unknown",
        estimated_size=enriched.estimated_size or "Unknown",
        headquarters=enriched.headquarters or "Unknown",
        meta_description=scraped.meta_description or "Not available",
        body_text=_truncate(scraped.body_text),
        about_text=_truncate(scraped.about_text, 5000),
        team_text=_truncate(scraped.team_text, 5000),
        careers_text=_truncate(scraped.careers_text, 5000),
        tech_stack=", ".join(enriched.tech_stack) if enriched.tech_stack else "None detected",
        funding=funding_str,
        recent_news="\n".join(f"- {n}" for n in enriched.recent_news) if enriched.recent_news else "No recent news found",
        social_links=json.dumps(enriched.social_links) if enriched.social_links else "None found",
        emails=", ".join(enriched.emails_found) if enriched.emails_found else "None found",
        linkedin_data=json.dumps(enriched.linkedin_data) if enriched.linkedin_data else "Not available",
    )


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError("Could not parse JSON from AI response")


async def generate_research_brief(enriched_data: CompanyEnrichedData) -> ResearchBrief:
    client = _get_client()
    prompt = _build_research_prompt(enriched_data)

    last_error: Optional[Exception] = None
    messages = [{"role": "user", "content": prompt}]

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = await client.messages.create(
                model=MODEL,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                messages=messages,
            )

            response_text = response.content[0].text
            parsed = _parse_json_response(response_text)
            return ResearchBrief(**parsed)

        except ValueError as e:
            last_error = e
            if attempt < MAX_RETRIES:
                messages = [
                    {"role": "user", "content": prompt},
                    {"role": "assistant", "content": response_text},
                    {"role": "user", "content": "Your previous response was not valid JSON. Please return ONLY a valid JSON object matching the schema. No markdown, no explanation."},
                ]
            continue
        except Exception as e:
            raise e

    raise ValueError(f"Failed to get valid JSON after {MAX_RETRIES + 1} attempts: {last_error}")


async def generate_cold_email(
    brief: ResearchBrief,
    angle: OutreachAngle,
) -> ColdEmailResponse:
    client = _get_client()

    brief_summary = (
        f"Company: {brief.company_name}\n"
        f"What they do: {brief.one_liner}\n"
        f"Business model: {brief.business_model}\n"
        f"Target market: {brief.target_market}\n"
        f"Stage: {brief.company_stage}\n"
        f"Pain points: {'; '.join(p.pain for p in brief.pain_points[:3])}"
    )

    prompt = COLD_EMAIL_PROMPT.format(
        brief_summary=brief_summary,
        approach=angle.approach,
        message_hook=angle.message_hook,
        reasoning=angle.reasoning,
        best_channel=angle.best_channel,
    )

    response = await client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    parsed = _parse_json_response(response.content[0].text)
    return ColdEmailResponse(
        subject=parsed["subject"],
        body=parsed["body"],
        angle_used=angle.approach,
    )
