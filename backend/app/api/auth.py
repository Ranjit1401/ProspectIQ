import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

from urllib.parse import quote_plus, urlparse

import requests as http_requests
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from google.auth.transport import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.config import settings
from app.core.logger import logger
from app.database.session import get_db
from app.models.connected_account import ConnectedAccount
from app.models.oauth_state import OAuthState

from app.models.user import User
from app.schemas.user import (
    GoogleLogin,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.auth_service import AuthService

# Allow Google OAuth to return normalized or previously-granted scopes
# (e.g. "userinfo.profile" when include_granted_scopes=true) without
# oauthlib raising a fatal "Scope has changed" Warning exception.
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

service = AuthService()

# Maps OAuth state -> validated initiating frontend origin so callbacks
# always return to the exact origin (localhost vs 127.0.0.1 vs Vercel)
# where the user's JWT token resides in localStorage.
_oauth_redirect_origins: dict[str, str] = {}


def _resolve_safe_frontend_origin(request: Request) -> str:
    candidate = request.headers.get("origin") or request.headers.get("referer")
    if not candidate:
        return settings.FRONTEND_URL.rstrip("/")

    parsed = urlparse(candidate)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return settings.FRONTEND_URL.rstrip("/")

    origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    allowed = {
        settings.FRONTEND_URL.rstrip("/"),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://prospect-iq-drab.vercel.app",
        "https://prospect-iq-oobr.vercel.app",
        "https://prospect-4zw62ppxf-ranjit-bhardwaj-s-projects.vercel.app",
    }
    if settings.CORS_ORIGINS:
        for extra in settings.CORS_ORIGINS.split(","):
            if extra.strip():
                allowed.add(extra.strip().rstrip("/"))

    return origin if origin in allowed else settings.FRONTEND_URL.rstrip("/")


# ============================================================
# Google OAuth Configuration
# ============================================================

GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.send",
]

OAUTH_STATE_EXPIRY_MINUTES = 10


# ============================================================
# Existing Authentication
# ============================================================


@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    try:
        return service.register(db, user)

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    try:
        return service.login(db, user)

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
        )


@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ============================================================
# PKCE Utilities
# ============================================================


def generate_pkce():
    """
    Generate PKCE code verifier and S256 code challenge.
    """

    code_verifier = secrets.token_urlsafe(64)

    digest = hashlib.sha256(
        code_verifier.encode("ascii")
    ).digest()

    code_challenge = (
        base64.urlsafe_b64encode(digest)
        .decode("ascii")
        .rstrip("=")
    )

    return code_verifier, code_challenge


# ============================================================
# OAuth State Utilities
# ============================================================


def generate_oauth_state() -> str:
    """
    Generate an opaque random OAuth state value.

    The actual user ID and PKCE verifier are stored in the
    database rather than being exposed inside the state value.
    """

    return secrets.token_urlsafe(48)


def create_google_flow(
    code_verifier: str | None = None,
):
    """
    Create Google OAuth Flow.
    """

    client_config = {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [
                settings.GOOGLE_REDIRECT_URI
            ],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_SCOPES,
        code_verifier=code_verifier,
        autogenerate_code_verifier=False,
    )

    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI

    return flow


# ============================================================
# Google Connect
# ============================================================


