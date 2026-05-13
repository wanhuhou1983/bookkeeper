from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey, Text, SmallInteger, CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CompositeStat(Base):
    __tablename__ = "composite_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    expression: Mapped[str] = mapped_column(Text, nullable=False)
    result_cache: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    cached_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="composite_stats")
    items = relationship("CompositeStatItem", back_populates="composite_stat", cascade="all, delete-orphan",
                         order_by="CompositeStatItem.sort_order")


class CompositeStatItem(Base):
    __tablename__ = "composite_stat_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    composite_id: Mapped[int] = mapped_column(Integer, ForeignKey("composite_stats.id", ondelete="CASCADE"),
                                               nullable=False)
    search_id: Mapped[int] = mapped_column(Integer, ForeignKey("saved_searches.id"), nullable=False)
    operator: Mapped[str] = mapped_column(CHAR(1), nullable=False, default="+")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    composite_stat = relationship("CompositeStat", back_populates="items")
    saved_search = relationship("SavedSearch", back_populates="composite_items")
