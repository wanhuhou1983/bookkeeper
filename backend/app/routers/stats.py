from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Record
from app.models.saved_search import SavedSearch
from app.models.composite_stat import CompositeStat, CompositeStatItem
from app.models.account import Account
from app.models.category import Category
from app.schemas.stats import (
    StatsQueryRequest, StatsResult, StatsOverview,
    SavedSearchCreate, SavedSearchUpdate, SavedSearchOut,
    CompositeStatCreate, CompositeStatUpdate, CompositeStatOut, CompositeItemOut,
)

router = APIRouter(prefix="/api/v1", tags=["stats"])


def _apply_filters(query, filters, user_id: int):
    q = query.filter(Record.user_id == user_id)
    f = filters
    if f.get("type") is not None:
        q = q.filter(Record.type == f["type"])
    if f.get("date_from"):
        q = q.filter(Record.record_date >= f["date_from"])
    if f.get("date_to"):
        q = q.filter(Record.record_date <= f["date_to"])
    if f.get("account_ids"):
        q = q.filter(Record.account_id.in_(f["account_ids"]))
    if f.get("category_ids"):
        q = q.filter(Record.category_id.in_(f["category_ids"]))
    if f.get("channel_ids"):
        q = q.filter(Record.channel_id.in_(f["channel_ids"]))
    if f.get("bank_ids"):
        q = q.filter(Record.bank_id.in_(f["bank_ids"]))
    return q


def _calc_filters(db: Session, user_id: int, filters: dict) -> Decimal:
    q = _apply_filters(db.query(func.coalesce(func.sum(Record.amount), 0)), filters, user_id)
    return q.scalar()


# ===== 实时统计查询 =====

@router.post("/stats/query", response_model=StatsResult)
async def query_stats(body: StatsQueryRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    filters = body.filters.model_dump()
    total = _calc_filters(db, user.id, filters)
    count_q = _apply_filters(db.query(func.count(Record.id)), filters, user.id)
    count = count_q.scalar()
    return StatsResult(total=total, count=count)


# ===== 统计概览 =====

@router.get("/stats/overview", response_model=StatsOverview)
async def stats_overview(
    month: str = Query(..., regex=r"^\d{4}-\d{2}$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    date_from = f"{month}-01"
    import calendar
    year, m = month.split("-")
    last_day = calendar.monthrange(int(year), int(m))[1]
    date_to = f"{month}-{last_day:02d}"

    expense_q = db.query(func.coalesce(func.sum(Record.amount), 0)).filter(
        Record.user_id == user.id, Record.type == 1,
        Record.record_date >= date_from, Record.record_date <= date_to,
    )
    income_q = db.query(func.coalesce(func.sum(Record.amount), 0)).filter(
        Record.user_id == user.id, Record.type == 2,
        Record.record_date >= date_from, Record.record_date <= date_to,
    )
    month_expense = expense_q.scalar()
    month_income = income_q.scalar()

    # 最近10条记录（joinedload 避免 N+1 查询）
    recent = db.query(Record).options(
        joinedload(Record.account), joinedload(Record.category),
    ).filter(Record.user_id == user.id).order_by(
        Record.record_date.desc(), Record.created_at.desc()
    ).limit(10).all()
    recent_records = []
    for r in recent:
        recent_records.append({
            "id": r.id, "type": r.type, "amount": float(r.amount),
            "record_date": str(r.record_date), "note": r.note,
            "account_name": r.account.name if r.account else None,
            "category_name": r.category.name if r.category else None,
        })

    # 按类目汇总
    by_cat = db.query(
        Category.name, func.coalesce(func.sum(Record.amount), 0), Record.type,
    ).join(Category, Record.category_id == Category.id).filter(
        Record.user_id == user.id,
        Record.record_date >= date_from, Record.record_date <= date_to,
    ).group_by(Category.name, Record.type).all()
    by_category = [{"name": name, "amount": float(amt), "type": t} for name, amt, t in by_cat]

    # 按账本汇总（合并支出/收入到同一条目）
    by_acc_raw = db.query(
        Account.id, Account.name, Record.type,
        func.coalesce(func.sum(Record.amount), 0).label("total"),
        func.count(Record.id).label("cnt"),
    ).join(Account, Record.account_id == Account.id).filter(
        Record.user_id == user.id,
        Record.record_date >= date_from, Record.record_date <= date_to,
    ).group_by(Account.id, Account.name, Record.type).all()

    account_map = {}
    for acc_id, acc_name, rec_type, total, cnt in by_acc_raw:
        if acc_id not in account_map:
            account_map[acc_id] = {"id": acc_id, "name": acc_name, "expense": 0, "income": 0, "count": 0}
        account_map[acc_id]["count"] += cnt
        if rec_type == 1:
            account_map[acc_id]["expense"] = -float(total)
        else:
            account_map[acc_id]["income"] = float(total)
    by_account = list(account_map.values())

    return StatsOverview(
        month_expense=month_expense, month_income=month_income,
        month_balance=month_income - month_expense,
        recent_records=recent_records, by_category=by_category, by_account=by_account,
    )


# ===== 保存的统计项 =====

@router.get("/saved-searches", response_model=list[SavedSearchOut])
async def list_saved_searches(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SavedSearch).filter(SavedSearch.user_id == user.id).order_by(SavedSearch.created_at.desc()).all()


@router.post("/saved-searches", response_model=SavedSearchOut)
async def create_saved_search(body: SavedSearchCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    filters = body.filters.model_dump()
    result = _calc_filters(db, user.id, filters)
    item = SavedSearch(user_id=user.id, name=body.name, filters=filters, result_cache=result, cached_at=datetime.now(timezone.utc))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/saved-searches/{item_id}", response_model=SavedSearchOut)
async def update_saved_search(item_id: int, body: SavedSearchUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(SavedSearch).filter(SavedSearch.id == item_id, SavedSearch.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    if body.name:
        item.name = body.name
    if body.filters:
        item.filters = body.filters.model_dump()
        item.result_cache = _calc_filters(db, user.id, item.filters)
        item.cached_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/saved-searches/{item_id}")
async def delete_saved_search(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(SavedSearch).filter(SavedSearch.id == item_id, SavedSearch.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    db.delete(item)
    db.commit()
    return {"detail": "删除成功"}


@router.post("/saved-searches/{item_id}/refresh", response_model=SavedSearchOut)
async def refresh_saved_search(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(SavedSearch).filter(SavedSearch.id == item_id, SavedSearch.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    item.result_cache = _calc_filters(db, user.id, item.filters)
    item.cached_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item


# ===== 复合统计 =====

@router.get("/composite-stats", response_model=list[CompositeStatOut])
async def list_composite_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stats = db.query(CompositeStat).filter(CompositeStat.user_id == user.id).order_by(CompositeStat.created_at.desc()).all()
    result = []
    for s in stats:
        items_out = []
        for it in s.items:
            items_out.append(CompositeItemOut(
                id=it.id, search_id=it.search_id, operator=it.operator,
                sort_order=it.sort_order, search_name=it.saved_search.name if it.saved_search else None,
            ))
        result.append(CompositeStatOut(
            id=s.id, user_id=s.user_id, name=s.name, expression=s.expression,
            result_cache=s.result_cache, cached_at=s.cached_at, items=items_out,
        ))
    return result


@router.post("/composite-stats", response_model=CompositeStatOut)
async def create_composite_stat(body: CompositeStatCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 构建表达式
    expr_parts = []
    for i, item in enumerate(body.items):
        op = item.operator if i > 0 else ""
        expr_parts.append(f"{op}{item.search_id}")
    expression = "".join(expr_parts) if expr_parts else "0"

    stat = CompositeStat(user_id=user.id, name=body.name, expression=expression)
    db.add(stat)
    db.commit()
    db.refresh(stat)

    for i, item in enumerate(body.items):
        ci = CompositeStatItem(composite_id=stat.id, search_id=item.search_id, operator=item.operator, sort_order=i)
        db.add(ci)
    db.commit()

    # 计算结果
    result = _calc_composite(db, stat)
    stat.result_cache = result
    stat.cached_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(stat)

    return await _composite_to_out(stat, db)


@router.delete("/composite-stats/{stat_id}")
async def delete_composite_stat(stat_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stat = db.query(CompositeStat).filter(CompositeStat.id == stat_id, CompositeStat.user_id == user.id).first()
    if not stat:
        raise HTTPException(status_code=404, detail="不存在")
    db.delete(stat)
    db.commit()
    return {"detail": "删除成功"}


@router.post("/composite-stats/{stat_id}/refresh", response_model=CompositeStatOut)
async def refresh_composite_stat(stat_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stat = db.query(CompositeStat).filter(CompositeStat.id == stat_id, CompositeStat.user_id == user.id).first()
    if not stat:
        raise HTTPException(status_code=404, detail="不存在")
    stat.result_cache = _calc_composite(db, stat)
    stat.cached_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(stat)
    return await _composite_to_out(stat, db)


@router.post("/composite-stats/preview")
async def preview_composite(body: CompositeStatCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """预览复合统计结果，不保存"""
    # 临时计算
    total = Decimal("0")
    for item in body.items:
        search = db.query(SavedSearch).filter(SavedSearch.id == item.search_id, SavedSearch.user_id == user.id).first()
        if not search:
            raise HTTPException(status_code=404, detail=f"统计项 {item.search_id} 不存在")
        val = _calc_filters(db, user.id, search.filters)
        if item.operator == "+":
            total += val
        else:
            total -= val
    return {"result": total, "name": body.name}


def _calc_composite(db: Session, stat: CompositeStat) -> Decimal:
    result = Decimal("0")
    for item in stat.items:
        # 安全校验：只查询属于当前用户的 SavedSearch
        search = db.query(SavedSearch).filter(
            SavedSearch.id == item.search_id,
            SavedSearch.user_id == stat.user_id,
        ).first()
        if not search:
            continue
        val = _calc_filters(db, stat.user_id, search.filters)
        if item.operator == "+":
            result += val
        else:
            result -= val
    return result


async def _composite_to_out(stat: CompositeStat, db: Session) -> CompositeStatOut:
    items_out = []
    for it in stat.items:
        items_out.append(CompositeItemOut(
            id=it.id, search_id=it.search_id, operator=it.operator,
            sort_order=it.sort_order, search_name=it.saved_search.name if it.saved_search else None,
        ))
    return CompositeStatOut(
        id=stat.id, user_id=stat.user_id, name=stat.name, expression=stat.expression,
        result_cache=stat.result_cache, cached_at=stat.cached_at, items=items_out,
    )
