from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.token import Token
from app.utils.email import send_email

router = APIRouter()

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 compatible token login, get an access token for future requests"""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(user.id, expires_delta=access_token_expires)
    
    refresh_token = security.create_refresh_token(user.id)
    
    response = Response()
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True, # Should be true in production, assuming standard dev matching
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 
    )
    
    background_tasks.add_task(
        send_email,
        user.email,
        "New Login Alert – LifeOS",
        f"Hello,\n\nA new login was just detected on your LifeOS account ({user.email}).\nIf this was you, no further action is needed.\n\nStay disciplined,\nLifeOS Team"
    )
    
    # We still return the access token in JSON body per OAuth2 spec for immediate use
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

class GoogleAuthRequest(BaseModel):
    id_token: str

@router.post("/google", response_model=Token)
async def login_google(
    request_data: GoogleAuthRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    try:
        # Note: if GOOGLE_CLIENT_ID is empty, it will not strictly enforce the audience
        id_info = id_token.verify_oauth2_token(
            request_data.id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID or None
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

    email = id_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google token missing email")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # Create a new user with a dummy secure password hash, since they use Google
        dummy_hash = security.get_password_hash(str(uuid.uuid4()))
        user = User(
            email=email,
            password_hash=dummy_hash,
            role="user"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(user.id, expires_delta=access_token_expires)
    
    refresh_token = security.create_refresh_token(user.id)
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60 
    )

    background_tasks.add_task(
        send_email,
        user.email,
        "New Login Alert – LifeOS",
        f"Hello,\n\nA new login via Google was just detected on your LifeOS account ({user.email}).\nIf this was you, no further action is needed.\n\nStay disciplined,\nLifeOS Team"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.post("/refresh", response_model=Token)
async def refresh_access_token(
    request: Request,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """Issue a new access token via the HTTPOnly refresh cookie"""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    try:
        from jose import jwt, JWTError
        payload = jwt.decode(refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        token_data = payload.get("sub")
        is_refresh = payload.get("refresh")
        
        if not token_data or not is_refresh:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
            
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == token_data))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = security.create_access_token(user.id, expires_delta=access_token_expires)

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(response: Response) -> Any:
    """Clear the HTTPOnly refresh cookie"""
    response.delete_cookie(
        key="refresh_token",
        secure=True,
        httponly=True,
        samesite="lax"
    )
    return {"msg": "Successfully logged out"}
