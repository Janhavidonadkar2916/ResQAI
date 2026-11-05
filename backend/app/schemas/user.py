from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


UserRole = Literal["ADMIN", "CAREGIVER", "PATIENT", "CLINICIAN"]


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = "CAREGIVER"


class UserCreate(UserBase):
    password: str = Field(min_length=8, description="User password (min 8 characters)")


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    sub: str
    exp: int
    role: Optional[str] = None
