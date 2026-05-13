from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.models.bank import Bank
from app.schemas.config import BankCreate, BankUpdate, BankOut

router = APIRouter(prefix="/api/v1/banks", tags=["banks"])


@router.get("", response_model=list[BankOut])
async def list_banks(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Bank).filter(Bank.user_id == user.id, Bank.is_active == True).order_by(Bank.sort_order).all()


@router.get("/by-channel/{channel_id}", response_model=list[BankOut])
async def list_banks_by_channel(channel_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Bank).filter(
        Bank.user_id == user.id, Bank.is_active == True, Bank.channel_id == channel_id,
    ).order_by(Bank.sort_order).all()


@router.post("", response_model=BankOut)
async def create_bank(body: BankCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(Bank).filter(Bank.user_id == user.id, Bank.name == body.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="银行名称已存在")
    item = Bank(user_id=user.id, name=body.name, channel_id=body.channel_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=BankOut)
async def update_bank(item_id: int, body: BankUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Bank).filter(Bank.id == item_id, Bank.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    if body.name:
        item.name = body.name
    if body.channel_id is not None:
        item.channel_id = body.channel_id
    if body.sort_order is not None:
        item.sort_order = body.sort_order
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
async def delete_bank(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Bank).filter(Bank.id == item_id, Bank.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    item.is_active = False
    db.commit()
    return {"detail": "删除成功"}
