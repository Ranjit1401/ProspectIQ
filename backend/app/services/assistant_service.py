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


class AssistantService:

    def __init__(self):

        self.ingestion = KnowledgeIngestionAgent()

        self.knowledge_service = KnowledgeService()

        self.analysis_service = AnalysisService()

        self.persona = PersonaAgent()

        self.intent = IntentAgent()

        self.strategy = StrategyAgent()

        self.guardrail = GuardrailAgent()

    async def analyze(
        self,
        text: str,
        current_user: User,
        db: Session,
    ):

        start_time = time.perf_counter()

        timeline = []

        # ---------------------------------------------------
        # Step 1 - Knowledge Ingestion
        # ---------------------------------------------------

        normalized = await self.ingestion.ingest(
            text=text,
        )

        timeline.append(
            {
                "step": 1,
                "agent": "Knowledge Ingestion",
                "status": "completed",
            }
        )

        # ---------------------------------------------------
        # Step 2 - Save Knowledge
        # ---------------------------------------------------

        record = self.knowledge_service.save(
            db=db,
            user_id=current_user.id,
            normalized_data=normalized,
        )

        knowledge = record.processed_data["knowledge"]

        timeline.append(
            {
                "step": 2,
                "agent": "Knowledge Repository",
                "status": "saved",
            }
        )

        # ---------------------------------------------------
        # Step 3 - Persona
        # ---------------------------------------------------

        persona = await self.persona.analyze(
            knowledge,
        )

        timeline.append(
            {
                "step": 3,
                "agent": "Persona Agent",
                "status": "completed",
            }
        )

        # ---------------------------------------------------
        # Step 4 - Intent
        # ---------------------------------------------------

        intent = await self.intent.analyze(
            knowledge,
        )

        timeline.append(
            {
                "step": 4,
                "agent": "Intent Agent",
                "status": "completed",
            }
        )

        # ---------------------------------------------------
        # Step 5 - Strategy
        # ---------------------------------------------------

        strategy = await self.strategy.generate(
            knowledge,
        )

        timeline.append(
            {
                "step": 5,
                "agent": "Strategy Agent",
                "status": "completed",
            }
        )

        # ---------------------------------------------------
        # Step 6 - Guardrail
        # ---------------------------------------------------

        guardrail = await self.guardrail.verify(
            knowledge,
        )

        timeline.append(
            {
                "step": 6,
                "agent": "Guardrail Agent",
                "status": "completed",
            }
        )

        # ---------------------------------------------------
        # Execution Metrics
        # ---------------------------------------------------

        execution = {
            "total_time_ms": round(
                (time.perf_counter() - start_time) * 1000,
                2,
            ),
            "agents_executed": 5,
            "knowledge_saved": True,
        }

        # ---------------------------------------------------
        # Save Full Analysis
        # ---------------------------------------------------

        analysis = self.analysis_service.save(
            db=db,
            user_id=current_user.id,
            knowledge_id=record.id,
            persona=persona,
            intent=intent,
            strategy=strategy,
            guardrail=guardrail,
            timeline=timeline,
            execution=execution,
        )

        # ---------------------------------------------------
        # Final Response
        # ---------------------------------------------------

        return {
            "analysis_id": analysis.id,
            "knowledge_id": record.id,
            "knowledge": knowledge,
            "persona": persona,
            "intent": intent,
            "strategy": strategy,
            "guardrail": guardrail,
            "timeline": timeline,
            "execution": execution,
        }