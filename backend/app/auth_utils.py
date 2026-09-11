import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import hashlib
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

try:
    from backend.app.database import get_db
    from backend.app.models import User, UserRole
except ImportError:
    from app.database import get_db
    from app.models import User, UserRole

# Secret key and algorithm for signing JWT tokens
SECRET_KEY = os.getenv("SECRET_KEY", "school_system_secret_key_change_in_production_12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# OAuth2 scheme for retrieving token from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against the stored password hash."""
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except Exception:
        pass
    # Fallback comparison if plain SHA256 was used
    fallback_hash = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
    return fallback_hash == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token containing user claims."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """FastAPI dependency to extract and validate the logged-in user from the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def require_roles(allowed_roles: List[UserRole]):
    """Dependency factory to enforce role-based access control."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{current_user.role.value}' does not have sufficient permissions.",
            )
        return current_user
    return role_checker
