import pandas as pd
from prophet import Prophet
import pickle
import os

def train_forecaster(data_path, model_dir):
    print("Loading data...")
    df = pd.read_csv(data_path)
    
    # Preprocess: Aggregate to daily balance
    df['date'] = pd.to_datetime(df['date'])
    daily_transactions = df.groupby('date')['amount'].sum().reset_index()
    daily_transactions = daily_transactions.sort_values('date')
    
    # Calculate cumulative balance (assuming starting balance of 0 for simplicity, or 5000)
    daily_transactions['balance'] = daily_transactions['amount'].cumsum() + 5000
    
    # Prepare for Prophet (ds, y)
    prophet_df = daily_transactions[['date', 'balance']].rename(columns={'date': 'ds', 'balance': 'y'})
    
    print("Training Prophet model...")
    model = Prophet()
    model.fit(prophet_df)
    
    # Save model
    print(f"Saving model to {model_dir}...")
    os.makedirs(model_dir, exist_ok=True)
    
    # Prophet models should be saved with pickle or json serialization provided by the library
    # but pickle is standard for broad compatibility if versions match
    with open(os.path.join(model_dir, 'prophet_model.pkl'), 'wb') as f:
        pickle.dump(model, f)
        
    print("Training complete.")

if __name__ == "__main__":
    DATA_PATH = "ml_service/data/synthetic_transactions.csv"
    MODEL_DIR = "ml_service/models"
    train_forecaster(DATA_PATH, MODEL_DIR)
