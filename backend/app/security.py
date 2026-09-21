from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import User

ALGO = "HS256"
bearer = HTTPBearer(auto_error=False)


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str | None) -> bool:
    return bool(hashed) and bcrypt.checkpw(pw.encode(), hashed.encode())


def make_token(user_id: int, kind: str, delta: timedelta) -> str:
    exp = datetime.now(timezone.utc) + delta
    return jwt.encode({"sub": str(user_id), "kind": kind, "exp": exp}, settings.secret_key, algorithm=ALGO)


def tokens_for(user: User) -> dict:
    return {
        "access_token": make_token(user.id, "access", timedelta(minutes=settings.access_token_minutes)),
        "refresh_token": make_token(user.id, "refresh", timedelta(days=settings.refresh_token_days)),
        "token_type": "bearer",
    }


def decode(token: str, kind: str) -> int:
    try:
        data = jwt.decode(token, settings.secret_key, algorithms=[ALGO])
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired, please log in again")
    if data.get("kind") != kind:
        raise HTTPException(401, "Invalid token")
    return int(data["sub"])


def current_user(cred: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not cred:
        raise HTTPException(401, "Login required")
    user = db.get(User, decode(cred.credentials, "access"))
    if not user:
        raise HTTPException(401, "User not found")
    return user


def admin_user(user: User = Depends(current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    return user
