"""
auth.py — Hybrid Unified Authentication (Keycloak SSO + Local Database).

Features:
- Validates local JWT tokens (HS256) first.
- If invalid, attempts Keycloak SSO JWT validation (RS256).
- Unified CurrentUser object for role-based access across all providers.
- Password hashing and utility functions for local auth.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from jose.backends import RSAKey
from passlib.context import CryptContext
import httpx
from functools import lru_cache
from dataclasses import dataclass

from talentstream_core_service.configs.config import settings

# ── Password Hashing ────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ── Data Structures ─────────────────────────────────────────────────────────

VALID_ROLES = {"Admin", "VP", "Program_Mgr", "Project_Mgr", "RMG"}

@dataclass
class CurrentUser:
    id: str
    email: str
    name: str
    role: str

@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """Fetch Keycloak's public signing keys."""
    try:
        with httpx.Client(timeout=3.0) as client:
            response = client.get(settings.keycloak_jwks_url)
            response.raise_for_status()
            return response.json()
    except Exception:
        # Graceful failure for air-gapped or network issues
        return {"keys": []}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Generates a LOCAL JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def _decode_hybrid_token(token: str) -> dict:
    """Hybrid decoder: Local (HS256) -> Keycloak (RS256)."""
    # 1. Try Local JWT
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if "role" in payload: # Identifies a local TalentStream token
            return payload
    except Exception:
        pass

    # 2. Try Keycloak (RS256)
    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise JWTError("No KID in header")

        jwks = _get_jwks()
        key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if not key_data:
            raise JWTError("No matching KID in JWKS")

        public_key = RSAKey(key_data, algorithm="RS256")
        return jwt.decode(token, public_key, algorithms=["RS256"], audience=settings.KEYCLOAK_CLIENT_ID)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired credentials ({str(e)})",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ── Dependency ────────────────────────────────────────────────────────────────

_bearer = HTTPBearer(auto_error=False)

def get_current_user(credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer)]) -> CurrentUser:
    if not settings.AUTH_ENABLED:
        return CurrentUser(id="DEV-ID", email="dev@localhost", name="Dev Expert", role="Admin")

    if not credentials:
        raise HTTPException(status_code=401, detail="Missing auth token")

    payload = _decode_hybrid_token(credentials.credentials)

    # Determine Source
    if "role" in payload: # Local Source
        return CurrentUser(
            id=payload.get("sub", ""),
            email=payload.get("email", ""),
            name=payload.get("name", "Local User"),
            role=payload.get("role", "RMG")
        )
    else: # Keycloak Source
        realm_roles = payload.get("realm_access", {}).get("roles", [])
        user_role = next((r for r in realm_roles if r in VALID_ROLES), "RMG")
        return CurrentUser(
            id=payload.get("sub", ""),
            email=payload.get("email", ""),
            name=payload.get("name", payload.get("preferred_username", "")),
            role=user_role
        )

def require_roles(*roles: str):
    def _check(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if user.role not in roles:
           raise HTTPException(status_code=403, detail=f"Role forbidden. Required: {roles}")
        return user
    return _check
