from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import shutil
import os

from . import models, schemas, database, parsers
from .ml import ml_service
from . import auth as auth_module
import logging

# Setup logging
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

# Trigger reload for DB reset

app = FastAPI(title="Finance Intelligence AI")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
models.Base.metadata.create_all(bind=database.engine)

@app.on_event("startup")
async def startup_event():
    ml_service.load_models()

# ===== AUTH ENDPOINTS =====

@app.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Register a new user."""
    existing = db.query(models.UserDB).filter(models.UserDB.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    existing_email = db.query(models.UserDB).filter(models.UserDB.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    from datetime import datetime
    db_user = models.UserDB(
        username=user.username,
        email=user.email,
        hashed_password=auth_module.get_password_hash(user.password),
        full_name=user.full_name,
        created_at=datetime.now().isoformat()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token = auth_module.create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": db_user}

@app.post("/auth/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    """Login and get a JWT token."""
    user = db.query(models.UserDB).filter(models.UserDB.username == credentials.username).first()
    if not user or not auth_module.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token = auth_module.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/auth/me", response_model=schemas.UserResponse)
def get_current_user(current_user=Depends(auth_module.get_current_user_required)):
    """Get current authenticated user."""
    return current_user

# ===== DATA ENDPOINTS (all user-scoped) =====

@app.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        parser = parsers.BankStatementParser()
        transactions = parser.parse_csv(temp_file)
        
        from datetime import datetime
        statement = models.UploadedStatementDB(
            user_id=current_user.id,
            filename=file.filename,
            uploaded_at=datetime.now().isoformat(),
            transaction_count=len(transactions)
        )
        db.add(statement)
        db.commit()
        db.refresh(statement)
        
        saved_txns = []
        for txn_data in transactions:
            if not txn_data.category:
                txn_data.category = ml_service.predict_category(txn_data.description, txn_data.amount)
            
            is_anomaly = ml_service.detect_anomaly(txn_data.amount)
            
            db_txn = models.TransactionDB(
                user_id=current_user.id,
                date=txn_data.date,
                description=txn_data.description,
                amount=txn_data.amount,
                category=txn_data.category,
                source=txn_data.source,
                is_anomaly=is_anomaly,
                statement_id=statement.id
            )
            db.add(db_txn)
            saved_txns.append(db_txn)
        
        db.commit()
            
        return {"transactions_count": len(saved_txns), "statement_id": statement.id, "filename": file.filename}
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

@app.post("/transactions", response_model=schemas.TransactionResponse)
def create_transaction(
    txn: schemas.TransactionCreate,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Create a single transaction manually."""
    category = txn.category
    if not category:
        category = ml_service.predict_category(txn.description, txn.amount)
    
    is_anomaly = ml_service.detect_anomaly(txn.amount)
    
    db_txn = models.TransactionDB(
        user_id=current_user.id,
        date=txn.date,
        description=txn.description,
        amount=txn.amount,
        category=category,
        source=txn.source,
        is_anomaly=is_anomaly,
        statement_id=None
    )
    db.add(db_txn)
    db.commit()
    db.refresh(db_txn)
    return db_txn

@app.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(
    skip: int = 0, limit: int = 500, statement_ids: str = None,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    query = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id)
    if statement_ids:
        ids = [int(id.strip()) for id in statement_ids.split(',') if id.strip()]
        if ids:
            query = query.filter(models.TransactionDB.statement_id.in_(ids))
    return query.offset(skip).limit(limit).all()

