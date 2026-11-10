from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_\-\. ]+$",
        description="Username must be 3-50 characters with alphanumeric, space, dot, underscore, or dash only."
    )
    email: EmailStr
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password must be between 8 and 128 characters."
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class GoogleLogin(BaseModel):
    token: str = Field(..., min_length=10)


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool

    model_config = ConfigDict(from_attributes=True)