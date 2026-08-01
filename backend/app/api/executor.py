from fastapi import APIRouter

from app.executor.service import ExecutionService
from fastapi import Depends

from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/executor",
    tags=["Execution"],
)

service = ExecutionService()


@router.get("/run")
async def run(
    prompt: str,
    current_user: User = Depends(get_current_user),
):
    return await service.execute(prompt)