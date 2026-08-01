from sqlalchemy.orm import Session

from app.models.analysis_result import AnalysisResult


class AnalysisService:

    def save(
        self,
        db: Session,
        user_id: int,
        knowledge_id: int,
        persona: dict,
        intent: dict,
        strategy: dict,
        guardrail: dict,
        timeline: list,
        execution: dict,
    ):

        result = AnalysisResult(
            user_id=user_id,
            knowledge_id=knowledge_id,
            persona=persona,
            intent=intent,
            strategy=strategy,
            guardrail=guardrail,
            timeline=timeline,
            execution=execution,
        )

        db.add(result)
        db.commit()
        db.refresh(result)

        return result