@router.get("/google/connect")
def google_connect(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start Google OAuth connection for the currently
    authenticated ProspectIQ user.
    """

    try:
        # ----------------------------------------------------
        # 1. Generate PKCE
        # ----------------------------------------------------

        code_verifier, code_challenge = generate_pkce()

        # ----------------------------------------------------
        # 2. Generate opaque state
        # ----------------------------------------------------

        state = generate_oauth_state()

        # Remember initiating frontend origin so callback returns to the exact same origin
        _oauth_redirect_origins[state] = _resolve_safe_frontend_origin(request)

        # ----------------------------------------------------
        # 3. Calculate expiration
        # ----------------------------------------------------

        expires_at = (
            datetime.now(timezone.utc)
            + timedelta(minutes=OAUTH_STATE_EXPIRY_MINUTES)
        )

        # ----------------------------------------------------
        # 4. Store OAuth state + PKCE verifier
        # ----------------------------------------------------

        oauth_state = OAuthState(
            state=state,
            user_id=current_user.id,
            code_verifier=code_verifier,
            expires_at=expires_at,
        )

        db.add(oauth_state)
        db.commit()

        # ----------------------------------------------------
        # 5. Create Google OAuth flow
        # ----------------------------------------------------

        flow = create_google_flow(
            code_verifier=code_verifier
        )

        # ----------------------------------------------------
        # 6. Generate Google authorization URL
        # ----------------------------------------------------

        authorization_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=state,
            code_challenge=code_challenge,
            code_challenge_method="S256",
        )

        return {
            "authorization_url": authorization_url,
        }

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to start Google OAuth: {str(e)}",
        )


# ============================================================
# Google Callback
# ============================================================


@router.get("/google/callback")
def google_callback(
    state: str,
    code: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    """
    Google OAuth callback.

    Flow:

    Google
       ↓
    state validation
       ↓
    retrieve PKCE verifier
       ↓
    exchange authorization code
       ↓
    verify Google identity
       ↓
    create/update ConnectedAccount
    """

    frontend_url = _oauth_redirect_origins.pop(state, settings.FRONTEND_URL.rstrip("/"))

    try:
        if error:
            raise HTTPException(
                status_code=400,
                detail=f"Google authorization cancelled or denied ({error}).",
            )

        if not code:
            raise HTTPException(
                status_code=400,
                detail="Missing authorization code from Google.",
            )

        # ====================================================
        # 1. Retrieve OAuth state
        # ====================================================

        oauth_state = (
            db.query(OAuthState)
            .filter(
                OAuthState.state == state
            )
            .first()
        )

        if not oauth_state:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OAuth state",
            )

        # ====================================================
        # 2. Check expiration
        # ====================================================

        now = datetime.now(timezone.utc)

        expires_at = oauth_state.expires_at

        # Handle databases returning naive datetime
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(
                tzinfo=timezone.utc
            )

        if now > expires_at:

            db.delete(oauth_state)
            db.commit()

            raise HTTPException(
                status_code=400,
                detail="OAuth state expired. Please reconnect Google.",
            )

        # ====================================================
        # 3. Retrieve ProspectIQ user
        # ====================================================

        prospectiq_user_id = oauth_state.user_id

        user = (
            db.query(User)
            .filter(
                User.id == prospectiq_user_id
            )
            .first()
        )

        if not user:

            db.delete(oauth_state)
            db.commit()

            raise HTTPException(
                status_code=404,
                detail="ProspectIQ user not found",
            )

        # ====================================================
        # 4. Retrieve PKCE verifier
        # ====================================================

        code_verifier = oauth_state.code_verifier

        if not code_verifier:

            db.delete(oauth_state)
            db.commit()

            raise HTTPException(
                status_code=400,
                detail=(
                    "PKCE verifier not found. "
                    "Please restart Google connection."
                ),
            )

        # ====================================================
        # 5. Delete OAuth state immediately
        #
        # This prevents replay attacks.
        # ====================================================

        db.delete(oauth_state)
        db.commit()

        # ====================================================
        # 6. Create OAuth flow
        # ====================================================

        os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
        flow = create_google_flow(
            code_verifier=code_verifier
        )

        # ====================================================
        # 7. Exchange authorization code
        # ====================================================

        flow.fetch_token(
            code=code
        )

        credentials = flow.credentials

        # ====================================================
        # 8. Verify Google ID token (with userinfo fallback)
        # ====================================================

        google_email: str | None = None
        email_verified: bool = False
        google_subject: str | None = None

        if credentials.id_token:
            request = requests.Request()

            id_info = id_token.verify_oauth2_token(
                credentials.id_token,
                request,
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=60,
            )

            issuer = id_info.get("iss")
            if issuer not in [
                "accounts.google.com",
                "https://accounts.google.com",
            ]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid Google token issuer",
                )

            google_email = id_info.get("email")
            email_verified = id_info.get("email_verified") is True
            google_subject = id_info.get("sub")
        else:
            # Fallback to Google userinfo endpoint when id_token is omitted
            userinfo_resp = http_requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {credentials.token}"},
                timeout=10,
            )
            if not userinfo_resp.ok:
                raise HTTPException(
                    status_code=400,
                    detail="Google did not return an ID token or user profile.",
                )
            userinfo = userinfo_resp.json()
            google_email = userinfo.get("email")
            email_verified = userinfo.get("email_verified") is True
            google_subject = userinfo.get("sub")

        if not google_email:
            raise HTTPException(
                status_code=400,
                detail="Google account email not found",
            )

        if not email_verified:
            raise HTTPException(
                status_code=400,
                detail="Google email is not verified",
            )

        if not google_subject:
            raise HTTPException(
                status_code=400,
                detail="Google account ID not found",
            )

        # ====================================================
        # 9. Find existing Google connection
        # ====================================================

        account = (
            db.query(ConnectedAccount)
            .filter(
                ConnectedAccount.user_id
                == prospectiq_user_id,
                ConnectedAccount.provider
                == "google",
            )
            .first()
        )

        # ====================================================
        # 10. Update existing account or create new account
        # ====================================================

        if account:

            account.email = google_email
            account.access_token = credentials.token

            # Google may NOT return a refresh token
            # during subsequent authorizations.
            if credentials.refresh_token:
                account.refresh_token = credentials.refresh_token

            account.token_expiry = credentials.expiry

            if hasattr(account, "provider_account_id"):
                account.provider_account_id = google_subject

            account.updated_at = datetime.utcnow()

        else:

            if not credentials.refresh_token:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Google did not return a refresh token. "
                        "Please revoke ProspectIQ access in your Google Account "
                        "permissions (myaccount.google.com/permissions) and connect again."
                    ),
                )

            account = ConnectedAccount(
                user_id=prospectiq_user_id,
                provider="google",
                email=google_email,
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                token_expiry=credentials.expiry,
            )

            if hasattr(account, "provider_account_id"):
                account.provider_account_id = google_subject

            db.add(account)

        # ====================================================
        # 11. Save account
        # ====================================================

        db.commit()
        db.refresh(account)

        # ====================================================
        # 12. Success — redirect back into the frontend app
        # ====================================================

        return RedirectResponse(
            url=f"{frontend_url}/queue?gmail_connected=true"
        )

    except HTTPException as e:
        safe_detail = quote_plus(str(e.detail))
        return RedirectResponse(
            url=(
                f"{frontend_url}/queue"
                f"?gmail_error={safe_detail}"
            )
        )

    except Exception as e:

        db.rollback()
        logger.error(f"Google OAuth callback error: {e}", exc_info=True)
        safe_err = quote_plus(str(e) or "connection_failed")

        return RedirectResponse(
            url=(
                f"{frontend_url}/queue"
                f"?gmail_error={safe_err}"
            )
        )

# ============================================================
# Gmail Status
# ============================================================


@router.get("/google/status")
def google_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check whether the current ProspectIQ user
    has connected a Google account.
    """

    account = (
        db.query(ConnectedAccount)
        .filter(
            ConnectedAccount.user_id
            == current_user.id,
            ConnectedAccount.provider
            == "google",
        )
        .first()
    )

    if not account:
        return {
            "connected": False,
            "email": None,
        }

    return {
        "connected": True,
        "email": account.email,
    }


# ============================================================
# Gmail Disconnect
# ============================================================


@router.post("/google/disconnect")
def google_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Disconnect Google/Gmail account from ProspectIQ.
    """

    account = (
        db.query(ConnectedAccount)
        .filter(
            ConnectedAccount.user_id
            == current_user.id,
            ConnectedAccount.provider
            == "google",
        )
        .first()
    )

    if account is None:
        return {
            "connected": False,
            "email": None,
        }

    db.delete(account)
    db.commit()

    return {
        "connected": False,
        "email": None,
    }


# ============================================================
# Existing Google Login
# ============================================================


@router.post("/google-auth")
def google_auth(
    user: GoogleLogin,
    db: Session = Depends(get_db),
):
    """
    Existing Google authentication endpoint.

    This is kept separate from /google/connect because
    /google-auth is for ProspectIQ login while
    /google/connect is for connecting Gmail.
    """
    try:
        return service.google_login(
            db,
            user,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )