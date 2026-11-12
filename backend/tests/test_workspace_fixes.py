import asyncio
import unittest

from app.router.router import Router
from app.supervisor.supervisor import Supervisor
from app.utils.email_discovery import (
    clean_person_name,
    extract_emails_from_text,
    pick_best_email,
)


class TestWorkspaceAndRoutingFixes(unittest.TestCase):
    def test_router_routes_followup_question_to_research(self):
        router = Router()
        followup_prompt = (
            "[Active Company Context: Notion Labs, Inc.]\n"
            "[Prior Conversation History]:\n"
            "Assistant: [Analysis Report for Notion Labs] Recommendation: Proceed.\n\n"
            "[User Follow-Up Question]:\n"
            "what is the best time to send the msg or mail"
        )
        agent = asyncio.run(router.route(followup_prompt))
        self.assertEqual(agent.name, "research")

    def test_router_routes_company_brief_to_sales_analysis(self):
        router = Router()
        brief_prompt = (
            "Company: Notion Labs (notion.so)\n"
            "Industry: Enterprise Software\n"
            "Discovery Notes:\n"
            "- Priya Nair (VP of Revenue Operations) wants to reduce rep ramp time."
        )
        agent = asyncio.run(router.route(brief_prompt))
        self.assertEqual(agent.name, "sales_analysis")

    def test_email_discovery_helpers(self):
        text = "Reach out to priya.nair@notion.so or hello@notion.so. Ignore icon@2x.png and user@example.com."
        emails = extract_emails_from_text(text)
        self.assertIn("priya.nair@notion.so", emails)
        self.assertIn("hello@notion.so", emails)
        self.assertNotIn("icon@2x.png", emails)
        self.assertNotIn("user@example.com", emails)

        first, last = clean_person_name("Priya Nair, VP of Revenue Operations")
        self.assertEqual((first, last), ("Priya", "Nair"))

        best = pick_best_email(emails, "Priya Nair, VP of Revenue Operations", "notion.so")
        self.assertEqual(best, "priya.nair@notion.so")

    def test_supervisor_deterministic_cache_key_normalizes_whitespace(self):
        k1 = Supervisor._cache_key(1, "  Company:   Notion Labs \n  Notes:   test  ")
        k2 = Supervisor._cache_key(1, "Company: Notion Labs Notes: test")
        self.assertEqual(k1, k2)


if __name__ == "__main__":
    unittest.main()
