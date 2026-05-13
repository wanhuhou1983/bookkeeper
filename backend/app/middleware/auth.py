from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class AuthMiddleware(BaseHTTPMiddleware):
    """JWT认证中间件 - 排除登录接口"""

    EXCLUDE_PATHS = ["/api/v1/auth/login", "/docs", "/openapi.json", "/redoc"]

    async def dispatch(self, request: Request, call_next):
        if any(request.url.path.startswith(p) for p in self.EXCLUDE_PATHS):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            # 让依赖注入去处理，这里不做阻断
            pass

        return await call_next(request)
