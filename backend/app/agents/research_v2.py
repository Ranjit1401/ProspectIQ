from app.agents.base import BaseAgent
from app.agents.decision import DecisionEngine
from app.utils.company_website import find_official_website


class ResearchAgentV2(BaseAgent):
    """
    Research Agent V2

    Stage 1:
    - Decide research plan
    - Execute multiple searches
    - Fetch official website and latest news
    - Combine into a single evidence text via LLM (token-optimized)
    """

    name = "research"
    description = "Multi-source Research Agent"

    def __init__(self, llm, tools):
        super().__init__(llm, tools)
        self.decision = DecisionEngine(self.llm)

    async def run(
        self,
        task: str,
        **kwargs,
    ):
        # -----------------------------
        # Build research plan
        # -----------------------------
        decision = await self.decision.choose_tool(task)

        if decision is None:
            return {
                "agent": self.name,
                "tool_used": None,
                "evidence": task,
                "sources": [],
            }

        tool = decision.get("tool")

        # -----------------------------------
        # Search Pipeline
        # -----------------------------------
        if tool == "search":
            queries = decision.get("queries", [task])
            results = []

            for query in queries:
                args = await self.decision.extract_arguments(
                    tool="search",
                    task=task,
                    query=query,
                )

                search_result = await self.tools.execute(
                    "search",
                    **args,
                )

                if search_result.get("success"):
                    results.extend(search_result["results"])

            # Remove duplicate URLs
            unique = {}
            for item in results:
                url = item.get("url")
                if url:
                    unique[url] = item

            merged = list(unique.values())

            # Token Optimization: Limit top search results to 5
            top_sources = merged[:5]

            # -----------------------------------
            # Step 2: Official Website
            # -----------------------------------
            website = None
            official_url = find_official_website(top_sources)

            if official_url:
                website = await self.tools.execute(
                    "website",
                    url=official_url,
                )

            # -----------------------------------
            # Step 3: News Pipeline
            # -----------------------------------
            news_args = await self.decision.extract_arguments(
                tool="news",
                task=task,
            )

            news = await self.tools.execute(
                "news",
                **news_args,
            )

            # -----------------------------------
            # Step 4: Build Token-Optimized Search Text
            # -----------------------------------
            search_text = ""

            # Top 5 search results only
            for item in top_sources:
                search_text += f"""
Title:{item.get("title", "")}
Content:{item.get("content", "")}
"""

            if website and website.get("content"):
                search_text += f"""
Website:{website.get("content", "")}
"""

            # Top 5 news articles only
            if news and news.get("success") and news.get("results"):
                search_text += "\nLatest News:\n"
                for article in news["results"][:5]:
                    search_text += f"""
Title:{article.get("title", "")}
Content:{article.get("content", "")}
"""

            # -----------------------------------
            # Step 5: LLM Call for Evidence Synthesis
            # -----------------------------------
            prompt = f"""
User Request: {task}

Collected Information:
{search_text}

Return factual evidence only.
Do NOT answer the user.

Keep:
Company
Website
Industry
Products
CEO
Decision Makers
AI
Recent News
Hiring
Competitors
Business Goals
"""

            response = await self.llm.generate(prompt)
            evidence = response.content

            # -----------------------------------
            # Step 6: Final Return
            # -----------------------------------
            return {
                "agent": self.name,
                "tool_used": [
                    "search",
                    "website",
                    "news",
                ],
                "queries": queries,
                "sources": top_sources,
                "website": website,
                "news": news,
                "evidence": evidence,
            }

        # -----------------------------------
        # Calculator
        # -----------------------------------
        if tool == "calculator":
            args = await self.decision.extract_arguments(
                tool,
                task,
            )

            result = await self.tools.execute(
                tool,
                **args,
            )

            return {
                "agent": self.name,
                "tool_used": [
                    "calculator",
                ],
                "response": result,
                "evidence": str(result),
            }

        # -----------------------------------
        # Weather
        # -----------------------------------
        if tool == "weather":
            args = await self.decision.extract_arguments(
                tool,
                task,
            )

            result = await self.tools.execute(
                tool,
                **args,
            )

            return {
                "agent": self.name,
                "tool_used": [
                    "weather",
                ],
                "response": result,
                "evidence": str(result),
            }

        return {
            "agent": self.name,
            "tool_used": None,
            "response": task,
            "evidence": task,
        }