from app.planner.planner import Planner
from app.router.router import Router
from app.core.context import context


class Supervisor:
    """
    Orchestrates the execution of a user task.
    """

    def __init__(self):
        self.router = Router()
        self.planner = Planner()

    async def execute(self, task: str):

        context.memory.add("user", task)
    
        plan = await self.planner.create_plan(task)
    
        agent = await self.router.route(task)
    
        result = await agent.run(task)
    
        response = result["response"]
    
        if hasattr(response, "content"):
            memory_text = response.content
        else:
            memory_text = str(response)
    
        context.memory.add(
            "assistant",
            memory_text,
        )
    
        return {
            "task": task,
            "plan": plan,
            "agent": agent.name,
            "result": result,
            "memory": context.memory.get_history(),
        }