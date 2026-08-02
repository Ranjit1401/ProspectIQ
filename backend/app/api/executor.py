from fastapi import APIRouter

from app.executor.service import ExecutionService
from fastapi import Depends

from app.auth.dependencies import get_current_user
from app.models.user import User

from sqlalchemy.orm import Session
from app.database.session import get_db
router = APIRouter(
    prefix="/executor",
    tags=["Execution"],
)

service = ExecutionService()


@router.get("/run")
async def run(
    prompt: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await service.execute(
        task=prompt,
        current_user=current_user,
        db=db,
    )