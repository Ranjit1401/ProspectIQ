from sqlalchemy.orm import Session

from app.auth.jwt import create_access_token
from app.auth.password import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin


class AuthService:

    def register(
        self,
        db: Session,
        user: UserCreate,
    ):

        existing = (
            db.query(User)
            .filter(User.email == user.email)
            .first()
        )

        if existing:
            raise ValueError("Email already exists")

        new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hash_password(user.password),
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user

    def login(
        self,
        db: Session,
        credentials: UserLogin,
    ):

        user = (
            db.query(User)
            .filter(User.email == credentials.email)
            .first()
        )

        if not user:
            raise ValueError("Invalid credentials")

        if not verify_password(
            credentials.password,
            user.hashed_password,
        ):
            raise ValueError("Invalid credentials")

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