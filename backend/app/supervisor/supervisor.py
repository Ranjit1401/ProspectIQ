from app.router.router import Router
from app.planner.planner import Planner
from app.core.context import context

from app.agents.knowledge_ingestion.agent import KnowledgeIngestionAgent
from app.agents.persona.agent import PersonaAgent
from app.agents.intent.agent import IntentAgent
from app.agents.strategy.agent import StrategyAgent
from app.agents.guardrail.agent import GuardrailAgent


class Supervisor:
    """
    Main Orchestrator

    Flow

    User
        ↓
    Planner
        ↓
    Research Agent
        ↓
    Knowledge Ingestion
        ↓
    Persona
        ↓
    Intent
        ↓
    Strategy
        ↓
    Guardrail
        ↓
    Final Response
    """

    def __init__(self):

        self.router = Router()
        self.planner = Planner()

        self.knowledge = KnowledgeIngestionAgent()
        self.persona = PersonaAgent()
        self.intent = IntentAgent()
        self.strategy = StrategyAgent()
        self.guardrail = GuardrailAgent()

    async def execute(
        self,
        task: str,
    ):

        # ----------------------------------
        # Store User Message
        # ----------------------------------

        context.memory.add(
            "user",
            task,
        )

        # ----------------------------------
        # Create Plan
        # ----------------------------------

        plan = await self.planner.create_plan(
            task
        )

        # ----------------------------------
        # Research Agent
        # ----------------------------------

        research_agent = await self.router.route(
            task
        )

        research = await research_agent.run(
            task
        )

        evidence = research.get(
            "evidence",
            "",
        )

        # ----------------------------------
        # Knowledge Ingestion
        # ----------------------------------

        knowledge = await self.knowledge.ingest(
            text=evidence,
        )

        knowledge_data = knowledge.get(
            "knowledge",
            {},
        )

        # ----------------------------------
        # Persona
        # ----------------------------------

        persona = await self.persona.analyze(
            knowledge_data
        )

        # ----------------------------------
        # Intent
        # ----------------------------------

        intent = await self.intent.analyze(
            knowledge_data
        )

        # ----------------------------------
        # Strategy
        # ----------------------------------

        strategy = await self.strategy.generate(
            knowledge_data,
            persona,
            intent,
        )

        # ----------------------------------
        # Guardrail
        # ----------------------------------

        guardrail = await self.guardrail.verify(
            knowledge_data,
            persona,
            intent,
            strategy,
        )

        # ----------------------------------
        # Save Memory
        # ----------------------------------

        context.memory.add(
            "assistant",
            strategy.get(
                "account_summary",
                "",
            ),
        )

        # ----------------------------------
        # Final Result
        # ----------------------------------

        return {

            "task": task,

            "plan": plan,

            "research": research,

            "knowledge": knowledge,

            "persona": persona,

            "intent": intent,

            "strategy": strategy,

            "guardrail": guardrail,

            "memory": context.memory.get_history(),

        }