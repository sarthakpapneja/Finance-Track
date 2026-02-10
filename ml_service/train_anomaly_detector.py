import pandas as pd
from sklearn.ensemble import IsolationForest
import pickle
import os

def train_anomaly_detector(data_path, model_dir):
    print("Loading data...")
    df = pd.read_csv(data_path)
    
    # Feature selection: amount only for simplicity, or amount + encoded category
    # Let's use amount
    X = df[['amount']].values
    
    # Train Isolation Forest
    print("Training Isolation Forest...")
    # contamination=0.05 means we expect 5% anomalies
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    
    # Save model
    print(f"Saving model to {model_dir}...")
    os.makedirs(model_dir, exist_ok=True)
    
    with open(os.path.join(model_dir, 'anomaly_model.pkl'), 'wb') as f:
        pickle.dump(model, f)
        
    print("Training complete.")

if __name__ == "__main__":
    DATA_PATH = "ml_service/data/synthetic_transactions.csv"
    MODEL_DIR = "ml_service/models"
    train_anomaly_detector(DATA_PATH, MODEL_DIR)
