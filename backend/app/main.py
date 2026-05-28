from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.routers import auth, records, accounts, categories, channels, banks, stats, ocr

# 创建所有表（开发阶段直接用，生产环境用Alembic）
Base.metadata.create_all(bind=engine)

app = FastAPI(title="记账小程序后端", version="1.0.0")

# CORS — 开发环境允许所有来源
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

# Web 管理界面 & PWA
_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@app.get("/", response_class=HTMLResponse)
async def root():
    html_path = _STATIC_DIR / "index.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>记账小程序 API</h1><p>静态页面未找到</p>")


@app.get("/manifest.json")
async def manifest():
    p = _STATIC_DIR / "manifest.json"
    if p.exists():
        return FileResponse(str(p), media_type="application/json")
    return {"error": "not found"}


@app.get("/sw.js")
async def service_worker():
    p = _STATIC_DIR / "sw.js"
    if p.exists():
        return FileResponse(str(p), media_type="application/javascript")
    return {"error": "not found"}


@app.get("/icon-{size}.png")
async def icon(size: int):
    p = _STATIC_DIR / f"icon-{size}.png"
    if p.exists():
        return FileResponse(str(p), media_type="image/png")
    return {"error": "not found"}


if _STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")


@app.get("/health")
async def health():
    return {"status": "ok"}