@app.get("/statements", response_model=List[schemas.UploadedStatementResponse])
def get_statements(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Get all uploaded statements for the current user."""
    return db.query(models.UploadedStatementDB).filter(
        models.UploadedStatementDB.user_id == current_user.id
    ).order_by(models.UploadedStatementDB.id.desc()).all()

@app.delete("/statements/{statement_id}")
def delete_statement(
    statement_id: int,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Delete a statement and all its associated transactions."""
    statement = db.query(models.UploadedStatementDB).filter(
        models.UploadedStatementDB.id == statement_id,
        models.UploadedStatementDB.user_id == current_user.id
    ).first()
    if not statement:
        raise HTTPException(status_code=404, detail="Statement not found")
    
    deleted_count = db.query(models.TransactionDB).filter(
        models.TransactionDB.statement_id == statement_id,
        models.TransactionDB.user_id == current_user.id
    ).delete(synchronize_session=False)
    
    db.delete(statement)
    db.commit()
    
    return {"message": f"Deleted statement '{statement.filename}' and {deleted_count} transactions"}

@app.put("/transactions/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: int, txn_update: schemas.TransactionUpdate,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    db_txn = db.query(models.TransactionDB).filter(
        models.TransactionDB.id == transaction_id,
        models.TransactionDB.user_id == current_user.id
    ).first()
    if not db_txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if txn_update.description is not None:
        db_txn.description = txn_update.description
    if txn_update.amount is not None:
        db_txn.amount = txn_update.amount
    if txn_update.category is not None:
        db_txn.category = txn_update.category
    
    db.commit()
    db.refresh(db_txn)
    return db_txn

@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    db_txn = db.query(models.TransactionDB).filter(
        models.TransactionDB.id == transaction_id,
        models.TransactionDB.user_id == current_user.id
    ).first()
    if not db_txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_txn)
    db.commit()
    return {"message": "Transaction deleted"}

