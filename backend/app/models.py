from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from .database import Base

class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    date = Column(Date)
    description = Column(String, index=True)
    amount = Column(Float)
    category = Column(String, index=True, nullable=True)
    source = Column(String, default="manual")
    is_recurring = Column(Boolean, default=False)
    is_anomaly = Column(Boolean, default=False)
    statement_id = Column(Integer, nullable=True, index=True)  # Links to UploadedStatementDB

class BudgetDB(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    category = Column(String, index=True)  # No longer globally unique — unique per user enforced in code
    amount = Column(Float)

class BillReminderDB(Base):
    __tablename__ = "bill_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    name = Column(String, index=True)
    amount = Column(Float)
    due_day = Column(Integer)  # Day of month (1-31)
    is_active = Column(Boolean, default=True)
    category = Column(String, nullable=True)

class UploadedStatementDB(Base):
    __tablename__ = "uploaded_statements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    filename = Column(String, index=True)
    uploaded_at = Column(String)  # ISO format datetime
    transaction_count = Column(Integer, default=0)

class GoalDB(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    name = Column(String, index=True)
    target_amount = Column(Float)
    deadline = Column(String)  # ISO date
    current_saved = Column(Float, default=0.0)
    created_at = Column(String)

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    created_at = Column(String)
