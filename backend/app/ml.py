import pickle
import os
import pandas as pd
import numpy as np
from typing import List, Dict, Any

class MLService:
    def __init__(self, model_dir: str = "ml_service/models"):
        self.model_dir = model_dir
        self.classifier = None
        self.tfidf = None
        self.label_encoder = None
        self.forecaster = None
        self.anomaly_detector = None
        
    def load_models(self):
        print("Loading ML models...")
        try:
            with open(os.path.join(self.model_dir, 'classifier_model.pkl'), 'rb') as f:
                self.classifier = pickle.load(f)
            with open(os.path.join(self.model_dir, 'tfidf.pkl'), 'rb') as f:
                self.tfidf = pickle.load(f)
            with open(os.path.join(self.model_dir, 'label_encoder.pkl'), 'rb') as f:
                self.label_encoder = pickle.load(f)
            # Prophet model loading
            with open(os.path.join(self.model_dir, 'prophet_model.pkl'), 'rb') as f:
                self.forecaster = pickle.load(f)
            # Anomaly detector loading
            with open(os.path.join(self.model_dir, 'anomaly_model.pkl'), 'rb') as f:
                self.anomaly_detector = pickle.load(f)
            print("ML models loaded successfully.")
        except Exception as e:
            print(f"Error loading models: {e}")
            # Non-critical for app startup, but ML features won't work
            
    def predict_category(self, description: str, amount: float) -> str:
        if not self.classifier or not self.tfidf:
            return "Uncategorized"
            
        try:
            # Preprocess
            text_vec = self.tfidf.transform([description]).toarray()
            features = np.hstack((text_vec, [[amount]]))
            
            # Predict
            cat_idx = self.classifier.predict(features)[0]
            category = self.label_encoder.inverse_transform([cat_idx])[0]
            return category
        except Exception as e:
            print(f"Prediction error: {e}")
            return "Uncategorized"

    def detect_anomaly(self, amount: float) -> bool:
        if not self.anomaly_detector:
            return False
        
        try:
            # Isolation Forest returns -1 for anomaly, 1 for normal
            prediction = self.anomaly_detector.predict([[amount]])[0]
            return prediction == -1
        except Exception as e:
            print(f"Anomaly detection error: {e}")
            return False

    def forecast_balance(self, transactions: List[Any], days: int = 30) -> List[Dict[str, Any]]:
        """
        Generates a simple linear forecast based on transaction history.
        """
        if not transactions:
            return []
            
        try:
            # Convert to DataFrame
            data = [{'date': t.date, 'amount': t.amount} for t in transactions]
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            
            # Group by date and sum amounts
            daily_net = df.groupby('date')['amount'].sum().sort_index()
            
            # Calculate cumulative balance
            # Assuming starting balance is 0 or implicit in transactions (opening balance)
            daily_balance = daily_net.cumsum()
            
            if daily_balance.empty:
                return []

            # Get last known balance and date
            last_date = daily_balance.index[-1]
            last_balance = daily_balance.iloc[-1]
            
            # Calculate average daily change (trend)
            # Use last 90 days or all data if less
            start_date = daily_balance.index[0]
            days_diff = (last_date - start_date).days
            total_change = last_balance - daily_balance.iloc[0]
            
            daily_trend = 0
            if days_diff > 0:
                daily_trend = total_change / days_diff
            
            # Generate forecast
            forecast_data = []
            for i in range(1, days + 1):
                future_date = last_date + pd.Timedelta(days=i)
                future_balance = last_balance + (daily_trend * i)
                
                forecast_data.append({
                    'ds': future_date.isoformat(),
                    'yhat': future_balance,
                    'yhat_lower': future_balance * 0.95, # Simple confidence intervals
                    'yhat_upper': future_balance * 1.05
                })
                
            return forecast_data

        except Exception as e:
            print(f"Forecasting error: {e}")
            return []

    def calculate_analytics_summary(self, transactions: List[Any], current_balance: float = None) -> Dict[str, Any]:
        """
        Calculate comprehensive analytics: burn rate, days until broke, health score, etc.
        """
        if not transactions:
            return {
                'burn_rate_daily': 0,
                'burn_rate_monthly': 0,
                'days_until_broke': None,
                'health_score': 0,
                'savings_rate': 0,
                'total_income': 0,
                'total_expenses': 0
            }
        
        try:
            data = [{'date': t.date, 'amount': t.amount} for t in transactions]
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            
            # Calculate income and expenses
            total_income = df[df['amount'] > 0]['amount'].sum()
            total_expenses = abs(df[df['amount'] < 0]['amount'].sum())
            
            # Date range
            date_range = (df['date'].max() - df['date'].min()).days or 1
            
            # Burn rate (daily average spending)
            burn_rate_daily = total_expenses / date_range if date_range > 0 else 0
            burn_rate_monthly = burn_rate_daily * 30
            
            # Current balance (estimate from transactions if not provided)
            if current_balance is None:
                current_balance = df['amount'].sum()
            
            # Days until broke
            days_until_broke = None
            if burn_rate_daily > 0 and current_balance > 0:
                days_until_broke = int(current_balance / burn_rate_daily)
            
            # Savings rate
            savings_rate = 0
            if total_income > 0:
                savings_rate = ((total_income - total_expenses) / total_income) * 100
            
            # Financial Health Score (0-100)
            health_score = self._calculate_health_score(
                savings_rate, 
                burn_rate_monthly, 
                total_income, 
                days_until_broke
            )
            
            return {
                'burn_rate_daily': round(burn_rate_daily, 2),
                'burn_rate_monthly': round(burn_rate_monthly, 2),
                'days_until_broke': days_until_broke,
                'health_score': health_score,
                'savings_rate': round(savings_rate, 1),
                'total_income': round(total_income, 2),
                'total_expenses': round(total_expenses, 2),
                'current_balance': round(current_balance, 2)
            }
            
        except Exception as e:
            print(f"Analytics calculation error: {e}")
            return {'error': str(e)}

    def _calculate_health_score(self, savings_rate: float, burn_rate_monthly: float, 
                                 total_income: float, days_until_broke: int) -> int:
        """
        Calculate a 0-100 financial health score.
        """
        score = 50  # Base score
        
        # Savings rate component (max +30 points)
        if savings_rate >= 20:
            score += 30
        elif savings_rate >= 10:
            score += 20
        elif savings_rate >= 0:
            score += 10
        else:
            score -= 20  # Negative savings = spending more than earning
        
        # Days until broke component (max +20 points)
        if days_until_broke is not None:
            if days_until_broke >= 180:
                score += 20
            elif days_until_broke >= 90:
                score += 15
            elif days_until_broke >= 30:
                score += 5
            else:
                score -= 15  # Less than a month = concerning
        
        return max(0, min(100, score))

    def detect_subscriptions(self, transactions: List[Any]) -> List[Dict[str, Any]]:
        """
        Detect recurring subscriptions by finding transactions with similar amounts
        and descriptions that repeat monthly.
        """
        if not transactions:
            return []
        
        try:
            data = [{'date': t.date, 'description': t.description, 'amount': t.amount} 
                    for t in transactions if t.amount < 0]  # Only expenses
            df = pd.DataFrame(data)
            
            if df.empty:
                return []
            
            # Group by description and amount, count occurrences
            grouped = df.groupby(['description', 'amount']).size().reset_index(name='count')
            
            # Filter for recurring (2+ occurrences)
            recurring = grouped[grouped['count'] >= 2]
            
            subscriptions = []
            for _, row in recurring.iterrows():
                subscriptions.append({
                    'name': row['description'],
                    'amount': abs(row['amount']),
                    'frequency': 'Monthly' if row['count'] >= 2 else 'One-time',
                    'occurrences': int(row['count'])
                })
            
            # Sort by amount descending
            subscriptions.sort(key=lambda x: x['amount'], reverse=True)
            return subscriptions
            
        except Exception as e:
            print(f"Subscription detection error: {e}")
            return []

    def detect_income_patterns(self, transactions: List[Any]) -> List[Dict[str, Any]]:
        """
        Detect regular income patterns (salary, recurring deposits).
        """
        if not transactions:
            return []
        
        try:
            data = [{'date': t.date, 'description': t.description, 'amount': t.amount} 
                    for t in transactions if t.amount > 0]  # Only income
            df = pd.DataFrame(data)
            
            if df.empty:
                return []
            
            # Group by description (common source)
            grouped = df.groupby('description').agg({
                'amount': ['mean', 'count', 'sum']
            }).reset_index()
            grouped.columns = ['source', 'avg_amount', 'count', 'total']
            
            # Filter for recurring (2+ occurrences)
            recurring = grouped[grouped['count'] >= 1]
            
            income_patterns = []
            for _, row in recurring.iterrows():
                income_patterns.append({
                    'source': row['source'],
                    'avg_amount': round(row['avg_amount'], 2),
                    'frequency': 'Regular' if row['count'] >= 2 else 'One-time',
                    'occurrences': int(row['count']),
                    'total': round(row['total'], 2)
                })
            
            # Sort by total descending
            income_patterns.sort(key=lambda x: x['total'], reverse=True)
            return income_patterns
            
        except Exception as e:
            print(f"Income pattern detection error: {e}")
            return []

    def project_savings(self, transactions: List[Any], months: int = 12) -> List[Dict[str, Any]]:
        """
        Project savings growth based on current savings rate.
        """
        if not transactions:
            return []
        
        try:
            data = [{'date': t.date, 'amount': t.amount} for t in transactions]
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            
            total_income = df[df['amount'] > 0]['amount'].sum()
            total_expenses = abs(df[df['amount'] < 0]['amount'].sum())
            
            date_range = (df['date'].max() - df['date'].min()).days or 30
            months_of_data = date_range / 30
            
            monthly_income = total_income / months_of_data if months_of_data > 0 else 0
            monthly_expenses = total_expenses / months_of_data if months_of_data > 0 else 0
            monthly_savings = monthly_income - monthly_expenses
            
            current_balance = df['amount'].sum()
            
            projections = []
            for i in range(months + 1):
                projected_date = df['date'].max() + pd.DateOffset(months=i)
                projected_balance = current_balance + (monthly_savings * i)
                
                projections.append({
                    'month': projected_date.strftime('%Y-%m'),
                    'projected_balance': round(projected_balance, 2),
                    'monthly_savings': round(monthly_savings, 2)
                })
            
            return projections
            
        except Exception as e:
            print(f"Savings projection error: {e}")
            return []

    def get_investment_suggestions(self, analytics_summary: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Provide basic investment suggestions based on financial health.
        """
        suggestions = []
        
        savings_rate = analytics_summary.get('savings_rate', 0)
        days_until_broke = analytics_summary.get('days_until_broke')
        health_score = analytics_summary.get('health_score', 50)
        current_balance = analytics_summary.get('current_balance', 0)
        
        # Emergency fund advice
        if days_until_broke is not None and days_until_broke < 90:
            suggestions.append({
                'priority': 'High',
                'title': 'Build Emergency Fund',
                'description': 'Your runway is less than 3 months. Focus on building a 3-6 month emergency fund before investing.'
            })
        
        # Savings rate advice
        if savings_rate < 10:
            suggestions.append({
                'priority': 'High',
                'title': 'Increase Savings Rate',
                'description': 'Try to save at least 10-20% of your income. Review subscriptions and discretionary spending.'
            })
        elif savings_rate >= 20:
            suggestions.append({
                'priority': 'Medium',
                'title': 'Consider Investing',
                'description': 'Your savings rate is healthy! Consider low-cost index funds or a high-yield savings account.'
            })
        
        # Balance-based suggestions
        if current_balance > 5000 and health_score >= 60:
            suggestions.append({
                'priority': 'Low',
                'title': 'Explore Investment Options',
                'description': 'With a stable balance, consider diversifying into stocks, bonds, or retirement accounts.'
            })
        
        if not suggestions:
            suggestions.append({
                'priority': 'Info',
                'title': 'Keep It Up!',
                'description': 'Your finances look stable. Continue monitoring and building your financial cushion.'
            })
        
        return suggestions

    # ===== PHASE 2: NEW FEATURES =====
    
    def predict_salary(self, transactions: List[Any]) -> Dict[str, Any]:
        """
        Predict next salary date, expected amount, and detect delays.
        """
        if not transactions:
            return {'error': 'No transaction data'}
        
        try:
            # Filter income transactions
            data = [{'date': t.date, 'description': t.description, 'amount': t.amount} 
                    for t in transactions if t.amount > 0]
            df = pd.DataFrame(data)
            
            if df.empty:
                return {'error': 'No income transactions found'}
            
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            # Find the largest recurring income (likely salary)
            income_grouped = df.groupby('description').agg({
                'amount': ['mean', 'count', 'std'],
                'date': list
            }).reset_index()
            income_grouped.columns = ['source', 'avg_amount', 'count', 'std', 'dates']
            
            # Find most likely salary (regular, large amounts)
            recurring = income_grouped[income_grouped['count'] >= 2].copy()
            if recurring.empty:
                return {'error': 'No recurring income pattern detected'}
            
            # Pick the highest recurring income
            salary_row = recurring.loc[recurring['avg_amount'].idxmax()]
            
            # Calculate average interval between payments
            dates = sorted(salary_row['dates'])
            intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
            avg_interval = sum(intervals) / len(intervals) if intervals else 30
            
            last_date = max(dates)
            next_date = last_date + pd.Timedelta(days=avg_interval)
            today = pd.Timestamp.now()
            
            # Check if delayed
            is_delayed = today > next_date
            days_late = (today - next_date).days if is_delayed else 0
            
            return {
                'source': salary_row['source'],
                'expected_amount': round(salary_row['avg_amount'], 2),
                'next_date': next_date.isoformat()[:10],
                'last_date': last_date.isoformat()[:10],
                'avg_interval_days': round(avg_interval, 1),
                'is_delayed': is_delayed,
                'days_late': max(0, days_late),
                'confidence': min(100, int(salary_row['count'] * 15))
            }
            
        except Exception as e:
            print(f"Salary prediction error: {e}")
            return {'error': str(e)}

    def generate_smart_budget(self, transactions: List[Any], 
                               goals: List[Any] = None) -> Dict[str, Any]:
        """
        Auto-generate monthly budget based on spending patterns and goals.
        """
        if not transactions:
            return {'category_budgets': {}, 'savings_target': 0, 'total_budget': 0}
        
        try:
            data = [{'date': t.date, 'category': t.category or 'Other', 'amount': t.amount} 
                    for t in transactions]
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            
            # Calculate monthly averages per category
            expenses = df[df['amount'] < 0].copy()
            expenses['amount'] = expenses['amount'].abs()
            
            date_range = (df['date'].max() - df['date'].min()).days or 30
            months = max(1, date_range / 30)
            
            category_totals = expenses.groupby('category')['amount'].sum()
            category_monthly = (category_totals / months).to_dict()
            
            # Apply budget optimization (slightly reduce discretionary spending)
            discretionary = ['Entertainment', 'Shopping', 'Food', 'Travel']
            category_budgets = {}
            for cat, amount in category_monthly.items():
                if cat in discretionary:
                    # Suggest 10% reduction
                    category_budgets[cat] = round(amount * 0.9, 2)
                else:
                    # Keep essentials as-is with 5% buffer
                    category_budgets[cat] = round(amount * 1.05, 2)
            
            total_budget = sum(category_budgets.values())
            
            # Calculate income and savings target
            income = df[df['amount'] > 0]['amount'].sum()
            monthly_income = income / months
            savings_target = max(0, round(monthly_income * 0.2, 2))  # Target 20% savings
            
            # Adjust for goals
            goal_savings_needed = 0
            if goals:
                for goal in goals:
                    remaining = goal.target_amount - goal.current_saved
                    deadline = pd.to_datetime(goal.deadline)
                    months_left = max(1, (deadline - pd.Timestamp.now()).days / 30)
                    goal_savings_needed += remaining / months_left
            
            return {
                'category_budgets': category_budgets,
                'suggested_savings': max(savings_target, round(goal_savings_needed, 2)),
                'total_budget': round(total_budget, 2),
                'monthly_income': round(monthly_income, 2),
                'recommended_monthly': round(monthly_income - savings_target, 2)
            }
            
        except Exception as e:
            print(f"Smart budget error: {e}")
            return {'error': str(e)}

    def simulate_purchase(self, amount: float, transactions: List[Any], 
                           months: int = 6) -> Dict[str, Any]:
        """
        Simulate the impact of a large purchase on finances.
        """
        if not transactions:
            return {'error': 'No transaction data'}
        
        try:
            data = [{'date': t.date, 'amount': t.amount} for t in transactions]
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            
            current_balance = df['amount'].sum()
            
            # Calculate monthly savings rate
            date_range = (df['date'].max() - df['date'].min()).days or 30
            months_of_data = max(1, date_range / 30)
            
            total_income = df[df['amount'] > 0]['amount'].sum()
            total_expenses = abs(df[df['amount'] < 0]['amount'].sum())
            monthly_savings = (total_income - total_expenses) / months_of_data
            
            # Calculate current health score
            analytics = self.calculate_analytics_summary(transactions)
            current_score = analytics.get('health_score', 50)
            
            # After purchase
            new_balance = current_balance - amount
            
            # Time to recover the amount
            recovery_months = amount / monthly_savings if monthly_savings > 0 else float('inf')
            
            # Project future balance with purchase
            projections = []
            for i in range(months + 1):
                balance_without = current_balance + (monthly_savings * i)
                balance_with = new_balance + (monthly_savings * i)
                projections.append({
                    'month': i,
                    'without_purchase': round(balance_without, 2),
                    'with_purchase': round(balance_with, 2)
                })
            
            # Impact on health score (rough estimate)
            new_days_until_broke = new_balance / analytics.get('burn_rate_daily', 1) if analytics.get('burn_rate_daily', 0) > 0 else None
            
            score_impact = 0
            if new_balance < 0:
                score_impact = -30
            elif new_days_until_broke and new_days_until_broke < 30:
                score_impact = -20
            elif new_days_until_broke and new_days_until_broke < 90:
                score_impact = -10
            elif amount > current_balance * 0.5:
                score_impact = -5
            
            return {
                'purchase_amount': amount,
                'current_balance': round(current_balance, 2),
                'balance_after': round(new_balance, 2),
                'monthly_savings': round(monthly_savings, 2),
                'recovery_days': round(recovery_months * 30, 0) if recovery_months != float('inf') else None,
                'health_score_before': current_score,
                'health_score_after': max(0, current_score + score_impact),
                'can_afford': new_balance > 0,
                'projections': projections,
                'verdict': 'Affordable' if new_balance > current_balance * 0.3 else 'Risky' if new_balance > 0 else 'Not Recommended',
                'impact_message': f"This will take about {round(recovery_months * 30, 0)} days to recover based on your current savings rate." if recovery_months != float('inf') else "You currently have a negative savings rate; recovering this amount will be difficult."
            }
            
        except Exception as e:
            print(f"Purchase simulation error: {e}")
            return {'error': str(e)}

    def detect_emergencies(self, transactions: List[Any]) -> Dict[str, Any]:
        """
        Detect financial emergencies: unusual large spends, income drops, sudden bills.
        """
        if not transactions:
            return {'alerts': [], 'suggested_cutbacks': [], 'recovery_days': 0}
        
        try:
            data = [{'date': t.date, 'description': t.description, 
                     'amount': t.amount, 'category': t.category or 'Other'} 
                    for t in transactions]
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            alerts = []
            
            # 1. Detect unusually large expenses (>3 std from mean)
            expenses = df[df['amount'] < 0]['amount'].abs()
            if len(expenses) > 5:
                mean_expense = expenses.mean()
                std_expense = expenses.std()
                threshold = mean_expense + (3 * std_expense)
                
                large_expenses = df[(df['amount'] < 0) & (df['amount'].abs() > threshold)]
                for _, row in large_expenses.iterrows():
                    if 'hospital' in row['description'].lower() or \
                       'medical' in row['description'].lower() or \
                       'emergency' in row['description'].lower() or \
                       row['category'] == 'Health':
                        alerts.append({
                            'type': 'medical_emergency',
                            'severity': 'high',
                            'description': f"Large medical expense detected: ${abs(row['amount']):.2f}",
                            'date': row['date'].isoformat()[:10],
                            'amount': abs(row['amount'])
                        })
                    else:
                        alerts.append({
                            'type': 'unusual_expense',
                            'severity': 'medium',
                            'description': f"Unusually large expense: {row['description']} (${abs(row['amount']):.2f})",
                            'date': row['date'].isoformat()[:10],
                            'amount': abs(row['amount'])
                        })
            
            # 2. Detect income drops (compare last month to previous average)
            income = df[df['amount'] > 0].copy()
            if len(income) > 3:
                income['month'] = income['date'].dt.to_period('M')
                monthly_income = income.groupby('month')['amount'].sum()
                
                if len(monthly_income) >= 2:
                    avg_income = monthly_income[:-1].mean()
                    last_income = monthly_income.iloc[-1]
                    
                    if last_income < avg_income * 0.7:  # 30% drop
                        alerts.append({
                            'type': 'income_drop',
                            'severity': 'high',
                            'description': f"Income dropped {((avg_income - last_income) / avg_income * 100):.0f}% compared to average",
                            'expected': round(avg_income, 2),
                            'actual': round(last_income, 2)
                        })
            
            # 3. Suggest cutbacks based on discretionary spending
            suggested_cutbacks = []
            discretionary = df[(df['amount'] < 0) & 
                              (df['category'].isin(['Entertainment', 'Shopping', 'Food', 'Travel']))]
            
            if not discretionary.empty:
                category_spending = discretionary.groupby('category')['amount'].sum().abs()
                for cat, spending in category_spending.items():
                    suggested_cutbacks.append({
                        'category': cat,
                        'current_spending': round(spending, 2),
                        'suggested_reduction': round(spending * 0.3, 2),
                        'savings_potential': round(spending * 0.3, 2)
                    })
            
            # 4. Calculate recovery days
            current_balance = df['amount'].sum()
            daily_savings = (df[df['amount'] > 0]['amount'].sum() - abs(df[df['amount'] < 0]['amount'].sum())) / max(1, (df['date'].max() - df['date'].min()).days)
            
            total_emergency_cost = sum(a.get('amount', 0) for a in alerts if a.get('type') in ['medical_emergency', 'unusual_expense'])
            recovery_days = int(total_emergency_cost / daily_savings) if daily_savings > 0 and total_emergency_cost > 0 else 0
            
            return {
                'alerts': alerts,
                'suggested_cutbacks': suggested_cutbacks,
                'recovery_days': recovery_days,
                'current_balance': round(current_balance, 2),
                'has_emergency': len([a for a in alerts if a.get('severity') == 'high']) > 0
            }
            
        except Exception as e:
            print(f"Emergency detection error: {e}")
            return {'error': str(e)}

    def analyze_spending_personality(self, transactions: List[Any]) -> Dict[str, Any]:
        """
        Classify user's spending personality type using transaction patterns.
        """
        if not transactions:
            return {'personality_type': 'Unknown', 'traits': [], 'confidence': 0}
        
        try:
            data = [{'date': t.date, 'amount': t.amount, 'category': t.category or 'Other'} 
                    for t in transactions]
            df = pd.DataFrame(data)
            df['date'] = pd.to_datetime(df['date'])
            
            # Calculate key metrics
            total_income = df[df['amount'] > 0]['amount'].sum()
            total_expenses = abs(df[df['amount'] < 0]['amount'].sum())
            savings_rate = (total_income - total_expenses) / total_income * 100 if total_income > 0 else 0
            
            # Spending variability (impulsiveness indicator)
            expenses = df[df['amount'] < 0]['amount'].abs()
            spending_cv = (expenses.std() / expenses.mean() * 100) if len(expenses) > 1 and expenses.mean() > 0 else 0
            
            # Category diversity
            expense_df = df[df['amount'] < 0]
            category_counts = expense_df['category'].value_counts()
            top_category_pct = (category_counts.iloc[0] / len(expense_df) * 100) if len(category_counts) > 0 else 0
            
            # Investment-like transactions (placeholder - recurring positive unusual patterns)
            has_investments = any(
                'invest' in str(t.description).lower() or 
                'dividend' in str(t.description).lower() or
                'stock' in str(t.description).lower()
                for t in transactions
            )
            
            # Classify personality
            traits = []
            personality_scores = {
                'Impulsive Spender': 0,
                'Saver': 0,
                'Investor': 0,
                'Chaotic Neutral': 0
            }
            
            # Saver indicators
            if savings_rate >= 20:
                personality_scores['Saver'] += 40
                traits.append('High savings discipline')
            if savings_rate >= 10:
                personality_scores['Saver'] += 20
                traits.append('Consistent saver')
            
            # Impulsive spender indicators
            if spending_cv > 100:
                personality_scores['Impulsive Spender'] += 30
                traits.append('Variable spending patterns')
            if savings_rate < 5:
                personality_scores['Impulsive Spender'] += 25
                traits.append('Spends most income')
            if top_category_pct < 30:
                personality_scores['Impulsive Spender'] += 15
                traits.append('Diverse spending categories')
            
            # Investor indicators  
            if has_investments:
                personality_scores['Investor'] += 40
                traits.append('Has investment activity')
            if savings_rate >= 30:
                personality_scores['Investor'] += 20
                traits.append('High savings potential')
            
            # Chaotic neutral (mixed signals)
            if 40 < spending_cv < 80 and 5 < savings_rate < 15:
                personality_scores['Chaotic Neutral'] += 35
                traits.append('Unpredictable patterns')
            
            # Get personality type
            personality_type = max(personality_scores, key=personality_scores.get)
            confidence = min(95, max(25, personality_scores[personality_type]))
            
            # Add personality-specific traits
            personality_traits = {
                'Impulsive Spender': ['Spontaneous purchases', 'Lives in the moment', 'Retail therapy fan'],
                'Saver': ['Budget conscious', 'Future-focused', 'Values security'],
                'Investor': ['Growth mindset', 'Long-term thinker', 'Active wealth builder'],
                'Chaotic Neutral': ['Unpredictable', 'Goes with the flow', 'Balance seeker']
            }
            
            return {
                'personality_type': personality_type,
                'traits': list(set(traits + personality_traits.get(personality_type, [])[:2])),
                'confidence': confidence,
                'savings_rate': round(savings_rate, 1),
                'spending_variability': round(spending_cv, 1),
                'emoji': {'Impulsive Spender': '🛒', 'Saver': '🐿️', 'Investor': '📈', 'Chaotic Neutral': '🎲'}.get(personality_type, '❓')
            }
            
        except Exception as e:
            print(f"Personality analysis error: {e}")
            return {'error': str(e)}

    def plan_goal(self, target_amount: float, deadline: str, 
                  transactions: List[Any], current_saved: float = 0) -> Dict[str, Any]:
        """
        Calculate goal feasibility and create an action plan.
        """
        try:
            today = pd.Timestamp.now()
            deadline_date = pd.to_datetime(deadline)
            
            remaining_amount = target_amount - current_saved
            months_left = max(1, (deadline_date - today).days / 30)
            
            monthly_needed = remaining_amount / months_left
            
            # Get current savings capacity
            if transactions:
                data = [{'date': t.date, 'amount': t.amount} for t in transactions]
                df = pd.DataFrame(data)
                df['date'] = pd.to_datetime(df['date'])
                
                date_range = (df['date'].max() - df['date'].min()).days or 30
                months_of_data = max(1, date_range / 30)
                
                total_income = df[df['amount'] > 0]['amount'].sum()
                total_expenses = abs(df[df['amount'] < 0]['amount'].sum())
                current_monthly_savings = (total_income - total_expenses) / months_of_data
            else:
                current_monthly_savings = 0
            
            # Calculate feasibility
            is_achievable = current_monthly_savings >= monthly_needed
            shortfall = max(0, monthly_needed - current_monthly_savings)
            
            # Calculate realistic timeline
            realistic_months = remaining_amount / current_monthly_savings if current_monthly_savings > 0 else float('inf')
            realistic_date = today + pd.DateOffset(months=int(realistic_months)) if realistic_months != float('inf') else None
            
            # Suggestions
            suggestions = []
            if not is_achievable:
                if shortfall < current_monthly_savings * 0.2:
                    suggestions.append(f"Cut discretionary spending by ${shortfall:.2f}/month")
                elif shortfall < current_monthly_savings * 0.5:
                    suggestions.append("Consider reducing entertainment and dining out")
                    suggestions.append(f"Find additional income of ${shortfall:.2f}/month")
                else:
                    suggestions.append("Goal may need to be adjusted or timeline extended")
                    if realistic_date:
                        suggestions.append(f"Realistic target date: {realistic_date.strftime('%B %Y')}")
            else:
                suggestions.append("Goal is achievable with current savings rate!")
                if current_monthly_savings > monthly_needed * 1.5:
                    suggestions.append("You could reach this goal ahead of schedule")
            
            # Create milestone projections
            milestones = []
            for pct in [25, 50, 75, 100]:
                milestone_amount = target_amount * (pct / 100)
                months_to_milestone = (milestone_amount - current_saved) / current_monthly_savings if current_monthly_savings > 0 else None
                if months_to_milestone and months_to_milestone > 0:
                    milestone_date = today + pd.DateOffset(months=int(months_to_milestone))
                    milestones.append({
                        'percentage': pct,
                        'amount': round(milestone_amount, 2),
                        'estimated_date': milestone_date.strftime('%Y-%m-%d')
                    })
            
            return {
                'target_amount': target_amount,
                'current_saved': current_saved,
                'remaining': round(remaining_amount, 2),
                'deadline': deadline,
                'months_left': round(months_left, 1),
                'monthly_savings_needed': round(monthly_needed, 2),
                'current_monthly_savings': round(current_monthly_savings, 2),
                'is_achievable': is_achievable,
                'shortfall': round(shortfall, 2),
                'realistic_months': round(realistic_months, 1) if realistic_months != float('inf') else None,
                'suggestions': suggestions,
                'milestones': milestones,
                'progress_percentage': round((current_saved / target_amount) * 100, 1) if target_amount > 0 else 0
            }
            
        except Exception as e:
            print(f"Goal planning error: {e}")
            return {'error': str(e)}

# Singleton instance
ml_service = MLService()
