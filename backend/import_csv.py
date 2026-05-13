"""
导入图图记账 CSV 数据到 bookkeeper 数据库

用法: python import_csv.py <csv_path>

CSV 格式: 时间,类型,类别,子类别,币种,金额,备注,账户1,账户2,账本,标签,报销状态,转账手续费
"""
import csv
import sys
import os
from datetime import date, datetime, timezone
from collections import defaultdict

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.account import Account
from app.models.category import Category
from app.models.record import Record
from app.services.seed import seed_default_data

# 确保表存在
Base.metadata.create_all(bind=engine)

TEST_OPENID = "test_user_import_csv"


def get_or_create_user(db: SessionLocal) -> User:
    """获取或创建测试用户"""
    user = db.query(User).filter(User.openid == TEST_OPENID).first()
    if not user:
        user = User(openid=TEST_OPENID, nickname="吴老板(导入)")
        db.add(user)
        db.commit()
        db.refresh(user)
        # 初始化默认数据
        seed_default_data(db, user.id)
        print(f"  创建测试用户 id={user.id}")
    return user


def get_or_create_account(db: SessionLocal, user_id: int, name: str, cache: dict) -> int:
    if name in cache:
        return cache[name]
    acc = db.query(Account).filter(Account.user_id == user_id, Account.name == name).first()
    if not acc:
        acc = Account(user_id=user_id, name=name, sort_order=100 + len(cache))
        db.add(acc)
        db.flush()
    cache[name] = acc.id
    return acc.id


def get_or_create_category(db: SessionLocal, user_id: int, name: str, cache: dict) -> int:
    if name in cache:
        return cache[name]
    cat = db.query(Category).filter(Category.user_id == user_id, Category.name == name).first()
    if not cat:
        cat = Category(user_id=user_id, name=name, sort_order=100 + len(cache))
        db.add(cat)
        db.flush()
    cache[name] = cat.id
    return cat.id


def parse_date(s: str) -> date:
    """解析 20260513 格式的日期"""
    s = s.strip()
    if len(s) == 8 and s.isdigit():
        return date(int(s[:4]), int(s[4:6]), int(s[6:8]))
    # 尝试 2026-05-13 格式
    return date.fromisoformat(s)


def main():
    if len(sys.argv) < 2:
        print("用法: python import_csv.py <csv_path>")
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"文件不存在: {csv_path}")
        sys.exit(1)

    db = SessionLocal()
    try:
        user = get_or_create_user(db)
        user_id = user.id

        # 预加载缓存
        account_cache = {a.name: a.id for a in db.query(Account).filter(Account.user_id == user_id).all()}
        category_cache = {c.name: c.id for c in db.query(Category).filter(Category.user_id == user_id).all()}

        # 读取 CSV
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        print(f"CSV 共 {len(rows)} 条记录")

        # 类型映射
        type_map = {"支出": 1, "收入": 2}

        records = []
        skipped = 0
        for i, row in enumerate(rows):
            raw_type = row.get("类型", "").strip()
            raw_category = row.get("类别", "").strip()
            raw_account = row.get("账户1", "").strip()
            raw_amount = row.get("金额", "").strip()
            raw_date = row.get("时间", "").strip()
            note = row.get("备注", "").strip() or None

            # 校验
            if raw_type not in type_map:
                skipped += 1
                continue

            record_type = type_map[raw_type]

            try:
                amount = abs(float(raw_amount))
                if amount <= 0:
                    skipped += 1
                    continue
            except (ValueError, TypeError):
                skipped += 1
                continue

            try:
                record_date = parse_date(raw_date)
            except (ValueError, TypeError):
                skipped += 1
                continue

            # 账户（空值用默认"个人账户"）
            account_name = raw_account or "个人账户"
            account_id = get_or_create_account(db, user_id, account_name, account_cache)

            # 类别（空值用默认"消费"）
            category_name = raw_category or "消费"
            category_id = get_or_create_category(db, user_id, category_name, category_cache)

            rec = Record(
                user_id=user_id,
                type=record_type,
                amount=amount,
                record_date=record_date,
                account_id=account_id,
                category_id=category_id,
                channel_id=None,
                bank_id=None,
                note=note,
                source=1,  # 手动
            )
            records.append(rec)

            # 每 500 条批量提交
            if len(records) >= 500:
                db.add_all(records)
                db.commit()
                print(f"  已导入 {i + 1}/{len(rows)} ...")
                records = []

        # 剩余
        if records:
            db.add_all(records)
            db.commit()

        print(f"\n导入完成！成功 {len(rows) - skipped} 条，跳过 {skipped} 条")

        # 统计
        total = db.query(Record).filter(Record.user_id == user_id).count()
        print(f"数据库中共有 {total} 条记录（user_id={user_id}）")

        # 按月统计
        from sqlalchemy import func
        monthly = db.query(
            func.to_char(Record.record_date, "YYYY-MM"),
            Record.type,
            func.sum(Record.amount),
        ).filter(Record.user_id == user_id).group_by(
            func.to_char(Record.record_date, "YYYY-MM"),
            Record.type,
        ).order_by(func.to_char(Record.record_date, "YYYY-MM").desc()).limit(20).all()

        print("\n最近月份统计:")
        for m, t, s in monthly:
            label = "收入" if t == 2 else "支出"
            print(f"  {m} {label}: {s:,.2f}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
