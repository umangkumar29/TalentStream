from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from talentstream_core_service.db.database import get_db
from talentstream_core_service.db.models import User, UserRole
from talentstream_core_service.auth.auth import verify_password, create_access_token, hash_password, get_current_user, require_roles, CurrentUser
from talentstream_core_service.repositories.user_repository import UserRepository

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr
    name: str
    role: UserRole = UserRole.RMG

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login_local(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db: Annotated[Session, Depends(get_db)]
):
    """Local Login (Username/Password)"""
    repo = UserRepository(db)
    user = repo.get_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role, "name": user.name}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "role": user.role, "name": user.name}
    }

@router.post("/register", status_code=201, responses={400: {"description": "Username or email already exists"}})
def register_local(
    user_in: UserCreate, 
    db: Annotated[Session, Depends(get_db)]
):
    """Local User Registration"""
    repo = UserRepository(db)
    existing_user = repo.get_by_username_or_email(user_in.username, user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        name=user_in.name,
        role=user_in.role,
        hashed_password=hash_password(user_in.password)
    )
    repo.create(new_user)
@router.get("/admin/users", response_model=list[dict], summary="Admin: List all users")
def list_users_admin(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin")),
):
    """List all registered personnel (RBAC)"""
    repo = UserRepository(db)
    users = repo.get_all()
    return [
        {
            "id": str(u.id), 
            "email": u.email, 
            "role": u.role, 
            "name": u.name, 
            "username": u.username,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.post("/admin/users", status_code=201, summary="Admin: Create a user")
def create_user_admin(
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin")),
):
    """Admin User Creation"""
    repo = UserRepository(db)
    existing_user = repo.get_by_username_or_email(user_in.username, user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        name=user_in.name,
        role=user_in.role,
        hashed_password=hash_password(user_in.password)
    )
    repo.create(new_user)
    return {"status": "success", "user_id": str(new_user.id)}

@router.patch("/admin/users/{user_id}", summary="Admin: Update a user")
def update_user(
    user_id: str,
    userData: dict,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin")),
):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in userData.items():
        if key == "password" and value:
            user.hashed_password = hash_password(value)
        elif hasattr(user, key):
            setattr(user, key, value)
            
    repo.update(user)
    return {"status": "success", "message": "User updated successfully"}

@router.delete("/admin/users/{user_id}", summary="Admin: Delete a user")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_roles("Admin")),
):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    repo.delete(user)
    return {"status": "success", "message": "User deleted successfully"}
