import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/bookkeeper")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
    WX_APPID: str = os.getenv("WX_APPID", "")
    WX_SECRET: str = os.getenv("WX_SECRET", "")
    MINERU_API_KEY: str = os.getenv("MINERU_API_KEY", "")
    MINERU_API_URL: str = os.getenv("MINERU_API_URL", "https://api.mineru.com")


settings = Settings()
