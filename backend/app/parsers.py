import pandas as pd
from typing import List
from datetime import datetime
from .schemas import Transaction

class BankStatementParser:
    def parse_csv(self, file_path: str) -> List[Transaction]:
        df = pd.read_csv(file_path)
        
        # Normalize columns headers: strip whitespace and convert to lower case
        df.columns = [str(c).strip() for c in df.columns]
        
        # Identify columns using regex patterns
        # Note: We keep original column names for data extraction
        # Identify columns using regex patterns
        # Note: We keep original column names for data extraction
        col_map = {
            'date': self._find_col(df, [r'date', r'posted', r'time', r'day']),
            'desc': self._find_col(df, [r'desc', r'narration', r'details', r'merchant', r'memo', r'transaction', r'payee']),
            'amount': self._find_col(df, [r'amount', r'value', r'\bmnt\b', r'in.*out']),
            'debit': self._find_col(df, [r'debit', r'withdrawal', r'\bdr\b', r'\bout\b']),
            'credit': self._find_col(df, [r'credit', r'deposit', r'\bcr\b', r'\bin\b']),
            'category': self._find_col(df, [r'category', r'type', r'class'])
        }

        transactions = []
        for _, row in df.iterrows():
            # Date Parsing
            txn_date = self._parse_date(row, col_map['date'])
            if not txn_date:
                continue

            # Description Parsing
            description = "Unknown Transaction"
            if col_map['desc']:
                val = row[col_map['desc']]
                if pd.notna(val) and str(val).strip():
                    description = str(val).strip()

            # Amount Parsing
            amount = 0.0
            
            # Case 1: Explicit Debit/Credit columns
            if col_map['debit'] and col_map['credit']:
                debit_val = self._parse_amount(row.get(col_map['debit']))
                credit_val = self._parse_amount(row.get(col_map['credit']))
                
                # Logic: Credit is positive, Debit is negative
                # Note: _parse_amount returns abs value usually, but let's be safe
                amount = credit_val - abs(debit_val)
                
            # Case 2: Just Amount column
            elif col_map['amount']:
                amount = self._parse_amount(row[col_map['amount']], allow_negative=True)
                
            # Case 3: Only Debit or Only Credit (rare but possible)
            elif col_map['debit']:
                amount = -abs(self._parse_amount(row[col_map['debit']]))
            elif col_map['credit']:
                amount = abs(self._parse_amount(row[col_map['credit']]))

            # Skip if amount is effectively zero
            if abs(amount) < 0.01:
                continue

            # Category Parsing
            category = None
            if col_map['category']:
                val = row[col_map['category']]
                if pd.notna(val):
                    category = str(val).strip()

            txn = Transaction(
                date=txn_date,
                description=self.clean_description(description),
                amount=amount,
                category=category,
                source="csv_upload"
            )
            transactions.append(txn)
            
        return transactions

    def _find_col(self, df: pd.DataFrame, patterns: List[str]) -> str:
        """Find matches for a column type based on regex regex_patterns."""
        import re
        for col in df.columns:
            for pattern in patterns:
                if re.search(pattern, col, re.IGNORECASE):
                    return col
        return None

    def _parse_date(self, row: pd.Series, col_name: str):
        if not col_name:
            return None
        val = row[col_name]
        try:
            return pd.to_datetime(val, dayfirst=True).date()
        except:
            return None

    def _parse_amount(self, val, allow_negative=False) -> float:
        """Clean and parse amount values, handling currency symbols and formatting."""
        if pd.isna(val) or val is None:
            return 0.0
            
        # Convert to string
        s = str(val).strip()
        
        # Remove currency symbols and common separators
        # Keep dots, digits, and negative sign
        import re
        # Remove currency symbols (except dot and minus)
        cleaned = re.sub(r'[^\d\.\-]', '', s)
        
        try:
            amount = float(cleaned)
            if not allow_negative:
                return abs(amount)
            return amount
        except ValueError:
            return 0.0

    def clean_description(self, description: str) -> str:
        """Normalize transaction description by removing common prefixes/suffixes and extra whitespace."""
        if not description:
            return "Unknown"
        
        description = str(description).strip().upper()
        
        # Remove common prefixes
        prefixes = ["POS PURCHASE ", "DEBIT CARD PURCHASE ", "Ref: ", "ACH ", "TXN "]
        for prefix in prefixes:
            if description.startswith(prefix):
                description = description[len(prefix):].strip()
                
        # Remove extra whitespace
        description = " ".join(description.split())
        
        return description
