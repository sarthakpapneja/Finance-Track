import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
import pickle
import os

def train_categorization_model(data_path, model_dir):
    print("Loading data...")
    df = pd.read_csv(data_path)
    
    # Text preprocessing
    print("Vectorizing descriptions...")
    tfidf = TfidfVectorizer(max_features=1000, stop_words='english')
    X_tfidf = tfidf.fit_transform(df['description']).toarray()
    
    # Feature engineering: Add amount as feature
    X = np.hstack((X_tfidf, df['amount'].values.reshape(-1, 1)))
    
    # Encode labels
    le = LabelEncoder()
    y = le.fit_transform(df['category'])
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train GradientBoostingClassifier
    print("Training GradientBoostingClassifier...")
    model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    accuracy = model.score(X_test, y_test)
    print(f"Model Accuracy: {accuracy:.4f}")
    
    # Save artifacts
    print(f"Saving artifacts to {model_dir}...")
    os.makedirs(model_dir, exist_ok=True)
    
    with open(os.path.join(model_dir, 'tfidf.pkl'), 'wb') as f:
        pickle.dump(tfidf, f)
        
    with open(os.path.join(model_dir, 'label_encoder.pkl'), 'wb') as f:
        pickle.dump(le, f)
        
    with open(os.path.join(model_dir, 'classifier_model.pkl'), 'wb') as f:
        pickle.dump(model, f)
    print("Training complete.")

if __name__ == "__main__":
    DATA_PATH = "ml_service/data/synthetic_transactions.csv"
    MODEL_DIR = "ml_service/models"
    train_categorization_model(DATA_PATH, MODEL_DIR)
