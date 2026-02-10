import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.parsers import BankStatementParser

def test_parser():
    parser = BankStatementParser()
    file_path = "data/raw/sample_statement.csv"
    transactions = parser.parse_csv(file_path)
    
    print(f"Parsed {len(transactions)} transactions:")
    for t in transactions:
        print(t)

if __name__ == "__main__":
    test_parser()
