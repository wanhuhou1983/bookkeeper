from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import SmallInteger, Numeric, Date, Text, DateTime, Integer, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Record(Base):
    __tablename__ = "records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    type: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1=支出, 2=收入
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    record_date: Mapped[date] = mapped_column(Date, nullable=False)
    account_id: Mapped[int] = mapped_column(Integer, ForeignKey("accounts.id"), nullable=False)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    channel_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("channels.id"), nullable=True)
    bank_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("banks.id"), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[int] = mapped_column(SmallInteger, default=1)  # 1=手动, 2=拍照识图
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="records")
    account = relationship("Account")
    category = relationship("Category")
    channel = relationship("Channel")
    bank = relationship("Bank")

    __table_args__ = (
        Index("idx_records_user_date", "user_id", record_date.desc()),
        Index("idx_records_user_type", "user_id", "type"),
        Index("idx_records_user_account", "user_id", "account_id"),
        Index("idx_records_user_category", "user_id", "category_id"),
    )