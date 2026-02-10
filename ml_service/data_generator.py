import pandas as pd
import random
from faker import Faker
import numpy as np

fake = Faker()

CATEGORIES = {
    "Groceries": ["WALMART", "KROGER", "WHOLE FOODS", "TRADER JOE'S", "ALDI", "PUBLIX", "SAFEWAY", "WEGMANS"],
    "Dining": ["MCDONALDS", "STARBUCKS", "CHIPOTLE", "BURGER KING", "SUBWAY", "DOMINOS", "DUNKIN", "TACO BELL", "UBER EATS", "DOORDASH"],
    "Transport": ["UBER", "LYFT", "SHELL", "BP", "EXXON", "CHEVRON", "MTA", "AMTRAK", "DELTA", "SOUTHWEST"],
    "Shopping": ["AMAZON", "TARGET", "BEST BUY", "APPLE", "NIKE", "ZARA", "H&M", "UNIQLO"],
    "Utilities": ["COMCAST", "VERIZON", "AT&T", "DUKE ENERGY", "WATER DEPT", "CITY ELECTRIC"],
    "Health": ["CVS", "WALGREENS", "QUEST DIAGNOSTICS", "DENTIST", "DOCTOR", "HOSPITAL"],
    "Entertainment": ["NETFLIX", "SPOTIFY", "DISNEY+", "HULU", "CINEMA", "STEAM", "PLAYSTATION", "NINTENDO"],
    "Rent": ["APARTMENT RENT", "LEASING OFFICE", "MORTGAGE"],
    "Income": ["PAYROLL", "SALARY", "DIRECT DEPOSIT", "REFUND", "DIVIDEND"]
}

def generate_synthetic_data(num_rows=1000):
    data = []
    
    for _ in range(num_rows):
        category = random.choice(list(CATEGORIES.keys()))
        merchant = random.choice(CATEGORIES[category])
        
        # Add some noise to merchant names
        if random.random() < 0.3:
            merchant += f" store #{random.randint(100, 999)}"
        if random.random() < 0.1:
            merchant = f"POS PURCHASE {merchant}"
            
        date = fake.date_between(start_date='-1y', end_date='today')
        
        if category == "Income":
            amount = round(random.uniform(2000, 5000), 2)
        elif category == "Rent":
            amount = round(random.uniform(1000, 2000), 2)
            amount = -amount
        else:
            amount = round(random.uniform(5, 200), 2)
            amount = -amount # Expenses are negative
            
        data.append({
            "date": date,
            "description": merchant,
            "amount": amount,
            "category": category
        })
        
    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    df = generate_synthetic_data(2000)
    output_path = "ml_service/data/synthetic_transactions.csv"
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} transactions -> {output_path}")
