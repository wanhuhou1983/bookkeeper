from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Record
from app.models.account import Account
from app.models.category import Category
from app.models.channel import Channel
from app.models.bank import Bank
from app.schemas.record import RecordCreate, RecordUpdate, RecordOut, RecordListOut, RecordConvert

router = APIRouter(prefix="/api/v1/records", tags=["records"])


def _record_to_out(r: Record) -> RecordOut:
    return RecordOut(
        id=r.id, type=r.type, amount=r.amount, record_date=r.record_date,
        account_id=r.account_id, category_id=r.category_id,
        channel_id=r.channel_id, bank_id=r.bank_id,
        note=r.note, source=r.source,
        created_at=str(r.created_at) if r.created_at else None,
        updated_at=str(r.updated_at) if r.updated_at else None,
        account_name=r.account.name if r.account else None,
        category_name=r.category.name if r.category else None,
        channel_name=r.channel.name if r.channel else None,
        bank_name=r.bank.name if r.bank else None,
    )


@router.get("", response_model=RecordListOut)
async def list_records(
    type: int | None = Query(None, ge=1, le=2),
    account_id: int | None = None,
    category_id: int | None = None,
    channel_id: int | None = None,
    bank_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Record).options(
        joinedload(Record.account), joinedload(Record.category),
        joinedload(Record.channel), joinedload(Record.bank),
    ).filter(Record.user_id == user.id)

    if type is not None:
        q = q.filter(Record.type == type)
    if account_id:
        q = q.filter(Record.account_id == account_id)
    if category_id:
        q = q.filter(Record.category_id == category_id)
    if channel_id:
        q = q.filter(Record.channel_id == channel_id)
    if bank_id:
        q = q.filter(Record.bank_id == bank_id)
    if date_from:
        q = q.filter(Record.record_date >= date_from)
    if date_to:
        q = q.filter(Record.record_date <= date_to)

    total = q.count()
    items = q.order_by(Record.record_date.desc(), Record.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return RecordListOut(items=[_record_to_out(r) for r in items], total=total, page=page, page_size=page_size)


@router.post("", response_model=RecordOut)
async def create_record(body: RecordCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 校验 bank_id 必须在有 channel_id 时才能设置
    if body.bank_id and not body.channel_id:
        raise HTTPException(status_code=400, detail="选择银行前必须先选择渠道")

    record = Record(user_id=user.id, **body.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    # reload with relationships
    record = db.query(Record).options(
        joinedload(Record.account), joinedload(Record.category),
        joinedload(Record.channel), joinedload(Record.bank),
    ).filter(Record.id == record.id).first()
    return _record_to_out(record)


@router.get("/{record_id}", response_model=RecordOut)
async def get_record(record_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(Record).options(
        joinedload(Record.account), joinedload(Record.category),
        joinedload(Record.channel), joinedload(Record.bank),
    ).filter(Record.id == record_id, Record.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return _record_to_out(record)


@router.put("/{record_id}", response_model=RecordOut)
async def update_record(record_id: int, body: RecordUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(Record).filter(Record.id == record_id, Record.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(record, key, val)
    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    record = db.query(Record).options(
        joinedload(Record.account), joinedload(Record.category),
        joinedload(Record.channel), joinedload(Record.bank),
    ).filter(Record.id == record.id).first()
    return _record_to_out(record)


@router.delete("/{record_id}")
async def delete_record(record_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(Record).filter(Record.id == record_id, Record.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    db.delete(record)
    db.commit()
    return {"detail": "删除成功"}


@router.post("/{record_id}/copy", response_model=RecordOut)
async def copy_record(record_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """复制记录，日期默认改为今日"""
    record = db.query(Record).filter(Record.id == record_id, Record.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    new_record = Record(
        user_id=user.id, type=record.type, amount=record.amount,
        record_date=date.today(), account_id=record.account_id,
        category_id=record.category_id, channel_id=record.channel_id,
        bank_id=record.bank_id, note=record.note, source=1,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    new_record = db.query(Record).options(
        joinedload(Record.account), joinedload(Record.category),
        joinedload(Record.channel), joinedload(Record.bank),
    ).filter(Record.id == new_record.id).first()
    return _record_to_out(new_record)


@router.put("/{record_id}/convert", response_model=RecordOut)
async def convert_record(record_id: int, body: RecordConvert, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """转为支出/收入"""
    record = db.query(Record).filter(Record.id == record_id, Record.user_id == user.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    record.type = body.target_type
    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    record = db.query(Record).options(
        joinedload(Record.account), joinedload(Record.category),
        joinedload(Record.channel), joinedload(Record.bank),
    ).filter(Record.id == record.id).first()
    return _record_to_out(record)
