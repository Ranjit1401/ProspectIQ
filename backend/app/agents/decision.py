import json
import re


class DecisionEngine:
    """
    Uses the LLM to decide which tool should be used and
    generates a research plan.
    """

    def __init__(self, llm):
        self.llm = llm

    async def choose_tool(self, task: str):

        prompt = f"""
You are ProspectIQ's Research Planner.

Available tools:

1. calculator
2. weather
3. search
4. news
   - Latest company news
   - Funding
   - Partnerships
   - Acquisitions
   - Product launches
For company research, DO NOT perform only one search.

Generate multiple focused search queries.

Example:

{{
    "tool":"search",
    "queries":[
        "Microsoft company overview",
        "Microsoft leadership",
        "Microsoft products",
        "Microsoft AI initiatives",
        "Microsoft recent news",
        "Microsoft hiring",
        "Microsoft competitors",
        "Microsoft financials"
    ]
}}

For calculator:

{{"tool":"calculator"}}

For weather:

{{"tool":"weather"}}

If no tool is required:

{{"tool":"none"}}

Return ONLY valid JSON.

User Request:

{task}
"""

        response = await self.llm.generate(prompt)

        content = response.content.strip()

        if content.startswith("```"):
            content = (
                content.replace("```json", "")
                .replace("```", "")
                .strip()
            )

        try:

            data = json.loads(content)

            if data.get("tool") == "none":
                return None

            return data.get("tool")

        except Exception:

            task_lower = task.lower()

            if any(op in task for op in ["+", "-", "*", "/", "%"]):
                return "calculator"

            if any(word in task_lower for word in [
                "weather",
                "forecast",
                "temperature",
                "climate",
            ]):
                return "weather"

            return "search"

    async def extract_arguments(
        self,
        tool: str,
        task: str,
        query: str | None = None,
    ):

        if tool == "calculator":

            match = re.search(
                r"[0-9+\-*/().% ]+",
                task,
            )

            expression = match.group().strip() if match else task

            return {
                "expression": expression,
            }

        elif tool == "weather":

            city = (
                task.lower()
                .replace("weather", "")
                .replace("forecast", "")
                .replace("temperature", "")
                .replace("in", "")
                .strip()
            )

            if not city:
                city = "Mumbai"

            return {
                "city": city.title(),
            }

        elif tool == "search":

            if query:

                return {
                    "query": query,
                }

            return {
                "query": task,
            }

        elif tool == "news":
            return {
                "company": task,
            }

        return {}