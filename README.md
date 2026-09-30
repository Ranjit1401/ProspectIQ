# ProspectIQ

**A guardrail for AI sales outreach: every claim is checked against evidence before anything reaches a prospect.**

ProspectIQ researches a target account, builds a buyer persona and a strategy, then runs every claim in that strategy through a **Guardrail agent** that verifies it against the source evidence. Unsupported claims are flagged, risky strategies are blocked, and nothing is sent without explicit human approval.

Built for NexBuildOn Hack 2026 (Domain 4: Agentic AI) by Team Decoders.

**Live demo:** https://prospect-iq-oobr.vercel.app

![ProspectIQ](image.png)
---

## The problem

AI tools can write a personalized sales email in seconds, but they also invent facts: a funding round that never happened, a product launch that doesn't exist, a job title that's wrong. One fabricated line in a cold email can burn a prospect for good.

ProspectIQ's answer is to verify before sending. Every claim traces back to a source, and claims that can't be traced don't go out.

---

## Guardrail in action

<!-- TODO: fill this in with ONE real run from your app. Example format:

| Claim in draft | Evidence found | Verdict |
|---|---|---|
| "<claim the AI wrote>" | <source link or "none found"> | Supported / Blocked |

Add the real risk level the Guardrail agent assigned. Do not invent numbers. -->

---

## How it works

1. **Research and knowledge extraction**: notes, a company brief, or a URL go into a knowledge agent that pulls out company facts, decision-makers, pain points and buying signals. `ResearchAgentV2` can run web and news research from the Workspace chat and returns cited sources.
2. **Persona and intent**: separate agents build a buyer persona and score purchase intent and buying stage.
3. **Strategy**: a strategy agent turns persona and intent into a recommended next action and messaging angle.
4. **Guardrail**: every claim is checked against the evidence. Unsupported claims are flagged, a risk level is assigned, and unverified strategies are blocked until a human reviews them.
5. **Evidence-driven outreach purpose**: the Recommendation Center scores which purpose (Sales, Product Demo, Partnership, Sponsorship, Decision-Maker Intro, etc.) is supported by the account's real evidence, recommends one, and lets the user choose. The choice reshapes the generated subject and body.
6. **Human-approved outreach**: approved strategies become a draft (email, LinkedIn message or call script), which is edited, approved and sent. Sending is currently wired through **Gmail only**. Every step is recorded in a queryable audit trail.

A Supervisor/Router layer sits in front of the pipeline. Free-form chat in the Workspace is routed either to the sales-analysis pipeline (for company briefs) or to a general research agent, with live step-by-step progress streamed to the UI over SSE.

---

## Architecture

```
                           ┌─────────────────────┐
User (Workspace chat) ───▶│  Supervisor / Router │
                           └──────────┬───────────┘
                                      │
                  ┌───────────────────┼────────────────────┐
                  ▼                                        ▼
       ┌─────────────────────┐                 ┌───────────────────┐
       │  Sales Analysis      │                 │   Research Agent   │
       │  Pipeline            │                 │  (general Q&A /    │
       │                      │                 │   web lookups)     │
       │  Knowledge Ingestion │                 └───────────────────┘
       │        │             │
       │        ▼             │
       │  Persona Agent       │
       │        │             │
       │        ▼             │
       │  Intent Agent        │
       │        │             │
       │        ▼             │
       │  Strategy Agent      │
       │        │             │
       │        ▼             │
       │  Guardrail Agent ────┼──▶ approved? ──▶ Recommendation Center
       │  (evidence check,    │        │          (purpose selection)
       │   risk scoring)      │        │                │
       └──────────────────────┘        │                ▼
                  │                     │          Outreach Queue ──▶ Gmail
                  ▼                     ▼                (human approval
           Audit Trail (Postgres)   blocked ──▶           required to send)
                                    human review
                                    required
```

Each agent is a focused class that makes its own LLM call, parses a structured JSON response (with safe fallbacks if parsing fails), and saves its output to Postgres against the company/analysis record. The Executive Brief, Audit Trail, Accounts and Recommendation Center screens all read from the same analysis history.

---

## Tech stack

**Backend**
- FastAPI, SQLAlchemy, PostgreSQL (Alembic migrations)
- JWT authentication and Google OAuth login
- Multi-LLM router with adapters for Groq, Gemini, OpenRouter and self-hosted models (vLLM/Ollama)
- Server-Sent Events (`/executor/stream`) for live agent progress
- Tavily for web research
- Gmail integration for sending approved drafts

**Frontend**
- Next.js 15 (App Router) and TypeScript
- Tailwind CSS and Radix-based UI primitives (shadcn/ui style)
- Framer Motion, React Flow (Relationship Graph), Recharts (Accounts dashboards), cmdk (command palette)

---

## Project structure

```
backend/
  app/
    agents/       knowledge_ingestion, persona, intent, strategy, guardrail,
                  research_agent, research_v2, sales_analysis_agent
    api/          auth, knowledge, persona, intent, strategy, guardrail, workspace,
                  queue, audit, supervisor, executor, planner, router, ...
    models/       User, Company, AnalysisResult, OutreachDraft, ConnectedAccount, ...
    pipeline/     prospect_pipeline.py (chains the five core agents)
    supervisor/   plans and routes free-form prompts to the right agent
    main.py
  alembic/        migrations
  requirements.txt

Frontend/
  app/(app)/      workspace, accounts, graph, recommendations, queue, audit, profile
  components/     workspace, recommendations, accounts, audit, queue, graph, ui
  services/       api client plus one service per domain
```

---

## Running it locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Create `backend/.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/prospectiq
JWT_SECRET_KEY=change-me

DEFAULT_PROVIDER=groq
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
TAVILY_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

See `app/core/config.py` for all supported settings.

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Create `Frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Open http://localhost:3000.

---

## Current status

**Built and working**
- Knowledge extraction, persona, intent, strategy and guardrail pipeline
- Supervisor/Router with live SSE streaming
- `ResearchAgentV2` web research with cited source links
- Guardrail evidence checking with risk scoring and outreach blocking
- Recommendation Center with evidence-based purpose selection that reshapes the draft
- Outreach Queue with approve, edit and send via Gmail, gated on human approval
- Google login, Audit Trail backed by real analysis history, Accounts dashboard, Relationship Graph

**Known limitations**
- Outreach sends through Gmail only. LinkedIn and call-script drafts are generated but not sent.
- `accounts.service.ts` contains a demo-only fallback that shows sample data when the backend is unreachable.
- Meeting scheduling exists in the frontend but its backend endpoints are not finished.
- No automated tests yet, and the Guardrail agent has not been formally benchmarked.

**Roadmap (not built)**
- CRM integrations (HubSpot first)
- Additional outreach channels (WhatsApp/Twilio, LinkedIn sending)
- Calendar-based meeting scheduling
- Guardrail evaluation set and accuracy reporting
- Production-scale infrastructure (queueing, workflow orchestration)

---

## Team

Nikita Mishra, Ranjit Bhardwaj, Gaurav Chauhan

## License

Developed for NexBuildOn Hack 2026. All rights reserved © 2026.
