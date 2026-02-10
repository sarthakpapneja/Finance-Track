# Finance Intelligence AI

An advanced, AI-powered personal finance dashboard that provides deep insights into your financial health. Built with **React**, **FastAPI**, and **Machine Learning**, this application goes beyond simple tracking to offer predictive analytics, intelligent budgeting, and personalized financial advice.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Finance+Intelligence+Dashboard+Preview)

## 🚀 Features

- **📊 Interactive Dashboard**: Visualizes your income, expenses, and net worth trends.
- **🧠 AI-Driven Insights**: Get personalized financial advice and spending anomaly detection.
- **🔮 Predictive Analytics**: Forecast future balances and visualize potential financial scenarios.
- **💰 Smart Budgeting**: Set budgets for various categories and track your adherence.
- **🔒 Secure Data Handling**: Your financial data is processed securely and privately.
- **📂 CSV Import**: Easily import your bank statements for instant analysis.

## 🛠️ Tech Stack

- **Frontend**: React, Recharts, Tailwind CSS, Lucide React
- **Backend**: FastAPI, Python, SQLAlchemy, Pydantic
- **Data Science**: Pandas, Scikit-learn, NumPy
- **Database**: SQLite (Development)

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/sarthakpapneja/Finance-Track.git
    cd Finance-Track
    ```

2.  **Backend Setup:**

    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    ```

    The backend will be running at `http://localhost:8000`.

3.  **Frontend Setup:**

    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

    The frontend will be running at `http://localhost:5173`.

## 🚀 Deployment (Vercel)

This project is configured for deployment on [Vercel](https://vercel.com).

1.  Push the repository to GitHub.
2.  Import the project in Vercel.
3.  Vercel will automatically detect the configuration.

> **⚠️ IMPORTANT**: Vercel serverless functions are ephemeral. The local SQLite database (`finance_ai.db`) **will reset** on every deployment. For a production deployment, you **must connect a cloud database** (e.g., Vercel Postgres, Neon, or Supabase) by setting the `DATABASE_URL` environment variable.

## 📸 Screenshots

*(Add screenshots of your dashboard here)*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
