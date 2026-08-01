from abc import ABC, abstractmethod

from app.llm.manager import LLMManager
from app.tools.registry import ToolRegistry


class BaseAgent(ABC):
    """
    Base class for all RocketAI agents.
    """

    name: str
    description: str

    def __init__(
        self,
        llm: LLMManager,
        tools: ToolRegistry,
    ):
        self.llm = llm
        self.tools = tools

    @abstractmethod
    async def run(
        self,
        task: str,
    ):
        """
        Execute the agent.
        """
        pass