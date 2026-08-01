import json
import re

from app.agents.persona.prompt import PERSONA_PROMPT
from app.core.context import context


class PersonaAgent:

    @staticmethod
    def clean_json(text: str):

        text = text.strip()

        text = re.sub(
            r"^```json",
            "",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"^```",
            "",
            text,
        )

        text = re.sub(
            r"```$",
            "",
            text,
        )

        return text.strip()

    async def analyze(
        self,
        knowledge: dict,
    ):
    
        prompt = f"""
    {PERSONA_PROMPT}
    
    Knowledge:
    
    {json.dumps(knowledge, indent=2)}
    """
    
        response = await context.llm.generate(prompt)
    
        print("\n========== PERSONA RAW RESPONSE ==========")
        print(response)
        print("==========================================\n")
    
        try:
        
            cleaned = self.clean_json(
                response.content
            )
    
            print("\n========== CLEANED JSON ==========")
            print(cleaned)
            print("=================================\n")
    
            return json.loads(cleaned)
    
        except Exception as e:
        
            print("Persona Parsing Error:", e)
    
            return {
                "primary_decision_maker": "",
                "buyer_persona": "",
                "decision_level": "",
                "communication_style": "",
                "key_interests": [],
                "recommended_approach": "",
            }