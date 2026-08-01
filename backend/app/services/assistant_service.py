import time

from sqlalchemy.orm import Session

from app.agents.guardrail.agent import GuardrailAgent
from app.agents.intent.agent import IntentAgent
from app.agents.knowledge_ingestion.agent import KnowledgeIngestionAgent
from app.agents.persona.agent import PersonaAgent
from app.agents.strategy.agent import StrategyAgent

from app.models.user import User

from app.services.analysis_service import AnalysisService
from app.services.knowledge_service import KnowledgeService
from app.services.company_service import CompanyService


class AssistantService:

    def __init__(self):

        self.ingestion = KnowledgeIngestionAgent()

        self.knowledge_service = KnowledgeService()

        self.analysis_service = AnalysisService()

        self.persona = PersonaAgent()

        self.intent = IntentAgent()

        self.strategy = StrategyAgent()

        self.guardrail = GuardrailAgent()

        self.company_service = CompanyService()

    async def analyze(
        self,
        text: str,
        current_user: User,
        db: Session,
    ):

        start_time = time.perf_counter()

        timeline = []

        # =====================================================
        # Step 1 : Knowledge Ingestion
        # =====================================================

        step_start = time.perf_counter()

        normalized = await self.ingestion.ingest(text=text)

        timeline.append(
            {
                "step": 1,
                "agent": "Knowledge Ingestion",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 2 : Save Knowledge
        # =====================================================

        step_start = time.perf_counter()

        record = self.knowledge_service.save(
            db=db,
            user_id=current_user.id,
            normalized_data=normalized,
        )

        knowledge = record.processed_data["knowledge"]

        company = self.company_service.get_or_create(
            db=db,
            name=knowledge.get("company", ""),
            website=knowledge.get("website", ""),
            industry=knowledge.get("industry", ""),
        )

        timeline.append(
            {
                "step": 2,
                "agent": "Knowledge Repository",
                "status": "saved",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 3 : Persona Agent
        # =====================================================

        step_start = time.perf_counter()

        persona = await self.persona.analyze(knowledge)

        timeline.append(
            {
                "step": 3,
                "agent": "Persona Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 4 : Intent Agent
        # =====================================================

        step_start = time.perf_counter()

        intent = await self.intent.analyze(knowledge)

        timeline.append(
            {
                "step": 4,
                "agent": "Intent Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 5 : Strategy Agent
        # =====================================================

        step_start = time.perf_counter()

        strategy = await self.strategy.generate(knowledge)

        timeline.append(
            {
                "step": 5,
                "agent": "Strategy Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Step 6 : Guardrail Agent
        # =====================================================

        step_start = time.perf_counter()

        guardrail = await self.guardrail.verify(knowledge)

        timeline.append(
            {
                "step": 6,
                "agent": "Guardrail Agent",
                "status": "completed",
                "duration_ms": round(
                    (time.perf_counter() - step_start) * 1000,
                    2,
                ),
            }
        )

        # =====================================================
        # Execution Metrics
        # =====================================================

        total_time = round(
            (time.perf_counter() - start_time) * 1000,
            2,
        )

        execution = {
            "total_time_ms": total_time,
            "agents_executed": 5,
            "knowledge_saved": True,
        }

        # =====================================================
        # Executive Summary
        # =====================================================

        overall_assessment = {
            "company": knowledge.get("company", ""),
            "decision_maker": (
                persona.get("primary_decision_maker")
                or (
                    knowledge.get("decision_makers", [""])[0]
                    if knowledge.get("decision_makers")
                    else ""
                )
            ),
            "intent_score": intent.get("intent_score", 0),
            "buying_stage": intent.get("buying_stage", ""),
            "priority": intent.get("priority", ""),
            "risk_level": guardrail.get("risk_level", ""),
            "approved": guardrail.get("approved", False),
            "next_action": strategy.get(
                "next_best_action",
                "",
            ),
            "overall_recommendation": guardrail.get(
                "recommendation",
                "",
            ),
        }

        # =====================================================
        # Save Analysis
        # =====================================================

        analysis = self.analysis_service.save(
            db=db,
            user_id=current_user.id,
            company_id=company.id,
            knowledge_id=record.id,
            persona=persona,
            intent=intent,
            strategy=strategy,
            guardrail=guardrail,
            overall_assessment=overall_assessment,
            timeline=timeline,
            execution=execution,
        )

        # =====================================================
        # Final Response
        # =====================================================

        return {
            "analysis_id": analysis.id,

            "overall_assessment": overall_assessment,

            "knowledge_id": record.id,

            "knowledge": knowledge,

            "persona": persona,

            "intent": intent,

            "strategy": strategy,

            "guardrail": guardrail,

            "timeline": timeline,

            "execution": execution,
        }