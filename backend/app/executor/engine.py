from app.executor.timeline import ExecutionTimeline
from app.supervisor.supervisor import Supervisor


class ExecutionEngine:
    """
    Executes a complete ProspectIQ workflow.
    """

    def __init__(self):
        self.supervisor = Supervisor()

    async def execute(
        self,
        task: str,
        current_user,
        db,
    ):

        timeline = ExecutionTimeline()

        timeline.add_event("Request received")

        timeline.add_event("Calling Supervisor")

        result = await self.supervisor.execute(
            task=task,
            current_user=current_user,
            db=db,
        )

        timeline.add_event("Supervisor completed")

        timeline.add_event("Execution finished")

        return {
            "timeline": timeline.get_events(),
            "result": result,
        }
