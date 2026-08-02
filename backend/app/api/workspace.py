from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.analysis_result import AnalysisResult
from app.models.company import Company
from app.models.user import User
from statistics import mean
from app.models.knowledge_source import KnowledgeSource
import re


router = APIRouter(
    prefix="/workspace",
    tags=["Workspace"],
)


@router.get("/")
async def workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    companies = (
        db.query(Company)
        .join(AnalysisResult)
        .filter(
            AnalysisResult.user_id == current_user.id
        )
        .group_by(Company.id)
        .all()
    )

    response = []

    for company in companies:

        analyses = (
            db.query(AnalysisResult)
            .filter(
                AnalysisResult.company_id == company.id,
                AnalysisResult.user_id == current_user.id,
            )
            .all()
        )

        total = len(analyses)

        latest = max(
            analyses,
            key=lambda x: x.created_at,
        )

        response.append(
            {
                "company_id": company.id,
                "company": company.name,
                "website": company.website,
                "industry": company.industry,
                "total_analyses": total,
                "last_analysis": latest.created_at,
                "latest_intent": latest.intent.get(
                    "intent_score",
                    0,
                ),
                "priority": latest.intent.get(
                    "priority",
                    "",
                ),
            }
        )

    return response

@router.get("/company/{company_id}")
async def company_details(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    company = (
        db.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if company is None:
        return {
            "error": "Company not found"
        }

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == current_user.id,
        )
        .order_by(
            AnalysisResult.created_at.desc()
        )
        .all()
    )

    response = []

    for analysis in analyses:

        response.append(
            {
                "analysis_id": analysis.id,
                "intent_score": analysis.intent.get(
                    "intent_score",
                    0,
                ),
                "priority": analysis.intent.get(
                    "priority",
                    "",
                ),
                "buying_stage": analysis.intent.get(
                    "buying_stage",
                    "",
                ),
                "decision_maker": analysis.persona.get(
                    "primary_decision_maker",
                    "",
                ),
                "created_at": analysis.created_at,
            }
        )

    return {
        "company": {
            "id": company.id,
            "name": company.name,
            "website": company.website,
            "industry": company.industry,
        },
        "analyses": response,
    }


@router.get("/search")
async def search_workspace(
    q: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.user_id == current_user.id
        )
        .all()
    )

    q = q.lower()

    results = []

    for analysis in analyses:

        company = analysis.company

        searchable = [
            company.name if company else "",
            analysis.persona.get(
                "primary_decision_maker",
                "",
            ),
            str(
                analysis.strategy.get(
                    "account_summary",
                    "",
                )
            ),
            str(
                analysis.intent.get(
                    "reasoning",
                    "",
                )
            ),
        ]

        text = " ".join(searchable).lower()

        if q in text:

            results.append(
                {
                    "analysis_id": analysis.id,
                    "company": company.name if company else "",
                    "decision_maker": analysis.persona.get(
                        "primary_decision_maker",
                        "",
                    ),
                    "intent_score": analysis.intent.get(
                        "intent_score",
                        0,
                    ),
                    "priority": analysis.intent.get(
                        "priority",
                        "",
                    ),
                }
            )

    return results

@router.get("/filter")
async def filter_workspace(
    priority: str | None = None,
    stage: str | None = None,
    intent_min: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.user_id == current_user.id
        )
        .all()
    )

    response = []

    for analysis in analyses:

        if priority:

            if (
                analysis.intent.get(
                    "priority",
                    ""
                ).lower()
                != priority.lower()
            ):
                continue

        if stage:

            if (
                analysis.intent.get(
                    "buying_stage",
                    ""
                ).lower()
                != stage.lower()
            ):
                continue

        if intent_min:

            if (
                analysis.intent.get(
                    "intent_score",
                    0
                )
                < intent_min
            ):
                continue

        response.append(
            {
                "analysis_id": analysis.id,
                "company": analysis.company.name,
                "intent_score": analysis.intent.get(
                    "intent_score",
                    0,
                ),
                "priority": analysis.intent.get(
                    "priority",
                    "",
                ),
                "buying_stage": analysis.intent.get(
                    "buying_stage",
                    "",
                ),
            }
        )

    return response


