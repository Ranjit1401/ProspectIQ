from sqlalchemy.orm import Session

from app.agents.guardrail.agent import GuardrailAgent
from app.agents.intent.agent import IntentAgent
from app.agents.knowledge_ingestion.agent import KnowledgeIngestionAgent
from app.agents.persona.agent import PersonaAgent
from app.agents.strategy.agent import StrategyAgent
from app.models.user import User
from app.services.knowledge_service import KnowledgeService


class AssistantService:

    def __init__(self):

        self.ingestion = KnowledgeIngestionAgent()
        self.knowledge_service = KnowledgeService()

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

        # Step 1
        normalized = await self.ingestion.ingest(
            text=text,
        )

        # Step 2
        record = self.knowledge_service.save(
            db=db,
            user_id=current_user.id,
            normalized_data=normalized,
        )

        knowledge = record.processed_data["knowledge"]

        # Step 3
        persona = await self.persona.analyze(
            knowledge,
        )

        # Step 4
        intent = await self.intent.analyze(
            knowledge,
        )

        # Step 5
        strategy = await self.strategy.generate(
            knowledge,
        )

        # Step 6
        guardrail = await self.guardrail.verify(
            knowledge,
        )

        return {
            "knowledge_id": record.id,
            "knowledge": knowledge,
            "persona": persona,
            "intent": intent,
            "strategy": strategy,
            "guardrail": guardrail,
        }