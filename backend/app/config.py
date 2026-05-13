import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bookkeeper")
    SECRET_KEY: str = os.getenv("SECRET_KEY")  # 必须通过环境变量设置，否则启动报错
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
    WX_APPID: str = os.getenv("WX_APPID", "")
    WX_SECRET: str = os.getenv("WX_SECRET", "")
    MINERU_API_KEY: str = os.getenv("MINERU_API_KEY", "")
    MINERU_API_URL: str = os.getenv("MINERU_API_URL", "https://api.mineru.com")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")  # 逗号分隔的允许来源

    def __init__(self):
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY 环境变量未设置，JWT 签名密钥是必须的")


settings = Settings()