@app.post("/transactions/bulk-delete")
def bulk_delete_transactions(
    ids: List[int],
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    deleted_count = db.query(models.TransactionDB).filter(
        models.TransactionDB.id.in_(ids),
        models.TransactionDB.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": f"Deleted {deleted_count} transactions"}

# Analytics (all user-scoped)

@app.get("/analytics/forecast")
def get_forecast(
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    transactions = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    return ml_service.forecast_balance(transactions, days)

@app.get("/analytics/spending")
def get_spending_breakdown(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    txns = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    breakdown = {}
    for t in txns:
        if t.amount is not None and t.amount < 0:
            cat = t.category or "Uncategorized"
            breakdown[cat] = breakdown.get(cat, 0) + abs(t.amount)
    return breakdown

@app.get("/analytics/summary")
def get_analytics_summary(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Get comprehensive financial analytics summary."""
    transactions = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    summary = ml_service.calculate_analytics_summary(transactions)
    summary['investment_suggestions'] = ml_service.get_investment_suggestions(summary)
    return summary

@app.get("/analytics/subscriptions")
def get_subscriptions(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Detect recurring subscriptions."""
    transactions = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    return ml_service.detect_subscriptions(transactions)

@app.get("/analytics/income-patterns")
def get_income_patterns(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Detect salary/income patterns."""
    transactions = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    return ml_service.detect_income_patterns(transactions)

@app.get("/analytics/savings-projection")
def get_savings_projection(
    months: int = 12,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Project savings growth."""
    transactions = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    return ml_service.project_savings(transactions, months)

# Budgets (user-scoped)

@app.post("/budgets", response_model=schemas.BudgetResponse)
def create_budget(
    budget: schemas.BudgetCreate,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    # Check for existing budget with same category for this user
    db_budget = db.query(models.BudgetDB).filter(
        models.BudgetDB.category == budget.category,
        models.BudgetDB.user_id == current_user.id
    ).first()
    if db_budget:
        db_budget.amount = budget.amount
    else:
        db_budget = models.BudgetDB(user_id=current_user.id, category=budget.category, amount=budget.amount)
        db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@app.get("/budgets", response_model=List[schemas.BudgetResponse])
def get_budgets(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    return db.query(models.BudgetDB).filter(models.BudgetDB.user_id == current_user.id).all()

@app.delete("/budgets/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    db_budget = db.query(models.BudgetDB).filter(
        models.BudgetDB.id == budget_id,
        models.BudgetDB.user_id == current_user.id
    ).first()
    if not db_budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(db_budget)
    db.commit()
    return {"message": "Budget deleted"}

# Bill Reminders (user-scoped)

@app.get("/bill-reminders", response_model=List[schemas.BillReminderResponse])
def get_bill_reminders(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    return db.query(models.BillReminderDB).filter(
        models.BillReminderDB.user_id == current_user.id,
        models.BillReminderDB.is_active == True
    ).all()

@app.post("/bill-reminders", response_model=schemas.BillReminderResponse)
def create_bill_reminder(
    reminder: schemas.BillReminderCreate,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    db_reminder = models.BillReminderDB(user_id=current_user.id, **reminder.dict())
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@app.delete("/bill-reminders/{reminder_id}")
def delete_bill_reminder(
    reminder_id: int,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    db_reminder = db.query(models.BillReminderDB).filter(
        models.BillReminderDB.id == reminder_id,
        models.BillReminderDB.user_id == current_user.id
    ).first()
    if not db_reminder:
        raise HTTPException(status_code=404, detail="Bill reminder not found")
    db.delete(db_reminder)
    db.commit()
    return {"message": "Bill reminder deleted"}

# ===== PHASE 2: NEW ENDPOINTS (user-scoped) =====

# Goals CRUD
@app.get("/goals", response_model=List[schemas.GoalResponse])
def get_goals(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    return db.query(models.GoalDB).filter(models.GoalDB.user_id == current_user.id).all()

@app.post("/goals", response_model=schemas.GoalResponse)
def create_goal(
    goal: schemas.GoalCreate,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    from datetime import datetime
    db_goal = models.GoalDB(
        user_id=current_user.id,
        name=goal.name,
        target_amount=goal.target_amount,
        deadline=goal.deadline,
        current_saved=0.0,
        created_at=datetime.now().isoformat()
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.put("/goals/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(
    goal_id: int, goal_update: schemas.GoalUpdate,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    db_goal = db.query(models.GoalDB).filter(
        models.GoalDB.id == goal_id,
        models.GoalDB.user_id == current_user.id
    ).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal_update.name is not None:
        db_goal.name = goal_update.name
    if goal_update.target_amount is not None:
        db_goal.target_amount = goal_update.target_amount
    if goal_update.current_saved is not None:
        db_goal.current_saved = goal_update.current_saved
    if goal_update.deadline is not None:
        db_goal.deadline = goal_update.deadline
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    db_goal = db.query(models.GoalDB).filter(
        models.GoalDB.id == goal_id,
        models.GoalDB.user_id == current_user.id
    ).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(db_goal)
    db.commit()
    return {"message": "Goal deleted"}

@app.get("/goals/{goal_id}/plan")
def get_goal_plan(
    goal_id: int,
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Get detailed goal planning analysis."""
    db_goal = db.query(models.GoalDB).filter(
        models.GoalDB.id == goal_id,
        models.GoalDB.user_id == current_user.id
    ).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    transactions = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    return ml_service.plan_goal(
        db_goal.target_amount, 
        db_goal.deadline, 
        transactions, 
        db_goal.current_saved
    )

# Emergency Detection
@app.get("/analytics/emergencies")
def get_emergencies(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Detect financial emergencies and get recovery suggestions."""
    transactions = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    return ml_service.detect_emergencies(transactions)

# Spending Personality
@app.get("/analytics/personality")
def get_spending_personality(
    db: Session = Depends(database.get_db),
    current_user=Depends(auth_module.get_current_user_required)
):
    """Analyze and classify spending personality."""
    transactions = db.query(models.TransactionDB).filter(models.TransactionDB.user_id == current_user.id).all()
    return ml_service.analyze_spending_personality(transactions)

@app.get("/")
def read_root():
    return {"message": "Finance Intelligence AI API is running"}
