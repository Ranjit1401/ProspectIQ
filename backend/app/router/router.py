from app.core.context import context


class Router:
    """
    Routes a task to the correct agent.
    """

    async def route(self, task: str):
        """
        Decide which agent should execute the task.
        """

        task = task.lower()

        # Later we'll replace this with an AI Router.

        if any(word in task for word in [
            "research",
            "explain",
            "what",
            "who",
            "why",
            "how",
            "ai",
        ]):
            return context.agent_registry.get("research")

        return context.agent_registry.get("research")