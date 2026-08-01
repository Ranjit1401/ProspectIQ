from app.executor.engine import ExecutionEngine


class ExecutionService:

    def __init__(self):
        self.engine = ExecutionEngine()

    async def execute(self, task: str):
        return await self.engine.execute(task)