from app.agents.research_agent import ResearchAgent
from app.llm.gemini_provider import GeminiProvider
from app.llm.groq_provider import GroqProvider
from app.llm.manager import LLMManager
from app.llm.ollama_provider import OllamaProvider
from app.registry.agent_registry import AgentRegistry
from app.registry.provider_registry import ProviderRegistry
from app.tools.calculator import CalculatorTool
from app.tools.registry import ToolRegistry
from app.memory.memory import Memory
from app.tools.weather import WeatherTool
from app.tools.search import SearchTool
from app.tools.news import NewsTool
from app.tools.website_tool import WebsiteTool

class AppContext:
    """
    Shared application context.

    Initializes all framework-wide registries and managers
    exactly once when the application starts.
    """

    def __init__(self):
        # ==========================================
        # Provider Registry
        # ==========================================
        self.provider_registry = ProviderRegistry()

        self.provider_registry.register(
            "groq",
            GroqProvider(),
        )

        self.provider_registry.register(
            "gemini",
            GeminiProvider(),
        )

        self.provider_registry.register(
            "ollama",
            OllamaProvider(),
        )

        # ==========================================
        # LLM Manager
        # ==========================================
        self.llm = LLMManager(
            self.provider_registry
        )

        # ==========================================
        # Tool Registry
        # ==========================================
        self.tool_registry = ToolRegistry()

        self.tool_registry.register(
            CalculatorTool()
        )

        self.tool_registry.register(
            SearchTool()
        )

        # ==========================================
        # Agent Registry
        # ==========================================
        self.agent_registry = AgentRegistry()

        self.tool_registry.register(
            WeatherTool()
        )

        self.agent_registry.register(
            ResearchAgent(
                self.llm,
                self.tool_registry,
            )
        )

        self.tool_registry.register(
            NewsTool()
        )

        self.tool_registry.register(
            WebsiteTool()
        )

        # ---------- Memory ----------

        self.memory = Memory()


# Singleton instance used across the application
context = AppContext()