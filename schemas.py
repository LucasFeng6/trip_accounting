from pydantic import BaseModel, Field
from datetime import date
from typing import List

# ---- Users ----
class UserCreate(BaseModel):
     name: str = Field(..., max_length=50)

class UserOut(BaseModel):
    id: int
    name: str

# ---- Expenses ----
class ExpenseCreate(BaseModel):
    project_name: str
    payer_id: int
    title: str
    amount: float
    participant_ids: List[int]
    spent_at: date | None = None  # None 则用今天

class ExpenseOut(BaseModel):
    id: int
    project_name: str
    payer_id: int
    title: str
    amount: float
    participant_ids: List[int]
    spent_at: date

# ---- Settlement ----
class UserBalance(BaseModel):
    user_id: int
    user_name: str
    balance: float  # 正：该收；负：该付

class Transfer(BaseModel):
    from_user: str
    to_user: str
    amount: float

class SettlementResult(BaseModel):
    project_name: str
    total_amount: float
    per_capita: float
    balances: List[UserBalance]
    transfers: List[Transfer]
