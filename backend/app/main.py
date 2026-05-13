from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, records, accounts, categories, channels, banks, stats, ocr

# 创建所有表（开发阶段直接用，生产环境用Alembic）
Base.metadata.create_all(bind=engine)

app = FastAPI(title="记账小程序后端", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
