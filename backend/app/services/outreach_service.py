import re

from sqlalchemy.orm import Session

from app.models.analysis_result import AnalysisResult
from app.models.outreach_draft import OutreachDraft
from app.models.company import Company
from app.models.user import User

from app.core.logger import logger


# Matches the bracketed placeholders LLM-generated drafts commonly leave
# in, e.g. "Dear [Name]," or "Best regards, [Your Name]". Grouped so we
# can tell a "who's this email addressed to" placeholder apart from a
# "who's this email signed by" placeholder and fill each correctly.
_RECIPIENT_PLACEHOLDER = re.compile(
    r"\[\s*(?:First\s+)?(?:Name|Recipient(?:\s+Name)?|Contact(?:\s+Name)?)\s*\]",
    re.IGNORECASE,
)
_SENDER_PLACEHOLDER = re.compile(
    r"\[\s*(?:Your|Sender)\s+Name\s*\]",
    re.IGNORECASE,
)

def _display_name_from_username(username: str) -> str:
    """
    Usernames like 'gaurav21' aren't fit to sign an email with. Strips
    trailing digits and title-cases what's left, so 'gaurav21' becomes
    'Gaurav'. Falls back to the raw username if nothing sensible remains.
    """
    if not username:
        return ""

    cleaned = re.sub(r"\d+$", "", username).strip()
    return cleaned.title() if cleaned else username

def _personalize(text: str, recipient_name: str, sender_name: str) -> str:
    """
    Replaces generic bracketed placeholders the LLM leaves in drafts
    with the real stakeholder's first name and the real sending user's
    name, so a draft never goes out literally addressed to "[Name]".
    """
    if not text:
        return text

    recipient_first = (recipient_name or "").strip().split(" ")[0] or "there"
    sender = (sender_name or "").strip() or "The Team"

    text = _RECIPIENT_PLACEHOLDER.sub(recipient_first, text)
    text = _SENDER_PLACEHOLDER.sub(sender, text)

    return text