@router.get("/company/{company_id}/dashboard")
async def company_dashboard(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    company = (
        db.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if company is None:
        return {
            "error": "Company not found"
        }

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == current_user.id,
        )
        .order_by(
            AnalysisResult.created_at.desc()
        )
        .all()
    )

    if not analyses:
        return {
            "error": "No analyses found"
        }

    latest = analyses[0]

    intent_scores = [
        a.intent.get("intent_score", 0)
        for a in analyses
    ]

    average_intent = round(
        mean(intent_scores),
        2,
    )

    latest_intent = latest.intent

    latest_persona = latest.persona

    latest_strategy = latest.strategy

    latest_guardrail = latest.guardrail

    dashboard = {

        "company": {

            "id": company.id,

            "name": company.name,

            "website": company.website,

            "industry": company.industry,
        },

        "summary": latest_strategy.get(
            "account_summary",
            "",
        ),

        "health_score": average_intent,

        "latest_intent_score": latest_intent.get(
            "intent_score",
            0,
        ),

        "priority": latest_intent.get(
            "priority",
            "",
        ),

        "buying_stage": latest_intent.get(
            "buying_stage",
            "",
        ),

        "risk_level": latest_guardrail.get(
            "risk_level",
            "",
        ),

        "decision_maker": latest_persona.get(
            "primary_decision_maker",
            "",
        ),

        "recommended_action": latest_strategy.get(
            "next_best_action",
            "",
        ),

        "communication_style": latest_persona.get(
            "communication_style",
            "",
        ),

        "confidence": latest_guardrail.get(
            "confidence",
            0,
        ),

        "analyses_count": len(
            analyses
        ),

        "latest_analysis": {

            "analysis_id": latest.id,

            "created_at": latest.created_at,
        }
    }

    return dashboard

@router.get("/recommendations")
async def recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.user_id == current_user.id
        )
        .all()
    )

    recommendations = []

    for analysis in analyses:

        company = analysis.company

        if company is None:
            continue

        score = 0

        reasons = []

        intent = analysis.intent.get(
            "intent_score",
            0,
        )

        score += intent

        if analysis.intent.get("priority") == "High":
            score += 10
            reasons.append("High priority account")

        if analysis.persona.get(
            "primary_decision_maker",
            ""
        ):
            score += 5
            reasons.append("Decision maker identified")

        if analysis.guardrail.get(
            "risk_level",
            ""
        ).lower() == "low":
            score += 5
            reasons.append("Low execution risk")

        if analysis.strategy.get(
            "next_best_action",
            ""
        ):
            score += 5
            reasons.append("Clear next action available")

        recommendations.append(
            {
                "company_id": company.id,
                "company": company.name,
                "score": min(score, 100),
                "priority": analysis.intent.get(
                    "priority",
                    "",
                ),
                "intent": intent,
                "next_action": analysis.strategy.get(
                    "next_best_action",
                    "",
                ),
                "reason": reasons,
            }
        )

    recommendations.sort(
        key=lambda x: x["score"],
        reverse=True,
    )

    return {
        "recommended_companies": recommendations
    }


@router.get("/company/{company_id}/trend")
async def company_trend(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == current_user.id,
        )
        .order_by(
            AnalysisResult.created_at.asc()
        )
        .all()
    )

    if not analyses:
        return {
            "error": "No analyses found"
        }

    history = []

    priorities = []

    stages = []

    for analysis in analyses:

        history.append(
            {
                "analysis_id": analysis.id,
                "date": analysis.created_at,
                "intent_score": analysis.intent.get(
                    "intent_score",
                    0,
                ),
            }
        )

        priorities.append(
            analysis.intent.get(
                "priority",
                "",
            )
        )

        stages.append(
            analysis.intent.get(
                "buying_stage",
                "",
            )
        )

    scores = [
        x["intent_score"]
        for x in history
    ]

    current = scores[-1]

    previous = scores[-2] if len(scores) > 1 else current

    change = current - previous

    if change > 5:
        trend = "Increasing"

    elif change < -5:
        trend = "Decreasing"

    else:
        trend = "Stable"

    if current >= 80:

        recommendation = "Contact immediately"

    elif current >= 60:

        recommendation = "Continue nurturing"

    else:

        recommendation = "Monitor account"

    return {

        "company_id": company_id,

        "trend": trend,

        "current_intent": current,

        "previous_intent": previous,

        "change": change,

        "recommendation": recommendation,

        "history": history,

        "priority_history": priorities,

        "buying_stage_history": stages,

    }

