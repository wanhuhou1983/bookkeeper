from datetime import datetime, timezone

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    openid: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    union_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(64), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # relationships
    accounts = relationship("Account", back_populates="user", lazy="dynamic")
    categories = relationship("Category", back_populates="user", lazy="dynamic")
    channels = relationship("Channel", back_populates="user", lazy="dynamic")
    banks = relationship("Bank", back_populates="user", lazy="dynamic")
    records = relationship("Record", back_populates="user", lazy="dynamic")
    saved_searches = relationship("SavedSearch", back_populates="user", lazy="dynamic")
    composite_stats = relationship("CompositeStat", back_populates="user", lazy="dynamic")
