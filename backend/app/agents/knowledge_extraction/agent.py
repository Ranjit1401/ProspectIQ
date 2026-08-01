import json
import re

from app.agents.knowledge_extraction.prompt import EXTRACTION_PROMPT
from app.core.context import context


class KnowledgeExtractionAgent:
    """
    Extracts structured business knowledge from raw text
    using the configured LLM.
    """

    @staticmethod
    def _clean_json(text: str) -> str:
        """
        Removes markdown code blocks and extra whitespace.
        """

        text = text.strip()

        # Remove ```json
        text = re.sub(
            r"^```json",
            "",
            text,
            flags=re.IGNORECASE,
        )

        # Remove opening ```
        text = re.sub(
            r"^```",
            "",
            text,
        )

        # Remove closing ```
        text = re.sub(
            r"```$",
            "",
            text,
        )

        return text.strip()

    async def extract(
        self,
        text: str,
    ) -> dict:

        prompt = f"""
{EXTRACTION_PROMPT}

Business Data:

{text}
"""

        response = await context.llm.generate(prompt)

        try:

            content = self._clean_json(
                response.content
            )

            data = json.loads(content)

            return data

        except Exception as e:

            print("Knowledge Extraction Error:", e)
            print(response.content)


            return {
                "company": "",
                "industry": "",
                "website": "",
                "contacts": [],
                "products": [],
                "pain_points": [],
                "buying_signals": [],
                "competitors": [],
                "technologies": [],
                "summary": response.content,
            }