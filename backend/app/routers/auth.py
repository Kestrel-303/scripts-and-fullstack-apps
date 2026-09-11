import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

try:
    from backend.app.database import get_db
    from backend.app.models import User
    from backend.app.auth_utils import verify_password, create_access_token
except ImportError:
    from app.database import get_db
    from app.models import User
    from app.auth_utils import verify_password, create_access_token

router = APIRouter(tags=["Authentication"])


# Pydantic schema for API response documentation
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    full_name: str


# Login endpoint (POST /token)
@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Simple JWT login endpoint (POST /token).
    Validates user credentials against stored bcrypt password hashes and returns a signed JWT token containing user_id and role.
    Supports both JSON payloads ({'username': ..., 'password': ...}) and form-urlencoded requests.
    """
    username = None
    password = None

    # Step 1: Parse request based on Content-Type
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        body = await request.json()
        username = body.get("username")
        password = body.get("password")
    else:
        # Fallback to form data for standard OAuth2 form requests
        form_data = await request.form()
        username = form_data.get("username")
        password = form_data.get("password")

    # Step 2: Validate presence of credentials
    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password must be provided.",
        )

    # Step 3: Query user from database by username
    user = db.query(User).filter(User.username == username).first()

    # Step 4: Check if user exists and verify password hash
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 5: Create JWT token containing user_id and role in payload
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "role": user.role.value,
        }
    )

    # Step 6: Return token response
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role.value,
        "full_name": user.full_name,
    }
