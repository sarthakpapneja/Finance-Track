import pandas as pd
from typing import List
from datetime import datetime
from .schemas import Transaction

class BankStatementParser:
    def parse_csv(self, file_path: str) -> List[Transaction]:
        df = pd.read_csv(file_path)
        
        # Normalize columns (basic implementation, can be enhanced with fuzzy matching)
        df.columns = [str(c).lower().strip() for c in df.columns]
        
        transactions = []
        for _, row in df.iterrows():
            # Match column by aliases
            def get_col(row, aliases):
                for alias in aliases:
                    if alias in row:
                        return row[alias]
                return None

            # Date Parsing
            date_val = get_col(row, ['date', 'txn_date', 'transaction_date', 'timestamp', 'posting_date'])
            try:
                txn_date = pd.to_datetime(date_val).date()
            except:
                continue 

            # Description Parsing
            description = get_col(row, ['description', 'desc', 'details', 'narration', 'merchant', 'transaction_details', 'memo'])
            if not description or pd.isna(description):
                description = "Unknown Transaction"
            
            # Amount Parsing
            amount = 0.0
            amount_val = get_col(row, ['amount', 'txn_amount', 'transaction_amount'])
            if amount_val is not None and pd.notna(amount_val):
                try:
                    amount = float(amount_val)
                except ValueError:
                    amount = 0.0
            elif 'debit' in row and pd.notna(row['debit']):
                try:
                    amount = -float(row['debit'])
                except ValueError:
                    pass
            elif 'credit' in row and pd.notna(row['credit']):
                try:
                    amount = float(row['credit'])
                except ValueError:
                    pass
            
            # Skip if amount is 0 or NaN (likely Opening Balance or invalid)
            if amount == 0.0 or pd.isna(amount):
                continue

            # Category Parsing
            category = get_col(row, ['category', 'type', 'category_name', 'expense_type'])
            if category and pd.notna(category):
                category = str(category).strip()
            else:
                category = None

            txn = Transaction(
                date=txn_date,
                description=self.clean_description(description),
                amount=amount,
                category=category,
                source="csv_upload"
            )
            transactions.append(txn)
            
        return transactions

    def clean_description(self, description: str) -> str:
        """Normalize transaction description by removing common prefixes/suffixes and extra whitespace."""
        if not description:
            return "Unknown"
        
        description = str(description).strip().upper()
        
        # Remove common prefixes
        prefixes = ["POS PURCHASE ", "DEBIT CARD PURCHASE ", "Ref: "]
        for prefix in prefixes:
            if description.startswith(prefix):
                description = description[len(prefix):].strip()
                
        # Remove extra whitespace
        description = " ".join(description.split())
        
        return description
