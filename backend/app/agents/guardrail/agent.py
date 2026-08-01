import json

from app.agents.guardrail.prompt import GUARDRAIL_PROMPT
from app.agents.intent.agent import IntentAgent
from app.agents.persona.agent import PersonaAgent
from app.agents.strategy.agent import StrategyAgent
from app.core.context import context
from app.utils.llm_json import LLMJsonParser


class GuardrailAgent:

    async def verify(
        self,
        knowledge: dict,
    ):

        persona = await PersonaAgent().analyze(knowledge)

        intent = await IntentAgent().analyze(knowledge)

        strategy = await StrategyAgent().generate(knowledge)

        prompt = f"""
{GUARDRAIL_PROMPT}

Knowledge:

{json.dumps(knowledge, indent=2)}

Persona:

{json.dumps(persona, indent=2)}

Intent:

{json.dumps(intent, indent=2)}

Strategy:

{json.dumps(strategy, indent=2)}
"""

        response = await context.llm.generate(prompt)

        try:

            return LLMJsonParser.parse(response)

        except Exception as e:

            print("Guardrail Agent Error:", e)

            return {
                "approved": False,
                "confidence": 0,
                "supported_claims": [],
                "unsupported_claims": [],
                "risk_level": "High",
                "recommendation": "",
                "reasoning": "",
            }