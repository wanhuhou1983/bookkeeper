from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session
import httpx

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.models.user import User as UserModel
from app.schemas.auth import WxLoginRequest, LoginResponse, UserOut
from app.services.seed import seed_default_data

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def create_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


@router.post("/login", response_model=LoginResponse)
async def wx_login(body: WxLoginRequest, db: Session = Depends(get_db)):
    """微信小程序登录：code换openid，自动注册"""
    # 调用微信code2Session获取openid
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.weixin.qq.com/sns/jscode2session",
            params={
                "appid": settings.WX_APPID,
                "secret": settings.WX_SECRET,
                "js_code": body.code,
                "grant_type": "authorization_code",
            },
        )
    data = resp.json()
    openid = data.get("openid")
    if not openid:
        raise HTTPException(status_code=400, detail=f"微信登录失败: {data.get('errmsg', 'unknown error')}")

    # 查找或创建用户
    user = db.query(UserModel).filter(UserModel.openid == openid).first()
    if not user:
        user = UserModel(openid=openid)
        db.add(user)
        db.commit()
        db.refresh(user)
        # 新用户自动种子数据
        seed_default_data(db, user.id)
    else:
        user.updated_at = datetime.now(timezone.utc)
        db.commit()

    token = create_token(user.id)
    return LoginResponse(
        token=token,
        user=UserOut.model_validate(user),
    )


@router.get("/profile", response_model=UserOut)
async def get_profile(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)
