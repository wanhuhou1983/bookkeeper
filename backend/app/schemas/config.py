from datetime import datetime
from pydantic import BaseModel, Field


class ConfigCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=32)


class ConfigUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=32)
    sort_order: int | None = None


class ConfigOut(BaseModel):
    id: int
    user_id: int
    name: str
    sort_order: int
    is_active: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class BankCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=32)
    channel_id: int | None = None


class BankUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=32)
    channel_id: int | None = None
    sort_order: int | None = None


class BankOut(ConfigOut):
    channel_id: int | None = None

    model_config = {"from_attributes": True}
