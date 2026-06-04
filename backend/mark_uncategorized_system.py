"""Mark existing "未分类" categories as system-protected for all users."""
from app.database import SessionLocal
from app.models.category import Category
from sqlalchemy import or_

db = SessionLocal()
try:
    # Find all "未分类" categories across all users
    uncategorized = db.query(Category).filter(
        or_(Category.name == "未分类", Category.name == "鏈未分類", Category.name == "未分類"),
        Category.cat_type.isnot(None)
    ).all()

    print(f"Found {len(uncategorized)} uncategorized entries:")
    for c in uncategorized:
        print(f"  id={c.id}, user_id={c.user_id}, name={c.name!r}, cat_type={c.cat_type}, is_system={c.is_system}")

    # Mark them as system
    count = 0
    for c in uncategorized:
        if not c.is_system:
            c.is_system = True
            count += 1

    db.commit()
    print(f"\nMarked {count} entries as is_system=true")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()