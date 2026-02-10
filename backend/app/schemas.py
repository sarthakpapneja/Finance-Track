from pydantic import BaseModel
from datetime import date
from typing import Optional

class Transaction(BaseModel):
    date: date
    description: str
    amount: float
    category: Optional[str] = None
    source: str = "csv_upload"

class TransactionCreate(Transaction):
    pass

class TransactionResponse(Transaction):
    id: int
    is_recurring: bool
    is_anomaly: bool

    class Config:
        from_attributes = True

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None

class BudgetBase(BaseModel):
    category: str
    amount: float

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int

    class Config:
        from_attributes = True

class BillReminderBase(BaseModel):
    name: str
    amount: float
    due_day: int  # Day of month (1-31)
    category: Optional[str] = None

class BillReminderCreate(BillReminderBase):
    pass

class BillReminderResponse(BillReminderBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class UploadedStatementResponse(BaseModel):
    id: int
    filename: str
    uploaded_at: str
    transaction_count: int

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    name: str
    target_amount: float
    deadline: str  # ISO date string

class GoalCreate(GoalBase):
    pass

class GoalResponse(GoalBase):
    id: int
    current_saved: float
    created_at: str

    class Config:
        from_attributes = True

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_saved: Optional[float] = None
    deadline: Optional[str] = None

class PurchaseImpactRequest(BaseModel):
    amount: float

# Auth schemas
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

