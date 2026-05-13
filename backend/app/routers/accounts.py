from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.models.account import Account
from app.schemas.config import ConfigCreate, ConfigUpdate, ConfigOut

router = APIRouter(prefix="/api/v1/accounts", tags=["accounts"])


@router.get("", response_model=list[ConfigOut])
async def list_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Account).filter(Account.user_id == user.id, Account.is_active == True).order_by(Account.sort_order).all()


@router.post("", response_model=ConfigOut)
async def create_account(body: ConfigCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(Account).filter(Account.user_id == user.id, Account.name == body.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="账本名称已存在")
    item = Account(user_id=user.id, name=body.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ConfigOut)
async def update_account(item_id: int, body: ConfigUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Account).filter(Account.id == item_id, Account.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    if body.name:
        item.name = body.name
    if body.sort_order is not None:
        item.sort_order = body.sort_order
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
async def delete_account(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Account).filter(Account.id == item_id, Account.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    item.is_active = False
    db.commit()
    return {"detail": "删除成功"}
