from fastapi import APIRouter

from app.supervisor.service import SupervisorService
from fastapi import Depends

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/supervisor",
    tags=["Supervisor"],
)

service = SupervisorService()


@router.get("/execute")
async def execute(
    prompt: str,
    current_user: User = Depends(get_current_user)
):
    return await service.execute(prompt)