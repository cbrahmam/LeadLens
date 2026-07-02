from backend.models.schemas import ResearchBrief, CompanyEnrichedData


def calculate_lead_score(brief: ResearchBrief, enriched: CompanyEnrichedData) -> dict:
    scores = {}

    high_pain = sum(1 for p in brief.pain_points if p.confidence == "high")
    med_pain = sum(1 for p in brief.pain_points if p.confidence == "medium")
    pain_score = min(25, high_pain * 10 + med_pain * 5)
    scores["pain_points"] = pain_score

    data_score = 0
    if enriched.industry:
        data_score += 3
    if enriched.estimated_size:
        data_score += 3
    if enriched.headquarters:
        data_score += 2
    if enriched.funding:
        data_score += 4
    if enriched.linkedin_data:
        data_score += 3
    if len(enriched.tech_stack) > 0:
        data_score += 3
    if len(enriched.emails_found) > 0:
        data_score += 4
    if len(enriched.social_links) > 0:
        data_score += 3
    scores["data_richness"] = min(25, data_score)

    contact_score = min(20, len(brief.key_contacts) * 5)
    scores["contacts"] = contact_score

    engagement_score = 0
    if brief.outreach_angles:
        engagement_score += min(10, len(brief.outreach_angles) * 3)
    if brief.conversation_starters:
        engagement_score += min(5, len(brief.conversation_starters) * 2)
    confidence_bonus = {"high": 10, "medium": 5, "low": 0}
    engagement_score += confidence_bonus.get(brief.research_confidence, 0)
    scores["engagement_potential"] = min(30, engagement_score)

    total = sum(scores.values())

    if total >= 75:
        grade = "A"
    elif total >= 55:
        grade = "B"
    elif total >= 35:
        grade = "C"
    else:
        grade = "D"

    signals = []
    if high_pain >= 2:
        signals.append("Multiple high-confidence pain points identified")
    if enriched.funding:
        signals.append("Recently funded - likely investing in solutions")
    if len(enriched.emails_found) > 0:
        signals.append("Direct email contacts available")
    if len(brief.key_contacts) >= 3:
        signals.append("Strong org chart visibility")
    if brief.research_confidence == "high":
        signals.append("High data confidence - reliable intel")
    if enriched.estimated_size:
        signals.append("Company size confirmed via LinkedIn")

    return {
        "total_score": total,
        "grade": grade,
        "breakdown": scores,
        "top_signals": signals[:5],
    }