@router.get("/company/{company_id}/activity")
async def company_activity(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    analyses = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == current_user.id,
        )
        .order_by(
            AnalysisResult.created_at.asc()
        )
        .all()
    )

    if not analyses:
        return {
            "error": "No activity found"
        }

    timeline = []

    for analysis in analyses:

        created = analysis.created_at

        knowledge = (
            db.query(KnowledgeSource)
            .filter(
                KnowledgeSource.id == analysis.knowledge_id
            )
            .first()
        )

        if knowledge:

            company = knowledge.processed_data.get(
                "knowledge",
                {}
            ).get(
                "company",
                ""
            )

            timeline.append({
                "time": created,
                "type": "Knowledge",
                "icon": "📄",
                "title": "Knowledge Extracted",
                "description": f"Company identified as {company}"
            })

        decision = analysis.persona.get(
            "primary_decision_maker",
            ""
        )

        if decision:

            timeline.append({
                "time": created,
                "type": "Persona",
                "icon": "👤",
                "title": "Decision Maker Identified",
                "description": decision
            })

        timeline.append({
            "time": created,
            "type": "Intent",
            "icon": "📈",
            "title": "Buying Intent",
            "description": f'Intent Score: {analysis.intent.get("intent_score",0)}'
        })

        timeline.append({
            "time": created,
            "type": "Strategy",
            "icon": "🎯",
            "title": "Next Best Action",
            "description": analysis.strategy.get(
                "next_best_action",
                ""
            )
        })

        timeline.append({
            "time": created,
            "type": "Guardrail",
            "icon": "🛡️",
            "title": "Risk Assessment",
            "description": analysis.guardrail.get(
                "risk_level",
                ""
            )
        })

    timeline.sort(
        key=lambda x: x["time"]
    )

    return {
        "company_id": company_id,
        "company": analyses[0].company.name,
        "total_events": len(timeline),
        "timeline": timeline,
    }


# =========================================================
# Stakeholders / Pain Points / Buying Signals / Graph
#
# These derive from the raw extracted knowledge (contacts,
# decision_makers, pain_points, buying_signals) attached to a company's
# most recent analysis, rather than a separate table — the knowledge
# extraction agent already produces this data, it just wasn't exposed
# yet.
# =========================================================


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "unknown"


def _latest_knowledge_for_company(
    db: Session,
    company_id: int,
    user_id: int,
):
    latest_analysis = (
        db.query(AnalysisResult)
        .filter(
            AnalysisResult.company_id == company_id,
            AnalysisResult.user_id == user_id,
        )
        .order_by(AnalysisResult.created_at.desc())
        .first()
    )

    if latest_analysis is None:
        return None, None

    knowledge_source = (
        db.query(KnowledgeSource)
        .filter(KnowledgeSource.id == latest_analysis.knowledge_id)
        .first()
    )

    if knowledge_source is None:
        return latest_analysis, None

    return latest_analysis, knowledge_source.processed_data.get("knowledge", {})


def _infer_influence(name: str, role: str, primary_decision_maker: str) -> str:
    role_lower = (role or "").lower()

    if name and primary_decision_maker and name.strip().lower() == primary_decision_maker.strip().lower():
        return "Decision Maker"

    if any(k in role_lower for k in ["cfo", "finance", "budget", "procurement"]):
        return "Budget Holder"

    if any(k in role_lower for k in ["security", "compliance", "legal", "risk"]):
        return "Blocker"

    if any(k in role_lower for k in ["vp", "head", "director", "lead"]):
        return "Champion"

    return "Influencer"


