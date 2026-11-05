from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token
from app.config import settings
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserResponse, LoginRequest, Token
from app.api.deps import require_current_user
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED, summary="Register new user")
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> Token:
    """Register a new user account (Caregiver, Clinician, or Patient)."""
    existing_user = AuthService.get_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    user = AuthService.create_user(db, user_in)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
        claims={"role": user.role}
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=Token, summary="Authenticate and acquire JWT token")
def login(login_req: LoginRequest, db: Session = Depends(get_db)) -> Token:
    """Authenticate with email and password to receive a JWT access token."""
    user = AuthService.authenticate(db, login_req.email, login_req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
        claims={"role": user.role}
    )
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse, summary="Retrieve current authenticated user profile")
def get_current_user_profile(current_user: User = Depends(require_current_user)) -> UserResponse:
    """Get the details of the currently logged-in user."""
    return UserResponse.model_validate(current_user)

