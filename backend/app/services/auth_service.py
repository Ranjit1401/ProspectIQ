import secrets
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from google.oauth2 import id_token
from google.auth.transport import requests
from app.schemas.user import GoogleLogin


class AuthService:

    def register(
        self,
        db: Session,
        user: UserCreate,
    ):

        existing_email = db.query(User).filter(User.email == user.email).first()

        if existing_email:
            raise ValueError("Email already exists")

        existing_username = (
            db.query(User).filter(User.username == user.username).first()
        )

        if existing_username:
            raise ValueError("Username already exists")

        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hash_password(user.password),
        )

        db.add(new_user)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise ValueError("Username or email already exists")

        db.refresh(new_user)

        return new_user

    def login(
        self,
        db: Session,
        credentials: UserLogin,
    ):

        user = db.query(User).filter(User.email == credentials.email).first()

        if not user:
            raise ValueError("Invalid credentials")

        if user.hashed_password == "google_auth_user":
            raise ValueError(
                "This account was registered using Google Sign-In. Please sign in with Google."
            )

        if not verify_password(
            credentials.password,
            user.hashed_password,
        ):
            raise ValueError("Invalid credentials")

        if not user.is_active:
            raise ValueError("Account has been deactivated. Please contact support.")

        token = create_access_token(
            {
                "sub": user.email,
                "user_id": user.id,
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
        }

    def google_login(
        self,
        db: Session,
        credentials: GoogleLogin,
    ):
        try:
            req = requests.Request()
            audience = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
            idinfo = id_token.verify_oauth2_token(
                credentials.token,
                req,
                audience=audience,
                clock_skew_in_seconds=60,
            )
        except Exception as e:
            raise ValueError(f"Google authentication failed: {str(e)}")

        email = idinfo.get("email")
        if not email:
            raise ValueError("Google token did not contain an email address")

        email_verified = idinfo.get("email_verified", False)
        if not email_verified:
            raise ValueError("Google account email is not verified")

        name = idinfo.get(
            "name",
            email.split("@")[0],
        )

        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Prevent username collisions with existing users
            chosen_username = name
            existing_with_username = db.query(User).filter(User.username == chosen_username).first()
            if existing_with_username:
                chosen_username = f"{name}_{secrets.token_hex(3)}"

            user = User(
                username=chosen_username,
                email=email,
                hashed_password="google_auth_user",
            )

            db.add(user)
            try:
                db.commit()
                db.refresh(user)
            except IntegrityError:
                db.rollback()
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    raise ValueError("Failed to create Google user account")

        if not user.is_active:
            raise ValueError("User account is inactive")

        token = create_access_token(
            {
                "sub": user.email,
                "user_id": user.id,
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
        }
