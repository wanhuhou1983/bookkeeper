from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, records, accounts, categories, channels, banks, stats, ocr

# 创建所有表（开发阶段直接用，生产环境用Alembic）
Base.metadata.create_all(bind=engine)

app = FastAPI(title="记账小程序后端", version="1.0.0")

# CORS — 从环境变量读取允许的来源
_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()] if settings.CORS_ORIGINS else []
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,  # 不再使用 ["*"]，必须显式配置
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(records.router)
app.include_router(accounts.router)
app.include_router(categories.router)
app.include_router(channels.router)
app.include_router(banks.router)
app.include_router(stats.router)
app.include_router(ocr.router)


@app.get("/")
async def root():
    return {"message": "记账小程序API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
