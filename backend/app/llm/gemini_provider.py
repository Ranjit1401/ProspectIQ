from app.llm.base import BaseLLMProvider
from app.llm.schemas import LLMResponse


class GeminiProvider(BaseLLMProvider):

    async def generate(self, prompt: str) -> LLMResponse:

        return LLMResponse(
            content=f"Gemini received: {prompt}",
            provider="gemini",
            model="placeholder",
        )