@router.get("/company/{company_id}/stakeholders")
async def company_stakeholders(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis, knowledge = _latest_knowledge_for_company(db, company_id, current_user.id)

    if analysis is None:
        return []

    knowledge = knowledge or {}
    persona = analysis.persona or {}
    primary_decision_maker = persona.get("primary_decision_maker", "")

    contacts = knowledge.get("contacts", []) or []
    pain_points = knowledge.get("pain_points", []) or []
    buying_signals = knowledge.get("buying_signals", []) or []
    confidence = knowledge.get("confidence", 0) or 0

    # Fall back to the plain decision_makers list if no structured
    # contacts were extracted, so the screen isn't empty just because
    # the source text didn't include emails/phone numbers.
    if not contacts:
        contacts = [
            {"name": name, "role": "", "email": "", "phone": ""}
            for name in (knowledge.get("decision_makers", []) or [])
        ]

    stakeholders = []

    for contact in contacts:
        name = contact.get("name", "") or "Unknown"
        role = contact.get("role", "")

        stakeholders.append(
            {
                "id": _slugify(f"{company_id}-{name}"),
                "name": name,
                "title": role or "Unknown role",
                "dept": role.split(" ")[0] if role else "General",
                "influence": _infer_influence(name, role, primary_decision_maker),
                "score": confidence,
                "linkedin": False,
                "email": contact.get("email", "") or "",
                "companyId": str(company_id),
                "evidence": knowledge.get("sources", []) or [],
                "painPoints": pain_points,
                "buyingSignals": buying_signals,
            }
        )

    return stakeholders


@router.get("/company/{company_id}/pain-points")
async def company_pain_points(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis, knowledge = _latest_knowledge_for_company(db, company_id, current_user.id)

    if analysis is None:
        return []

    knowledge = knowledge or {}
    points = knowledge.get("pain_points", []) or []
    confidence = knowledge.get("confidence", 0) or 0
    source_count = max(len(knowledge.get("sources", []) or []), 1)

    result = []

    for i, point in enumerate(points):
        severity = "critical" if i == 0 else "high" if i == 1 else "medium"

        result.append(
            {
                "id": _slugify(f"{company_id}-pain-{i}-{point}"),
                "title": point if len(point) <= 80 else point[:77] + "...",
                "severity": severity,
                "confidence": confidence,
                "sources": source_count,
                "excerpt": point,
                "companyId": str(company_id),
            }
        )

    return result


@router.get("/company/{company_id}/buying-signals")
async def company_buying_signals(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis, knowledge = _latest_knowledge_for_company(db, company_id, current_user.id)

    if analysis is None:
        return []

    knowledge = knowledge or {}
    signals = knowledge.get("buying_signals", []) or []

    result = []

    for i, signal in enumerate(signals):
        result.append(
            {
                "id": _slugify(f"{company_id}-signal-{i}-{signal}"),
                "title": signal,
                "strength": "strong" if i == 0 else "moderate",
                "detectedAt": analysis.created_at.date().isoformat(),
                "source": "Extracted from ingested notes",
            }
        )

    return result


@router.get("/company/{company_id}/graph")
async def company_graph(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    analysis, knowledge = _latest_knowledge_for_company(db, company_id, current_user.id)

    if analysis is None:
        return {"nodes": [], "edges": []}

    knowledge = knowledge or {}
    persona = analysis.persona or {}
    primary_decision_maker = persona.get("primary_decision_maker", "")

    contacts = knowledge.get("contacts", []) or []
    if not contacts:
        contacts = [
            {"name": name, "role": ""}
            for name in (knowledge.get("decision_makers", []) or [])
        ]

    pain_points = knowledge.get("pain_points", []) or []
    buying_signals = knowledge.get("buying_signals", []) or []
    confidence = knowledge.get("confidence", 0) or 0

    nodes = []
    decision_maker_id = None

    for contact in contacts:
        name = contact.get("name", "") or "Unknown"
        role = contact.get("role", "")
        node_id = _slugify(f"{company_id}-{name}")
        influence = _infer_influence(name, role, primary_decision_maker)

        if influence == "Decision Maker":
            decision_maker_id = node_id

        nodes.append(
            {
                "id": node_id,
                "name": name,
                "title": role or "Unknown role",
                "influence": influence,
                "confidence": confidence,
                "evidence": knowledge.get("sources", []) or [],
                "painPoints": pain_points,
                "buyingSignals": buying_signals,
            }
        )

    edges = []

    if decision_maker_id:
        for node in nodes:
            if node["id"] != decision_maker_id:
                edges.append(
                    {
                        "id": f"{node['id']}-{decision_maker_id}",
                        "source": node["id"],
                        "target": decision_maker_id,
                        "label": "reports to",
                    }
                )

    return {"nodes": nodes, "edges": edges}