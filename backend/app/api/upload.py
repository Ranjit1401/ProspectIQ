from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User

from app.services.assistant_service import AssistantService
from app.services.document_service import DocumentService

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
)

assistant = AssistantService()
document = DocumentService()


@router.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        text = document.process(file)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to parse document: {str(e)}",
        )

    return await assistant.analyze(
        text=text,
        current_user=current_user,
        db=db,
    )