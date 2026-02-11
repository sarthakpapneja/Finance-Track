import pytest
import pandas as pd
from datetime import date
from backend.app.parsers import BankStatementParser
import os

@pytest.fixture
def parser():
    return BankStatementParser()

def create_csv(tmp_path, content):
    p = tmp_path / "test_statement.csv"
    p.write_text(content, encoding='utf-8')
    return str(p)

def test_standard_format(parser, tmp_path):
    csv = "Date,Description,Amount,Category\n2023-01-01,Grocery,-50.00,Food\n2023-01-02,Salary,2000.00,Income"
    path = create_csv(tmp_path, csv)
    txns = parser.parse_csv(path)
    assert len(txns) == 2
    assert txns[0].amount == -50.00
    assert txns[1].amount == 2000.00

def test_different_headers(parser, tmp_path):
    csv = "Posted Date,Transaction Details,Value,Type\n01/01/2023,Uber,-15.50,Transport\n02/01/2023,Refund,10.00,Other"
    path = create_csv(tmp_path, csv)
    txns = parser.parse_csv(path)
    assert len(txns) == 2
    assert txns[0].description == "UBER"
    assert txns[0].amount == -15.50

def test_debit_credit_columns(parser, tmp_path):
    csv = "Date,Description,Debit,Credit,Balance\n2023-05-01,Rent,1000.00,,5000\n2023-05-02,Salary,,3000.00,8000"
    path = create_csv(tmp_path, csv)
    txns = parser.parse_csv(path)
    assert len(txns) == 2
    assert txns[0].amount == -1000.00
    assert txns[1].amount == 3000.00

def test_currency_symbols(parser, tmp_path):
    csv = "Date,Desc,Amount\n2023-01-01,Coffee,$5.00\n2023-01-02,Dinner,-€20.00"
    path = create_csv(tmp_path, csv)
    txns = parser.parse_csv(path)
    assert len(txns) == 2
    assert txns[0].amount == 5.00
    assert txns[1].amount == -20.00

def test_format_a_posted_date_ref_payee(parser, tmp_path):
    # Format A: Posted Date, Reference Number, Payee, Address, Amount
    csv = "Posted Date,Reference Number,Payee,Address,Amount\n01/05/2023,REF123,Uber,123 Main St,-15.50\n02/05/2023,REF124,Salary,Corporation,2500.00"
    path = create_csv(tmp_path, csv)
    txns = parser.parse_csv(path)
    assert len(txns) == 2
    assert txns[0].amount == -15.50
    assert txns[0].description == "UBER"
    assert txns[1].amount == 2500.00

def test_format_b_split_debit_credit_memo(parser, tmp_path):
    # Format B: Date, Transaction Type, Memo, Debit, Credit, Balance
    csv = "Date,Transaction Type,Memo,Debit,Credit,Balance\n2023-06-01,POS,Grocery Store,50.00,,4950\n2023-06-02,DEP,Transfer,,1000.00,5950"
    path = create_csv(tmp_path, csv)
    txns = parser.parse_csv(path)
    assert len(txns) == 2
    assert txns[0].amount == -50.00
    assert txns[1].amount == 1000.00

def test_format_c_process_date_value_currency(parser, tmp_path):
    # Format C: Process Date, User Name, Details, Value (Currency symbol, DD/MM/YYYY)
    csv = "Process Date,User Name,Details,Value\n31/12/2023,User1,Spotify,-£9.99\n01/01/2024,User1,Interest,+£0.50"
    path = create_csv(tmp_path, csv)
    txns = parser.parse_csv(path)
    assert len(txns) == 2
    assert txns[0].amount == -9.99
    assert txns[0].date == date(2023, 12, 31)
    assert txns[1].amount == 0.50
    assert txns[1].date == date(2024, 1, 1)

def test_format_d_time_merchant_withdrawal_deposit(parser, tmp_path):
    # Format D: Time, Merchant, Withdrawal, Deposit
    csv = "Time,Merchant,Withdrawal,Deposit\n2023-07-01 10:00:00,Starbucks,5.50,\n2023-07-01 12:00:00,Refund,,5.50"
    path = create_csv(tmp_path, csv)
    txns = parser.parse_csv(path)
    assert len(txns) == 2
    assert txns[0].amount == -5.50
    assert txns[1].amount == 5.50
    assert txns[0].description == "STARBUCKS"
