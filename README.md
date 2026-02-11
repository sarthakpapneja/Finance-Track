# 🚀 Finance Intelligence AI

<div align="center">

![Finance Intelligence AI Banner](https://via.placeholder.com/1200x400?text=Finance+Intelligence+Dashboard+Preview)

### *Redefining Personal Finance with Artificial Intelligence*

[![React](https://img.shields.io/badge/Frontend-React%2018-blue?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/AI-Python%203.9+-3776AB?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 🌟 Overview

**Finance Intelligence AI** is not just another expense tracker. It is a cutting-edge, **AI-powered financial assistant** designed to give you deep, actionable insights into your financial life. 

By leveraging machine learning models for **anomaly detection**, **spending forecasting**, and **personalized financial health scoring**, this application transforms raw transaction data into a clear roadmap for financial stability.

## ✨ Key Features

### 🧠 Advanced AI Analytics
- **Spending Forecaster**: Uses Prophet models to predict your future balance and spending trends.
- **Anomaly Detection**: Automatically flags unusual transactions and potential fraud.
- **Financial Health Score**: A dynamic 0-100 score that rates your financial stability in real-time.
- **Spending Personality**: Analyzes your habits to categorize you (e.g., "The Saver", "The Impulse Buyer").
- **Currency Selection**: Support for **USD ($), INR (₹), EUR (€), GBP (£), and JPY (¥)** with automatic formatting.
- **Runway Analysis**: Calculates exactly how long your money will last, with intelligent handling for net negative positions (Debt/Overdue).

### 📊 Interactive Dashboard
- **Real-time Visualization**: Dynamic charts for income vs. expenses, category breakdowns, and net worth.
- **Smart Budgeting**: Set monthly limits per category and get alerted when you're close to overspending.
- **Bill Reminders**: Never miss a payment with intelligent recurring bill tracking.
- **Goal Tracking**: visuals progress bars for your saving targets (e.g., "New Car", "Emergency Fund").

### 🔒 Secure & Private
- **User Isolation**: Strict data scoping ensures you only see your own financial data.
- **JWT Authentication**: Secure login and session management.
- **Local Data Control**: Your data stays on your machine (or your private cloud DB).

## 🛠️ Technology Stack

| Component | Tech | Description |
|-----------|------|-------------|
| **Frontend** | ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) | Interactive UI built with Vite, Tailwind CSS, and Recharts. |
| **Backend** | ![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white) | High-performance Python API handling data processing and AI. |
| **Database** | ![SQLite](https://img.shields.io/badge/-SQLite-003B57?logo=sqlite&logoColor=white) | Lightweight, serverless database for local development. |
| **ML/AI** | ![Scikit-Learn](https://img.shields.io/badge/-Scikit_Learn-F7931E?logo=scikit-learn&logoColor=white) | Powers the classification and anomaly detection models. |

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/sarthakpapneja/Finance-Track.git
    cd Finance-Track
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    
    # Start the server
    uvicorn app.main:app --reload
    ```
    *The API will handle database creation automatically on first run.*

3.  **Frontend Setup**
    ```bash
    cd ../frontend
    npm install
    
    # Start the development server
    npm run dev
    ```

4.  **Access the App**
    Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📂 Project Structure

```bash
Finance-Track/
├── backend/
│   ├── app/                # FastAPI application
│   │   ├── ml.py           # Machine Learning logic
│   │   ├── models.py       # Database schemas
│   │   └── main.py         # API endpoints
│   └── finance_ai.db       # Local database
├── frontend/
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── api.js          # API client
│   │   └── App.jsx         # Main dashboard logic
│   └── public/
└── ml_service/             # Training scripts for ML models
```

## 🔮 Future Roadmap

- [ ] **Mobile App**: React Native version for iOS/Android.
- [ ] **Bank Sync**: Integration with Plaid for automatic transaction fetching.
- [ ] **Investment Tracking**: Real-time stock and crypto portfolio monitoring.
- [ ] **Investment Tracking**: Real-time stock and crypto portfolio monitoring.
- [x] **Multi-Currency Support**: Automatic formatting for international transactions.

## 🤝 Contributing

We welcome contributions! Please fork the repository and submit a pull request for any features or bug fixes.

---

<div align="center">
  <sub>Built with ❤️ by Sarthak Papneja</sub>
</div>
