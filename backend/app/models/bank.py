from datetime import datetime, timezone

from sqlalchemy import String, Integer, Boolean, DateTime, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Bank(Base):
    __tablename__ = "banks"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_bank_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    channel_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("channels.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(32), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="banks")
    channel = relationship("Channel", back_populates="banks")
