import re
from app.core.context import context


class Router:
    """
    Routes a task to the correct agent.
    """

    RESEARCH_SIGNALS = (
        "what ",
        "what's ",
        "who ",
        "who's ",
        "why ",
        "when ",
        "where ",
        "which ",
        "how ",
        "can you ",
        "could you ",
        "would you ",
        "tell me ",
        "explain ",
        "summarize ",
        "suggest ",
        "give me ",
        "write ",
        "draft ",
        "best time",
        "calculate",
        "weather",
        "forecast",
        "latest news",
        "compare ",
    )

    ANALYSIS_MARKERS = (
        "company:",
        "discovery notes:",
        "industry:",
        "analyze this company",
        "analyze company",
        "prepare an executive brief",
        "sales intelligence pipeline",
    )

    @classmethod
    def _extract_latest_user_prompt(cls, task: str) -> str:
        """
        The frontend prepends conversation history using
        `[User Follow-Up Question]:\\n...`. Extract the actual question so
        prior context doesn't make a 9-word question look like an 80-word brief.
        """
        marker = "[User Follow-Up Question]:"
        if marker in task:
            return task.split(marker, 1)[1].strip()
        return task.strip()

    async def route(self, task: str):
        """
        Decide whether a prompt is a conversational/research question
        (`research` agent) or a full prospect brief (`sales_analysis` pipeline).
        """
        latest_prompt = self._extract_latest_user_prompt(task)
        normalized = re.sub(r"\s+", " ", latest_prompt.lower()).strip()

        # Explicit company brief / pipeline prompts always go to sales_analysis
        if any(marker in normalized for marker in self.ANALYSIS_MARKERS):
            return context.agent_registry.get("sales_analysis")

        looks_like_question = normalized.endswith("?") or any(
            normalized.startswith(signal) for signal in self.RESEARCH_SIGNALS
        )
        word_count = len(normalized.split())

        if looks_like_question and word_count <= 40:
            return context.agent_registry.get("research")

        return context.agent_registry.get("sales_analysis")