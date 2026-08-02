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
    Orchestrates the execution of a user task: plans it, routes it to
    the correct agent, runs it, and records it in that user's memory.
    """

    def __init__(self):

        self.router = Router()
        self.planner = Planner()

    async def execute(self, task: str, current_user, db):

        context.memory.add(current_user.id, "user", task)

        plan = await self.planner.create_plan(task)

        agent = await self.router.route(task)

        result = await agent.run(
            task,
            current_user=current_user,
            db=db,
        )

        response = result.get("response")

        if hasattr(response, "content"):
            memory_text = response.content
        else:
            memory_text = str(response)

        context.memory.add(current_user.id, "assistant", memory_text)

        return {

            "task": task,

            "plan": plan,
            
            "agent": agent.name,

            "result": result,

            # "research": research,

            # "knowledge": knowledge,

            # "persona": persona,

            # "intent": intent,

            # "strategy": strategy,

            # "guardrail": guardrail,

            "memory": context.memory.get_history(current_user.id),

        }