class OutreachService:
    """
    Turns an approved analysis (persona + strategy + guardrail) into a
    grounded, editable outreach draft that a human reviews before it can
    be marked approved. Nothing here sends anything — this only manages
    the draft's lifecycle in the database.
    """

    def generate_from_analysis(
        self,
        db: Session,
        current_user: User,
        analysis: AnalysisResult,
        purpose_strategy: dict | None = None,
    ) -> OutreachDraft:

        persona = analysis.persona or {}
        strategy = analysis.strategy or {}
        guardrail = analysis.guardrail or {}

        stakeholder_name = persona.get("primary_decision_maker", "") or "Unknown contact"

        next_action = strategy.get("next_best_action", "") or "Follow up"

        subject = (
            strategy.get("email_subject")
            or strategy.get("account_summary", "")
            or f"Following up: {next_action}"
        )
        if len(subject) > 120:
            subject = subject[:117] + "..."

        body = strategy.get("email_body") or next_action
        if isinstance(body, list):
            body = "\n".join(str(item) for item in body)
        if not body:
            body = next_action

        # A purpose the user explicitly selected in the UI (e.g. "Product
        # Demo" vs "Strategic Partnership") re-frames the opening line and
        # subject around that purpose — using only the same real evidence
        # already backing this account, never inventing anything new.
        if purpose_strategy and not purpose_strategy.get("insufficient_evidence"):
            purpose_name = purpose_strategy.get("name")
            purpose_description = purpose_strategy.get("description")
            if purpose_name:
                subject = f"{purpose_strategy.get('purpose_label', purpose_name)}: {subject}"
                if len(subject) > 120:
                    subject = subject[:117] + "..."
            if purpose_description:
                body = f"{purpose_description}\n\n{body}"

        sender_display_name = _display_name_from_username(current_user.username)

        subject = _personalize(str(subject), stakeholder_name, sender_display_name)
        body = _personalize(str(body), stakeholder_name, sender_display_name)

        evidence = guardrail.get("supported_claims", []) or []

        draft = OutreachDraft(
            user_id=current_user.id,
            company_id=analysis.company_id,
            analysis_id=analysis.id,
            stakeholder_name=stakeholder_name,
            channel="email",
            subject=str(subject),
            body=str(body),
            confidence=int(guardrail.get("confidence", 0) or 0),
            reasoning=str(guardrail.get("reasoning", "")),
            evidence=evidence,
            status="pending",
        )

        db.add(draft)
        db.commit()
        db.refresh(draft)

        self._try_auto_enrich_email(db, draft)

        return draft


    def _try_auto_enrich_email(
        self,
        db: Session,
        draft: OutreachDraft,
    ) -> None:
        """
        Best-effort: extract or discover the stakeholder/firm email right
        when the draft is created, checking user-supplied knowledge first,
        then AppConnector (if configured), then official site /contact
        pages and web search. Never blocks or fails draft creation.
        """
        company = (
            db.query(Company)
            .filter(Company.id == draft.company_id)
            .first()
        )
        if not company:
            return

        try:
            import json
            from app.models.knowledge_source import KnowledgeSource
            from app.utils.email_discovery import discover_company_email

            knowledge_text = ""
            sources = []
            analysis = (
                db.query(AnalysisResult)
                .filter(AnalysisResult.id == draft.analysis_id)
                .first()
            )
            if analysis and analysis.knowledge_id:
                ks = (
                    db.query(KnowledgeSource)
                    .filter(KnowledgeSource.id == analysis.knowledge_id)
                    .first()
                )
                if ks:
                    knowledge_dict = (ks.processed_data or {}).get("knowledge", {}) if isinstance(ks.processed_data, dict) else {}
                    sources = knowledge_dict.get("sources") or []
                    knowledge_text = f"{ks.raw_content or ''}\n{json.dumps(ks.processed_data or {})}"
                    if not company.website and knowledge_dict.get("website"):
                        company.website = knowledge_dict.get("website")

            email, domain, is_verified = discover_company_email(
                company_name=company.name or "",
                website=company.website,
                stakeholder_name=draft.stakeholder_name or "",
                knowledge_text=knowledge_text,
                sources=sources,
            )

            if domain and not company.website:
                company.website = f"https://{domain}"

            if email:
                draft.stakeholder_email = email
                draft.email_verified = is_verified
                draft.email_mx_domain = domain
                db.commit()
                db.refresh(draft)
            elif company.website:
                db.commit()

        except Exception as e:
            logger.warning(
                f"Auto email enrichment error for draft {draft.id}: {e}"
            )

    def list_for_user(self, db: Session, user_id: int):
        return (
            db.query(OutreachDraft)
            .filter(OutreachDraft.user_id == user_id)
            .order_by(OutreachDraft.created_at.desc())
            .all()
        )

    def get(self, db: Session, user_id: int, draft_id: int):
        return (
            db.query(OutreachDraft)
            .filter(
                OutreachDraft.id == draft_id,
                OutreachDraft.user_id == user_id,
            )
            .first()
        )

    def set_status(
        self,
        db: Session,
        user_id: int,
        draft_id: int,
        status: str,
    ):
        draft = self.get(db, user_id, draft_id)

        if draft is None:
            return None

        draft.status = status
        db.commit()
        db.refresh(draft)

        return draft

    def update_body(
        self,
        db: Session,
        user_id: int,
        draft_id: int,
        subject: str | None = None,
        body: str | None = None,
    ):
        draft = self.get(db, user_id, draft_id)

        if draft is None:
            return None

        if subject is not None:
            draft.subject = subject

        if body is not None:
            draft.body = body

        draft.status = "edited"

        db.commit()
        db.refresh(draft)

        return draft
    
    def delete(self, db: Session, user_id: int, draft_id: int):
        draft = self.get(db, user_id, draft_id)

        if draft is None:
            return None

        db.delete(draft)
        db.commit()

        return draft_id