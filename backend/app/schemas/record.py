from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field


class RecordCreate(BaseModel):
    type: int = Field(..., ge=1, le=2, description="1=支出, 2=收入")
    amount: Decimal = Field(..., gt=0)
    record_date: date
    account_id: int
    category_id: int | None = None
    channel_id: int | None = None
    bank_id: int | None = None
    note: str | None = None


class RecordUpdate(BaseModel):
    type: int | None = Field(None, ge=1, le=2)
    amount: Decimal | None = Field(None, gt=0)
    record_date: date | None = None
    account_id: int | None = None
    category_id: int | None = None
    channel_id: int | None = None
    bank_id: int | None = None
    note: str | None = None


class RecordOut(BaseModel):
    id: int
    type: int
    amount: Decimal
    record_date: date
    account_id: int
    category_id: int | None = None
    channel_id: int | None = None
    bank_id: int | None = None
    note: str | None = None
    source: int
    created_at: str | None = None
    updated_at: str | None = None
    # 关联名称
    account_name: str | None = None
    category_name: str | None = None
    channel_name: str | None = None
    bank_name: str | None = None

    model_config = {"from_attributes": True}


class RecordListOut(BaseModel):
    items: list[RecordOut]
    total: int
    page: int
    page_size: int


class RecordConvert(BaseModel):
    target_type: int = Field(..., ge=1, le=2, description="目标类型：1=支出, 2=收入")