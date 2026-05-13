from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.models.category import Category
from app.schemas.config import ConfigCreate, ConfigUpdate, ConfigOut

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("", response_model=list[ConfigOut])
async def list_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.user_id == user.id, Category.is_active == True).order_by(Category.sort_order).all()


@router.post("", response_model=ConfigOut)
async def create_category(body: ConfigCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(Category).filter(Category.user_id == user.id, Category.name == body.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="类目名称已存在")
    item = Category(user_id=user.id, name=body.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ConfigOut)
async def update_category(item_id: int, body: ConfigUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Category).filter(Category.id == item_id, Category.user_id == user.id).first()
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
async def delete_category(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Category).filter(Category.id == item_id, Category.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    item.is_active = False
    db.commit()
    return {"detail": "删除成功"}
