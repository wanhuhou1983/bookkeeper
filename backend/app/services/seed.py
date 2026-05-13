from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.category import Category
from app.models.channel import Channel
from app.models.bank import Bank

DEFAULT_ACCOUNTS = ["个人账户", "投资账户", "羊毛账户", "阿龙账户", "临时账户"]
DEFAULT_CATEGORIES = ["消费", "套现", "个人互转", "他人转账", "羊毛"]
DEFAULT_CHANNELS = ["微信", "支付宝", "京东", "云闪付", "抖音", "美团", "银行转账"]
DEFAULT_BANKS = ["工商银行", "农业银行", "建设银行", "中国银行"]


def seed_default_data(db: Session, user_id: int):
    """新用户注册时自动插入默认配置数据"""
    for i, name in enumerate(DEFAULT_ACCOUNTS):
        db.add(Account(user_id=user_id, name=name, sort_order=i))

    for i, name in enumerate(DEFAULT_CATEGORIES):
        db.add(Category(user_id=user_id, name=name, sort_order=i))

    for i, name in enumerate(DEFAULT_CHANNELS):
        db.add(Channel(user_id=user_id, name=name, sort_order=i))

    # 银行默认关联"银行转账"渠道（需要在flush后获取channel_id）
    db.flush()
    bank_channel = db.query(Channel).filter(
        Channel.user_id == user_id, Channel.name == "银行转账"
    ).first()
    for i, name in enumerate(DEFAULT_BANKS):
        db.add(Bank(
            user_id=user_id, name=name, sort_order=i,
            channel_id=bank_channel.id if bank_channel else None,
        ))

    db.commit()
