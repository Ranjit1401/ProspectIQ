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