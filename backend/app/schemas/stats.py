from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class StatsFilter(BaseModel):
    date_from: str | None = None
    date_to: str | None = None
    type: int | None = None  # 1=支出 2=收入 null=全部
    account_ids: list[int] | None = None
    category_ids: list[int] | None = None
    channel_ids: list[int] | None = None
    bank_ids: list[int] | None = None


class StatsQueryRequest(BaseModel):
    filters: StatsFilter


class StatsResult(BaseModel):
    total: Decimal
    count: int


class SavedSearchCreate(BaseModel):
    name: str
    filters: StatsFilter


class SavedSearchUpdate(BaseModel):
    name: str | None = None
    filters: StatsFilter | None = None


class SavedSearchOut(BaseModel):
    id: int
    user_id: int
    name: str
    filters: dict
    result_cache: Decimal | None = None
    cached_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class CompositeStatCreate(BaseModel):
    name: str
    items: list["CompositeItemInput"]


class CompositeItemInput(BaseModel):
    search_id: int
    operator: str = "+"  # "+" or "-"


class CompositeStatUpdate(BaseModel):
    name: str | None = None
    items: list[CompositeItemInput] | None = None


class CompositeStatOut(BaseModel):
    id: int
    user_id: int
    name: str
    expression: str
    result_cache: Decimal | None = None
    cached_at: datetime | None = None
    items: list["CompositeItemOut"] = []

    model_config = {"from_attributes": True}


class CompositeItemOut(BaseModel):
    id: int
    search_id: int
    operator: str
    sort_order: int
    search_name: str | None = None

    model_config = {"from_attributes": True}


class StatsOverview(BaseModel):
    month_expense: Decimal
    month_income: Decimal
    month_balance: Decimal
    recent_records: list[dict]
    by_category: list[dict]
    by_account: list[dict]
