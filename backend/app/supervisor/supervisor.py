import copy
import hashlib
import re

from app.router.router import Router
from app.planner.planner import Planner
from app.core.context import context
from app.core.events import emit_step
from app.models.analysis_result import AnalysisResult

from app.agents.knowledge_ingestion.agent import KnowledgeIngestionAgent
from app.agents.persona.agent import PersonaAgent
from app.agents.intent.agent import IntentAgent
from app.agents.strategy.agent import StrategyAgent
from app.agents.guardrail.agent import GuardrailAgent

# Deterministic response cache keyed by (user_id, sha256(normalized_prompt))
# so repeating the exact same prompt returns identical scores and answers.
_DETERMINISTIC_CACHE: dict[tuple[int, str], dict] = {}


class Supervisor:
    """
    Orchestrates the execution of a user task: plans it, routes it to
    the correct agent, runs it, and records it in that user's memory.
    """

    def __init__(self):

        self.router = Router()
        self.planner = Planner()

    @staticmethod
    def _cache_key(user_id: int, task: str) -> tuple[int, str]:
        normalized = re.sub(r"\s+", " ", task).strip()
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        return (user_id, digest)

    async def execute(self, task: str, current_user, db, emit=None):

        context.memory.add(current_user.id, "user", task)

        key = self._cache_key(current_user.id, task)
        cached = _DETERMINISTIC_CACHE.get(key)
        if cached is not None:
            # If this was a sales analysis, verify the saved record still exists in DB
            analysis_id = (
                cached.get("result", {})
                .get("response", {})
                .get("analysis_id")
                if isinstance(cached.get("result", {}).get("response"), dict)
                else None
            )
            still_valid = True
            if analysis_id is not None:
                exists = (
                    db.query(AnalysisResult.id)
                    .filter(
                        AnalysisResult.id == analysis_id,
                        AnalysisResult.user_id == current_user.id,
                    )
                    .first()
                )
                still_valid = exists is not None

            if still_valid:
                await emit_step(
                    emit,
                    id="plan",
                    label="Matched identical prompt — retrieving deterministic result...",
                    status="done",
                    agent="Planner",
                )
                await emit_step(
                    emit,
                    id="route",
                    label=f"Routed to the {cached['agent']} agent.",
                    status="done",
                    agent="Router",
                )
                payload = copy.deepcopy(cached)
                payload["memory"] = context.memory.get_history(current_user.id)
                return payload
            else:
                _DETERMINISTIC_CACHE.pop(key, None)

        await emit_step(
            emit,
            id="plan",
            label="Planning the task...",
            status="active",
            agent="Planner",
        )

        plan = await self.planner.create_plan(task)

        await emit_step(
            emit,
            id="plan",
            label="Task plan ready.",
            status="done",
            agent="Planner",
        )

        await emit_step(
            emit,
            id="route",
            label="Routing to the right agent...",
            status="active",
            agent="Router",
        )

        agent = await self.router.route(task)

        await emit_step(
            emit,
            id="route",
            label=f"Routed to the {agent.name} agent.",
            status="done",
            agent="Router",
        )

        result = await agent.run(
            task,
            current_user=current_user,
            db=db,
            emit=emit,
        )

        response = result.get("response")

        if hasattr(response, "content"):
            memory_text = response.content
        else:
            memory_text = str(response)

        context.memory.add(current_user.id, "assistant", memory_text)

        payload = {
            "task": task,
            "plan": plan,
            "agent": agent.name,
            "result": result,
            "memory": context.memory.get_history(current_user.id),
        }

        # Cache successful deterministic result for identical repeat prompts
        _DETERMINISTIC_CACHE[key] = copy.deepcopy(payload)

        return payload