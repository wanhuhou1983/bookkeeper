from pydantic import BaseModel


class WxLoginRequest(BaseModel):
    code: str


class LoginResponse(BaseModel):
    token: str
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    openid: str
    nickname: str | None = None
    avatar_url: str | None = None

    model_config = {"from_attributes": True}
