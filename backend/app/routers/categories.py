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
    # 鍙鏌ユ椿璺冪被鍒殑鍚嶇О閲嶅锛屽厑璁稿鐢ㄥ凡杞垹闄ょ殑鍚嶇О
    exists = db.query(Category).filter(
        Category.user_id == user.id,
        Category.name == body.name,
        Category.is_active == True,
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="绫荤洰鍚嶇О宸插瓨鍦?)
    # 濡傛灉鏈夊悓鍚嶄絾宸茶蒋鍒犻櫎鐨勭被鍒紝鎭㈠瀹?    soft_deleted = db.query(Category).filter(
        Category.user_id == user.id,
        Category.name == body.name,
        Category.is_active == False,
    ).first()
    if soft_deleted:
        soft_deleted.is_active = True
        soft_deleted.cat_type = body.cat_type if body.cat_type is not None else soft_deleted.cat_type
        db.commit()
        db.refresh(soft_deleted)
        return soft_deleted
    item = Category(
        user_id=user.id,
        name=body.name,
        cat_type=body.cat_type if body.cat_type is not None else 1
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ConfigOut)
async def update_category(item_id: int, body: ConfigUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(Category).filter(Category.id == item_id, Category.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="涓嶅瓨鍦?)
    # 绯荤粺绫诲埆涓嶅厑璁告敼鍚?    if item.is_system and body.name and body.name != item.name:
        raise HTTPException(status_code=400, detail="绯荤粺绫诲埆涓嶅彲淇敼鍚嶇О")
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
        raise HTTPException(status_code=404, detail="涓嶅瓨鍦?)
    # 绯荤粺绫诲埆涓嶅彲鍒犻櫎
    if item.is_system:
        raise HTTPException(status_code=400, detail="绯荤粺绫诲埆涓嶅彲鍒犻櫎")

    # 鎵惧埌璇ョ敤鎴风殑"鏈垎绫?绫诲埆浣滀负鍏滃簳
    uncategorized = db.query(Category).filter(
        Category.user_id == user.id,
        Category.is_system == True,
        Category.name == "鏈垎绫?,
    ).first()

    # 灏嗚绫诲埆涓嬬殑鎵€鏈夎褰曡縼绉诲埌"鏈垎绫?
    if uncategorized:
        db.query(Record).filter(
            Record.user_id == user.id,
            Record.category_id == item_id,
        ).update({"category_id": uncategorized.id})

    item.is_active = False
    db.commit()
    return {"detail": "鍒犻櫎鎴愬姛"}