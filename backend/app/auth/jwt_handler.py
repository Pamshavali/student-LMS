from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from jwt import PyJWTError
from app.config import settings
from app.common.exceptions import UnauthorizedException


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JSON Web Token containing claims:
    - sub (user_id as string)
    - user_id
    - email
    - role
    - exp (expiration timestamp)
    - iat (issued at timestamp)
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "sub": str(data.get("user_id")),
    })
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and cryptographically verifies the JWT.
    Raises UnauthorizedException on invalid or expired token.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException("Access token has expired. Please log in again.")
    except (PyJWTError, Exception):
        raise UnauthorizedException("Invalid authentication credentials.")
