from fastapi import FastAPI
from app.api.health import router as health_router
from app.core.config import settings
from app.core.logger import logger
from app.api.llm import router as llm_router
from app.api.tools import router as tool_router
from app.api.agents import router as agent_router
from app.api.router import router as router_api
from app.api.planner import router as planner_router
from app.api.supervisor import router as supervisor_router
from app.api.memory import router as memory_router
from app.api.executor import router as executor_router
from app.api.auth import router as auth_router
from app.api.knowledge import router as knowledge_router


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Open Source Agentic AI Framework",
)

app.include_router(health_router)
app.include_router(llm_router)
app.include_router(tool_router)
app.include_router(agent_router)
app.include_router(router_api)
app.include_router(planner_router)
app.include_router(supervisor_router)
app.include_router(memory_router)
app.include_router(executor_router)
app.include_router(auth_router)
app.include_router(knowledge_router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to RocketAI 🚀",
        "version": settings.APP_VERSION,
    }


logger.info("RocketAI initialized successfully.")