from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.category import Category
from app.models.channel import Channel
from app.models.bank import Bank

DEFAULT_ACCOUNTS = ["个人账户", "投资账户", "羊毛账户", "阿龙账户", "临时账户"]
# 支出分类
DEFAULT_EXPENSE_CATEGORIES = ["消费", "转账", "分红", "利息"]
# 收入分类
DEFAULT_INCOME_CATEGORIES = ["转账", "工资", "分红", "利息", "盈利"]
SYSTEM_CATEGORIES = ["未分类"]  # 系统类别，不可删除，用于兜底
DEFAULT_CHANNELS = ["支付宝", "微信", "云闪付", "京东", "现金", "淘宝", "拼多多", "抖音"]
DEFAULT_BANKS = ["工商银行", "农业银行", "建设银行", "中国银行"]


def seed_default_data(db: Session, user_id: int):
    """新用户注册时自动插入默认配置数据"""
    for i, name in enumerate(DEFAULT_ACCOUNTS):
        db.add(Account(user_id=user_id, name=name, sort_order=i))

    # 支出分类 (cat_type=1)
    for i, name in enumerate(DEFAULT_EXPENSE_CATEGORIES):
        db.add(Category(user_id=user_id, name=name, cat_type=1, sort_order=i))

    # 收入分类 (cat_type=2)
    income_start = len(DEFAULT_EXPENSE_CATEGORIES)
    for i, name in enumerate(DEFAULT_INCOME_CATEGORIES):
        db.add(Category(user_id=user_id, name=name, cat_type=2, sort_order=income_start + i))

    # 系统类别（不可删除），sort_order 放在最后
    system_start = income_start + len(DEFAULT_INCOME_CATEGORIES)
    for i, name in enumerate(SYSTEM_CATEGORIES):
        db.add(Category(user_id=user_id, name=name, cat_type=1, is_system=True, sort_order=system_start + i))

    for i, name in enumerate(DEFAULT_CHANNELS):
        db.add(Channel(user_id=user_id, name=name, sort_order=i))

    # 银行默认关联"银行转账"渠道或第一个渠道
    db.flush()
    bank_channel = db.query(Channel).filter(
        Channel.user_id == user_id, Channel.name == "银行转账"
    ).first()
    if not bank_channel:
        bank_channel = db.query(Channel).filter(
            Channel.user_id == user_id
        ).first()
    for i, name in enumerate(DEFAULT_BANKS):
        db.add(Bank(
            user_id=user_id, name=name, sort_order=i,
            channel_id=bank_channel.id if bank_channel else None,
        ))

    db.commit()