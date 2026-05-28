from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.models.category import Category
from app.models.record import Record
from app.schemas.config import ConfigCreate, ConfigUpdate, ConfigOut

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("", response_model=list[ConfigOut])
async def list_categories(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Category).filter(
        Category.user_id == user.id,
        Category.is_active == True
    ).order_by(Category.sort_order).all()


@router.post("", response_model=ConfigOut)
async def create_category(body: ConfigCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 只检查活跃类别的名称重复，允许复用已软删除的名称
    exists = db.query(Category).filter(
        Category.user_id == user.id,
        Category.name == body.name,
        Category.is_active == True,
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="类目名称已存在")
    # 如果有同名但已软删除的类别，恢复它
    soft_deleted = db.query(Category).filter(
        Category.user_id == user.id,
        Category.name == body.name,
        Category.is_active == False,
    ).first()
    if soft_deleted:
        soft_deleted.is_active = True
        soft_deleted.cat_type = body.cat_type or soft_deleted.cat_type
        db.commit()
        db.refresh(soft_deleted)
        return soft_deleted
    item = Category(
        user_id=user.id,
        name=body.name,
        cat_type=body.cat_type or 1
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ConfigOut)
async def update_category(item_id: int, body: ConfigUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Category).filter(Category.id == item_id, Category.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="不存在")
    # 系统类别不允许改名
    if item.is_system and body.name and body.name != item.name:
        raise HTTPException(status_code=400, detail="系统类别不可修改名称")
    if body.name:
        item.name = body.name
    if body.cat_type is not None:
        item.cat_type = body.cat_type
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
    # 系统类别不可删除
    if item.is_system:
        raise HTTPException(status_code=400, detail="系统类别不可删除")

    # 找到该用户的"未分类"类别作为兜底
    uncategorized = db.query(Category).filter(
        Category.user_id == user.id,
        Category.is_system == True,
        Category.name == "未分类",
    ).first()

    # 将该类别下的所有记录迁移到"未分类"
    if uncategorized:
        db.query(Record).filter(
            Record.user_id == user.id,
            Record.category_id == item_id,
        ).update({"category_id": uncategorized.id})

    item.is_active = False
    db.commit()
    return {"detail": "删除成功"}