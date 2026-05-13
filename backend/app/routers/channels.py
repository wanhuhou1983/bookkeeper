from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.models.channel import Channel
from app.schemas.config import ConfigCreate, ConfigUpdate, ConfigOut

router = APIRouter(prefix="/api/v1/channels", tags=["channels"])


@router.get("", response_model=list[ConfigOut])
async def list_channels(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Channel).filter(Channel.user_id == user.id, Channel.is_active == True).order_by(Channel.sort_order).all()


@router.post("", response_model=ConfigOut)
async def create_channel(body: ConfigCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(Channel).filter(Channel.user_id == user.id, Channel.name == body.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="渠道名称已存在")
    item = Channel(user_id=user.id, name=body.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ConfigOut)
async def update_channel(item_id: int, body: ConfigUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Channel).filter(Channel.id == item_id, Channel.user_id == user.id).first()
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
async def delete_channel(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Channel).filter(Channel.id == item_id, Channel.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    item.is_active = False
    db.commit()
    return {"detail": "删除成功"}
