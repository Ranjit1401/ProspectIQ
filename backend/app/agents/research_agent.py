import asyncio
import re
from urllib.parse import urlparse
from app.agents.base import BaseAgent
from app.agents.decision import DecisionEngine
from app.utils.company_website import find_official_website

# Common aggregators and third-party sites that shouldn't be picked as "official website"
NON_OFFICIAL_DOMAINS = {
    "stockstory.org",
    "yahoo.com",
    "finance.yahoo.com",
    "seekingalpha.com",
    "wikipedia.org",
    "linkedin.com",
    "bloomberg.com",
    "reuters.com",
    "marketwatch.com",
    "glassdoor.com",
    "crunchbase.com",
    "sec.gov",
    "cnbc.com",
    "forbes.com",
    "businessinsider.com",
}


def filter_valid_official_candidates(results: list) -> list:
    """Filter out known stock/news aggregators before running official website finder."""
    filtered = []
    for item in results:
        url = item.get("url", "")
        domain = urlparse(url).netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]

        if not any(domain.endswith(blacklisted) for blacklisted in NON_OFFICIAL_DOMAINS):
            filtered.append(item)
    return filtered


class ResearchAgent(BaseAgent):
    """
    Research Agent

    Responsibilities:
    - Decide which tool(s) to use
    - Collect evidence
    - Return evidence only
    """

    name = "research"
    description = "Research Agent"

    def __init__(self, llm, tools):
        super().__init__(llm, tools)
        self.decision = DecisionEngine(self.llm)

    async def run(self, task: str):

        decision = await self.decision.choose_tool(task)

        if decision is None:
            return {
                "agent": self.name,
                "tool_used": None,
                "evidence": task,
            }

        tool = decision.get("tool") if isinstance(decision, dict) else decision

        # ------------------------------
        # SEARCH & RESEARCH PIPELINE
        # ------------------------------

        if tool in ["search", "research"]:

            queries = decision.get("queries", [task]) if isinstance(decision, dict) else [task]

            # ----------------------------------
            # Execute Searches in Parallel
            # ----------------------------------
            search_tasks = []
            for query in queries:
                args = await self.decision.extract_arguments(
                    tool="search",
                    task=task,
                    query=query,
                )

                search_tasks.append(
                    self.tools.execute(
                        "search",
                        **args,
                    )
                )

            search_results = await asyncio.gather(
                *search_tasks,
                return_exceptions=True,
            )

            all_results = []
            for result in search_results:
                if isinstance(result, Exception):
                    continue

                if result.get("success"):
                    all_results.extend(
                        result.get("results", [])
                    )

            # Remove duplicate URLs
            unique = {}
            for item in all_results:
                if "url" in item:
                    unique[item["url"]] = item

            merged_results = list(unique.values())

            # Resolve official website safely by filtering third-party domains
            candidate_results = filter_valid_official_candidates(merged_results)
            official_website = find_official_website(candidate_results)

            # Extract company name for news
            news_args = await self.decision.extract_arguments(
                tool="news",
                task=task,
            )

            company_name = news_args.get("company") if isinstance(news_args, dict) else None
            if not company_name:
                company_name = task

            # ----------------------------------
            # Execute Website & News in Parallel
            # ----------------------------------
            website_task = None
            if official_website:
                website_task = self.tools.execute(
                    "website",
                    url=official_website,
                )

            news_task = self.tools.execute(
                "news",
                company=company_name,
            )

            tasks = []
            if website_task:
                tasks.append(website_task)
            tasks.append(news_task)

            results = await asyncio.gather(
                *tasks,
                return_exceptions=True,
            )

            website_result = None
            news_result = None
            index = 0

            if website_task:
                if isinstance(results[index], Exception):
                    website_result = {
                        "success": False,
                        "error": str(results[index]),
                    }
                else:
                    website_result = results[index]
                index += 1

            if isinstance(results[index], Exception):
                news_result = {
                    "success": False,
                    "error": str(results[index]),
                }
            else:
                news_result = results[index]

            # Construct evidence text including Website, Search, and News with Source URLs
            search_text = ""

            if website_result and website_result.get("success"):
                search_text += f"\nOfficial Website:\n{website_result.get('content', '')}\n"

            if news_result and news_result.get("success"):
                search_text += "\nLatest News:\n"
                for news_item in news_result.get("results", []):
                    search_text += f"""

Source:{news_item.get("url","")}

Title:{news_item.get("title","")}

Content:{news_item.get("content","")}

"""

            search_text += "\nSearch Results:\n"
            for item in merged_results:
                search_text += f"""

Source:{item.get("url","")}

Title:{item.get("title","")}

Content:{item.get("content","")}

"""

            # LLM Evidence Synthesis
            evidence_prompt = f"""
You are ProspectIQ's Research Agent.

User Request:

{task}

Collected Evidence:

{search_text}

Your job:

1. Merge all information.
2. Remove duplicates.
3. Keep only factual information.
4. Keep names.
5. Keep products.
6. Keep leaders.
7. Keep AI initiatives.
8. Keep hiring.
9. Keep competitors.
10. Keep business goals.

DO NOT answer the user.

Return only evidence.
"""

            response = await self.llm.generate(evidence_prompt)

            evidence = (
                response.content
                if hasattr(response, "content")
                else str(response)
            )

            tools_used = ["search"]
            if website_result and website_result.get("success"):
                tools_used.append("website")
            if news_result and news_result.get("success"):
                tools_used.append("news")

            return {
                "agent": self.name,
                "tool_used": tools_used,
                "queries": queries,
                "official_website": official_website,
                "search_sources": merged_results,
                "news_sources": news_result.get("results", []) if news_result and news_result.get("success") else [],
                "evidence": evidence,
            }

        # ------------------------------
        # WEATHER
        # ------------------------------

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
                "tool_used": tool,
                "evidence": str(result),
            }

        # ------------------------------
        # CALCULATOR
        # ------------------------------

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
                "tool_used": tool,
                "evidence": str(result),
            }

        # Safe fallback for unhandled tool types without false claims
        return {
            "agent": self.name,
            "tool_used": tool,
            "evidence": task,
        }