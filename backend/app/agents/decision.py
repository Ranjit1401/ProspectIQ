import json
import re


class DecisionEngine:
    """
    Uses the LLM to decide which tool should be used.
    """

    def __init__(self, llm):
        self.llm = llm

    async def choose_tool(self, task: str) -> str | None:

        prompt = f"""
You are RocketAI's Tool Selector.

Available tools:

1. calculator
   - Use for arithmetic and mathematical calculations.

2. weather
   - Use for weather, climate, forecast or temperature questions.

3. search
   - Use for:
     - Who is ...
     - What is ...
     - Latest news
     - Search requests
     - Find information
     - Current events
     - General factual questions requiring web search.

If no tool is required return:

{{"tool":"none"}}

Return ONLY valid JSON.

Example:

{{"tool":"calculator"}}

User Request:

{task}
"""

        response = await self.llm.generate(prompt)

        content = response.content.strip()

        # Handle ```json ... ``` responses
        if content.startswith("```"):
            content = (
                content.replace("```json", "")
                .replace("```", "")
                .strip()
            )

        try:

            data = json.loads(content)

            tool = data.get("tool", "none").lower()

            if tool == "none":
                return None

            return tool

        except Exception:

            # Fallback rule-based detection

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

            if any(word in task_lower for word in [
                "who is",
                "what is",
                "latest",
                "news",
                "search",
                "find",
                "tell me about",
            ]):
                return "search"

            return None

    async def extract_arguments(
        self,
        tool: str,
        task: str,
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

            query = (
                task.lower()
                .replace("search", "")
                .replace("find", "")
                .strip()
            )

            return {
                "query": query,
            }

        return {}