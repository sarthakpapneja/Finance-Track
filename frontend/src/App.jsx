import { useState, useEffect } from 'react';
import { api } from './api';
import { Upload, AlertTriangle, TrendingUp, DollarSign, Pencil, Trash2, CheckCircle, XCircle, Wallet, Search, Calendar, ArrowUpRight, ArrowDownRight, PiggyBank, RefreshCw, Clock, Heart, CreditCard, Bell, Lightbulb, Plus, Target, Sparkles, AlertCircle, User, X, Activity, FileText, PieChart as PieChartIcon, Zap, ShieldCheck, Lock, LogOut, Eye, EyeOff, Mail, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend, LineChart, Line } from 'recharts';

function App() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(api.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(api.getStoredUser());
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '', email: '', full_name: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // App State (must be declared before early return to satisfy React Rules of Hooks)
  const [transactions, setTransactions] = useState([]);
  const [spending, setSpending] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgets, setBudgets] = useState([]);
  const [newBudget, setNewBudget] = useState({ category: '', amount: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [editingBudget, setEditingBudget] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());

  // Currency State
  const [currency, setCurrency] = useState(localStorage.getItem('finance_ai_currency') || 'USD');
  const CURRENCY_CONFIG = {
    USD: { symbol: '$', locale: 'en-US', name: 'US Dollar' },
    INR: { symbol: '₹', locale: 'en-IN', name: 'Indian Rupee' },
    EUR: { symbol: '€', locale: 'de-DE', name: 'Euro' },
    GBP: { symbol: '£', locale: 'en-GB', name: 'British Pound' },
    JPY: { symbol: '¥', locale: 'ja-JP', name: 'Japanese Yen' }
  };

  useEffect(() => {
    localStorage.setItem('finance_ai_currency', currency);
  }, [currency]);

  const formatMoney = (amount) => {
    const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
    return `${config.symbol}${Number(amount).toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Advanced Analytics State
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [incomePatterns, setIncomePatterns] = useState([]);
  const [savingsProjection, setSavingsProjection] = useState([]);
  const [billReminders, setBillReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({ name: '', amount: '', due_day: '', category: '' });
  const [uploadedStatements, setUploadedStatements] = useState([]);
  const [selectedStatements, setSelectedStatements] = useState(new Set());

  // Phase 2: Advanced Analytics State
  const [goals, setGoals] = useState([]);
  const [emergencies, setEmergencies] = useState(null);
  const [spendingPersonality, setSpendingPersonality] = useState(null);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', deadline: '' });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTransaction, setManualTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
    source: 'manual'
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Delete',
    type: 'danger'
  });

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const result = await api.login({ username: authForm.username, password: authForm.password });
        setCurrentUser(result.user);
      } else {
        const result = await api.register(authForm);
        setCurrentUser(result.user);
      }
      setIsLoggedIn(true);
      setAuthForm({ username: '', password: '', email: '', full_name: '' });
    } catch (error) {
      setAuthError(error.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAuthMode('login');
    // Clear all data state to prevent stale data from showing for next user
    setTransactions([]);
    setSpending([]);
    setForecast([]);
    setBudgets([]);
    setAnalyticsSummary(null);
    setSubscriptions([]);
    setIncomePatterns([]);
    setSavingsProjection([]);
    setBillReminders([]);
    setUploadedStatements([]);
    setSelectedStatements(new Set());
    setGoals([]);
    setEmergencies(null);
    setSpendingPersonality(null);
  };




  const confirmDelete = (title, message, onConfirm, confirmText = 'Delete') => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm,
      confirmText,
      type: 'danger'
    });
  };
  const totalIncome = (transactions || []).filter(t => t && t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = (transactions || []).filter(t => t && t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netBalance = totalIncome - totalExpenses;
  const filteredTransactions = (transactions || []).filter(t => {
    if (!t) return false;
    const desc = (t.description || '').toLowerCase();
    const cat = (t.category || '').toLowerCase();
    const search = (searchTerm || '').toLowerCase();
    return desc.includes(search) || cat.includes(search);
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

  // Refetch when statement filter changes
  useEffect(() => {
    fetchData(Array.from(selectedStatements));
  }, [selectedStatements]);

  const fetchData = async (statementIds = []) => {
    try {
      // Parallel fetch for speed
      const [txns, spendingData, forecastData, budgetData, analyticsData, subsData, incomeData, savingsData, reminders] = await Promise.all([
        api.getTransactions(statementIds),
        api.getSpendingBreakdown(),
        api.getForecast(),
        api.getBudgets(),
        api.getAnalyticsSummary().catch(() => null),
        api.getSubscriptions().catch(() => []),
        api.getIncomePatterns().catch(() => []),
        api.getSavingsProjection().catch(() => []),
        api.getBillReminders().catch(() => [])
      ]);

      setTransactions(txns);

      const spendingChart = Object.keys(spendingData).map(key => ({
        name: key,
        value: spendingData[key]
      }));
      setSpending(spendingChart);

      setForecast(forecastData);
      setBudgets(budgetData);

      // Set new analytics data
      if (analyticsData) setAnalyticsSummary(analyticsData);
      setSubscriptions(subsData);
      setIncomePatterns(incomeData);
      setSavingsProjection(savingsData);
      setBillReminders(reminders);

      // Fetch statements separately (new table may not exist yet)
      try {
        const stmts = await api.getStatements();
        setUploadedStatements(stmts);
      } catch (e) {
        console.log("Statements not available yet");
      }

      // Phase 2: Fetch new analytics data
      try {
        const [goalsData, emergencyData, personalityData] = await Promise.all([
          api.getGoals().catch(() => []),
          api.getEmergencies().catch(() => null),
          api.getSpendingPersonality().catch(() => null)
        ]);
        setGoals(goalsData);
        setEmergencies(emergencyData);
        setSpendingPersonality(personalityData);
      } catch (e) {
        console.log("Phase 2 analytics not available yet");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await api.uploadStatement(file);
      await fetchData(); // Refresh data
      const transactionCount = result.transactions_count || result.transactions?.length || result.length || 0;
      showToast(`Successfully imported ${transactionCount} transactions!`, 'success');
    } catch (error) {
      console.error("Upload error:", error);
      showToast(`Failed to upload: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!newBudget.category || !newBudget.amount) return;

    try {
      await api.saveBudget({
        category: newBudget.category,
        amount: parseFloat(newBudget.amount)
      });
      setNewBudget({ category: '', amount: '' });
      setEditingBudget(null);
      fetchData();
      showToast('Budget saved successfully!');
    } catch (error) {
      console.error("Error saving budget:", error);
      showToast('Failed to save budget', 'error');
    }
  };

  const handleEditBudget = (budget) => {
    setNewBudget({ category: budget.category, amount: budget.amount.toString() });
    setEditingBudget(budget.id);
  };

  const handleDeleteBudget = (budgetId) => {
    confirmDelete(
      'Delete Budget',
      'Are you sure you want to delete this budget category? This will not delete your transactions, but you will lose the budget tracking for this category.',
      async () => {
        try {
          await api.deleteBudget(budgetId);
          fetchData();
          showToast('Budget deleted successfully!');
        } catch (error) {
          console.error("Error deleting budget:", error);
          showToast('Failed to delete budget', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    );
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction({ ...transaction });
  };

  const handleSaveTransaction = async () => {
    if (!editingTransaction) return;
    try {
      await api.updateTransaction(editingTransaction.id, {
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        category: editingTransaction.category
      });
      setEditingTransaction(null);
      fetchData();
      showToast('Transaction updated successfully!');
    } catch (error) {
      console.error("Error updating transaction:", error);
      showToast('Failed to update transaction', 'error');
    }
  };

  const handleDeleteTransaction = (transactionId) => {
    confirmDelete(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action is permanent.',
      async () => {
        try {
          await api.deleteTransaction(transactionId);
          fetchData();
          showToast('Transaction deleted successfully!');
        } catch (error) {
          console.error("Error deleting transaction:", error);
          showToast('Failed to delete transaction', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    );
  };

  const handleToggleSelect = (id) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)));
    }
  };

  const handleManualTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!manualTransaction.description || !manualTransaction.amount || !manualTransaction.date) return;

    try {
      await api.createTransaction({
        ...manualTransaction,
        amount: parseFloat(manualTransaction.amount)
      });
      setShowManualForm(false);
      setManualTransaction({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: '',
        source: 'manual'
      });
      fetchData();
      showToast('Transaction added manually!');
    } catch (error) {
      console.error("Error adding manual transaction:", error);
      showToast('Failed to add transaction', 'error');
    }
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.size === 0) return;
    confirmDelete(
      'Bulk Delete',
      `Are you sure you want to delete ${selectedTransactions.size} transactions? This cannot be undone.`,
      async () => {
        try {
          const result = await api.bulkDeleteTransactions(Array.from(selectedTransactions));
          setSelectedTransactions(new Set());
          fetchData();
          showToast(result.message);
        } catch (error) {
          console.error("Error bulk deleting transactions:", error);
          showToast('Failed to delete transactions', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    );
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!newReminder.name || !newReminder.amount || !newReminder.due_day) return;

    try {
      await api.createBillReminder({
        name: newReminder.name,
        amount: parseFloat(newReminder.amount),
        due_day: parseInt(newReminder.due_day),
        category: newReminder.category || null
      });
      setNewReminder({ name: '', amount: '', due_day: '', category: '' });
      fetchData();
      showToast('Bill reminder created!');
    } catch (error) {
      console.error("Error creating reminder:", error);
      showToast('Failed to create reminder', 'error');
    }
  };

  const handleDeleteReminder = (id) => {
    confirmDelete(
      'Delete Reminder',
      'Are you sure you want to remove this bill reminder?',
      async () => {
        try {
          await api.deleteBillReminder(id);
          fetchData();
          showToast('Reminder deleted');
        } catch (error) {
          console.error("Error deleting reminder:", error);
          showToast('Failed to delete reminder', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    );
  };

  const handleDeleteStatement = (id, filename) => {
    confirmDelete(
      'Delete Statement',
      `Are you sure you want to delete "${filename}"? All associated transactions will be permanently removed.`,
      async () => {
        try {
          const result = await api.deleteStatement(id);
          fetchData();
          showToast(result.message);
        } catch (error) {
          console.error("Error deleting statement:", error);
          showToast('Failed to delete statement', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    );
  };

  // Phase 2: Goal handlers
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target_amount || !newGoal.deadline) return;
    try {
      await api.createGoal({
        name: newGoal.name,
        target_amount: parseFloat(newGoal.target_amount),
        deadline: newGoal.deadline
      });
      setNewGoal({ name: '', target_amount: '', deadline: '' });
      setShowGoalForm(false);
      fetchData();
      showToast('Goal created successfully!');
    } catch (error) {
      console.error("Error creating goal:", error);
      showToast('Failed to create goal', 'error');
    }
  };



  const handleDeleteGoal = (goalId) => {
    confirmDelete(
      'Delete Financial Goal',
      'Are you sure you want to delete this savings goal? Your progress will be lost.',
      async () => {
        try {
          await api.deleteGoal(goalId);
          fetchData();
          showToast('Goal deleted');
        } catch (error) {
          console.error("Error deleting goal:", error);
          showToast('Failed to delete goal', 'error');
        } finally {
          setConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    );
  };

  const getCategorySpending = (category) => {
    const item = spending.find(s => s.name === category);
    return item ? item.value : 0;
  };

  const getSpendingData = () => spending;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <>
      {!isLoggedIn ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          </div>
          <div className="w-full max-w-md relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 mb-4 backdrop-blur-sm">
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Finance AI</h1>
              <p className="text-blue-300/60 text-sm font-medium mt-1">Intelligent Wealth Management</p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">
              <div className="flex bg-white/5 rounded-xl p-1 mb-8">
                <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${authMode === 'login' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'}`}>Sign In</button>
                <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${authMode === 'register' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'}`}>Create Account</button>
              </div>
              {authError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 mb-6 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <p className="text-rose-300 text-xs font-medium">{authError}</p>
                </div>
              )}
              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="text" value={authForm.full_name} onChange={e => setAuthForm({ ...authForm, full_name: e.target.value })} placeholder="John Doe" className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} placeholder="Enter your username" required className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" />
                  </div>
                </div>
                {authMode === 'register' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="john@example.com" required className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type={showPassword ? 'text' : 'password'} value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="••••••••" required minLength={4} className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={authLoading} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6">
                  {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : authMode === 'login' ? <><ShieldCheck className="w-4 h-4" /> Sign In Securely</> : <><UserPlus className="w-4 h-4" /> Create Account</>}
                </button>
              </form>
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-2">
                <Lock className="w-3 h-3 text-emerald-400" />
                <p className="text-[10px] text-slate-500 font-medium">256-bit encryption • Secured with JWT</p>
              </div>
            </div>
            <p className="text-center text-slate-600 text-xs mt-6">© 2024 Finance AI • All rights reserved</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                  <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200 transition-transform group-hover:scale-110 duration-300">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Finance AI</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Intelligence Dashboard</p>
                  </div>
                </div>

                <nav className="flex items-center space-x-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`nav-link px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={`nav-link px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'transactions' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => setActiveTab('budgets')}
                    className={`nav-link px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === 'budgets' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Planning
                  </button>
                </nav>

                {/* User Menu & Currency Selector */}
                <div className="flex items-center gap-3">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    {Object.keys(CURRENCY_CONFIG).map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  {currentUser && (
                    <span className="text-xs font-bold text-slate-500 hidden sm:block">
                      Hi, <span className="text-slate-900">{currentUser.full_name || currentUser.username}</span>
                    </span>
                  )}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Toast Notification */}
          {toast.show && (
            <div className={`fixed top-24 right-8 z-[100] flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl backdrop-blur-xl border animate-in slide-in-from-right-8 duration-500 ${toast.type === 'success'
              ? 'bg-emerald-600/90 text-white border-emerald-500/50 shadow-emerald-200'
              : 'bg-rose-600/90 text-white border-rose-500/50 shadow-rose-200'
              }`}>
              <div className="p-1.5 bg-white/20 rounded-lg">
                {toast.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </div>
              <span className="font-black tracking-tight">{toast.message}</span>
            </div>
          )}

          {/* Edit Transaction Modal */}
          {editingTransaction && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200/50">
                <div className="p-10">
                  <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3 text-slate-900">
                      <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
                        <Pencil size={24} />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight">Modify Record</h3>
                    </div>
                    <button
                      onClick={() => setEditingTransaction(null)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Merchant / Source</label>
                      <input
                        type="text"
                        value={editingTransaction.description}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                        className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-100 p-5 text-slate-900 font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Financial Amount ({CURRENCY_CONFIG[currency]?.symbol || '$'})</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{CURRENCY_CONFIG[currency]?.symbol || '$'}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editingTransaction.amount}
                          onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                          className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-100 p-5 pl-12 text-slate-900 font-black text-xl transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Strategic Category</label>
                      <select
                        value={editingTransaction.category || ''}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                        className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-amber-100 p-5 text-slate-900 font-bold transition-all"
                      >
                        <option value="">Select Category</option>
                        <option value="Dining">Dining & Food</option>
                        <option value="Transport">Transport & Mobility</option>
                        <option value="Shopping">Shopping & Retail</option>
                        <option value="Entertainment">Entertainment & Media</option>
                        <option value="Income">Direct Income</option>
                        <option value="Utilities">Utilities & Services</option>
                        <option value="Rent">Rent & Housing</option>
                        <option value="Other">Miscellaneous</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-10 flex gap-4">
                    <button
                      onClick={() => setEditingTransaction(null)}
                      className="flex-1 px-8 py-5 bg-slate-100 text-slate-500 font-bold rounded-3xl hover:bg-slate-200 transition-all"
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleSaveTransaction}
                      className="flex-1 px-8 py-5 bg-slate-900 text-white font-black rounded-3xl transition-all shadow-2xl shadow-slate-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Import Strategic Section */}
            <div className="mb-12 p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-blue-500/20 transition-all duration-700"></div>
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div>
                  <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em]">Knowledge Acquisition</h2>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight mb-2">Import Financial Data</h3>
                  <p className="text-slate-400 font-medium max-w-md">Seamlessly sync your bank statements via CSV to activate AI-driven insights and projections.</p>
                </div>
                <label className="flex items-center gap-4 px-10 py-5 bg-white text-slate-900 rounded-[1.5rem] hover:bg-slate-50 cursor-pointer transition-all duration-300 shadow-xl font-black group/btn active:scale-95">
                  <Plus size={24} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                  <span>{loading ? 'Processing Protocol...' : 'Select CSV Statement'}</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" accept=".csv" disabled={loading} />
                </label>
              </div>
            </div>

            {/* Uploaded Statements Intelligence Section */}
            {uploadedStatements.length > 0 && (
              <div className="mb-12 p-8 bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 px-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Statement History</h3>
                      <p className="text-sm text-slate-500 font-medium">Manage your active data sources</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {selectedStatements.size === 0
                      ? 'All Data Systems Online'
                      : `Filtered by ${selectedStatements.size} active source${selectedStatements.size > 1 ? 's' : ''}`}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Combine All Data Option */}
                  <div
                    onClick={() => setSelectedStatements(new Set())}
                    className={`p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border-2 ${selectedStatements.size === 0
                      ? 'bg-slate-900 border-slate-900 shadow-xl'
                      : 'bg-white border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${selectedStatements.size === 0 ? 'bg-blue-600' : 'bg-blue-50'}`}>
                        <Activity className={`w-6 h-6 ${selectedStatements.size === 0 ? 'text-white' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-black text-sm tracking-tight ${selectedStatements.size === 0 ? 'text-white' : 'text-slate-900'}`}>Unified Ecosystem</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedStatements.size === 0 ? 'text-blue-300' : 'text-slate-400'}`}>
                          {uploadedStatements.reduce((sum, s) => sum + s.transaction_count, 0)} total nodes
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Individual Sources */}
                  {uploadedStatements.map(stmt => {
                    const isSelected = selectedStatements.has(stmt.id);
                    const toggleStatement = () => {
                      const newSet = new Set(selectedStatements);
                      if (isSelected) {
                        newSet.delete(stmt.id);
                      } else {
                        newSet.add(stmt.id);
                      }
                      setSelectedStatements(newSet);
                    };

                    return (
                      <div
                        key={stmt.id}
                        onClick={toggleStatement}
                        className={`p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border-2 relative group ${isSelected
                          ? 'bg-blue-50 border-blue-400 scale-[1.02] shadow-lg shadow-blue-100'
                          : 'bg-white border-slate-100 hover:border-blue-200'
                          }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-black text-sm truncate max-w-[140px] ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>{stmt.filename}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>
                              {stmt.transaction_count} data points
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteStatement(stmt.id, stmt.filename); }}
                              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'dashboard' ? (
              <div className="space-y-12">
                {/* Summary Cards */}
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Income</p>
                        <p className="text-2xl font-black text-slate-900">{formatMoney(totalIncome)}</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                        <ArrowUpRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Expenses</p>
                        <p className="text-2xl font-black text-slate-900">{formatMoney(totalExpenses)}</p>
                      </div>
                      <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
                        <ArrowDownRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net Balance</p>
                        <p className="text-2xl font-black text-white">{formatMoney(netBalance)}</p>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                        <Wallet className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {analyticsSummary && (
                    <>
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Burn Rate</p>
                            <p className="text-xl font-black text-slate-900">{formatMoney(analyticsSummary.burn_rate_daily)}<span className="text-xs text-slate-400 font-medium ml-1">/ day</span></p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                            <Zap className="w-5 h-5" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Runway</p>
                            <p className={`text-xl font-black ${analyticsSummary.days_until_broke >= 30 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {analyticsSummary.days_until_broke !== null
                                ? `${analyticsSummary.days_until_broke} Days`
                                : (analyticsSummary.burn_rate_daily === 0 ? '∞ (Safe)' : 'Overdue')}
                            </p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <Activity className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Spending Analysis */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200/50 shadow-sm animate-in">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Spending Analysis</h3>
                          <p className="text-sm text-slate-500">Distribution of your monthly outgoings</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                          <PieChartIcon size={20} />
                        </div>
                      </div>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getSpendingData()}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={120}
                              paddingAngle={8}
                              dataKey="value"
                              stroke="none"
                            >
                              {getSpendingData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                              itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Balance Forecast */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200/50 shadow-sm animate-in">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Balance Projection</h3>
                          <p className="text-sm text-slate-500">AI-powered 30-day financial outlook</p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                          <Zap size={20} />
                        </div>
                      </div>
                      <div className="h-80 w-full">
                        {forecast && forecast.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={forecast}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis
                                dataKey="ds"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                              />
                              <Tooltip
                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="yhat"
                                name="Predicted Balance"
                                stroke="#4f46e5"
                                strokeWidth={4}
                                dot={false}
                                activeDot={{ r: 8, strokeWidth: 0 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-100 rounded-2xl">
                            <div className="p-3 bg-slate-50 rounded-full mb-3">
                              <TrendingUp className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-slate-900 font-bold">Not enough data for projection</p>
                            <p className="text-slate-400 text-xs mt-1">Import more statements to unlock AI forecasting</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Smart Financial Insights */}
                    <div className="bg-indigo-900 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>

                      <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="p-2 bg-indigo-500/30 rounded-lg">
                          <Sparkles className="w-5 h-5 text-indigo-300" />
                        </div>
                        <h3 className="text-lg font-bold">Smart Insights</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 hover:bg-indigo-800 transition-colors">
                          <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Top Spending</p>
                          <p className="text-xl font-black text-white truncate">
                            {getSpendingData().length > 0 ? getSpendingData().sort((a, b) => b.value - a.value)[0].name : 'N/A'}
                          </p>
                          <p className="text-xs text-indigo-300 font-medium mt-1">Highest Category</p>
                        </div>

                        <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 hover:bg-indigo-800 transition-colors">
                          <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Biggest Txn</p>
                          <p className="text-xl font-black text-white">
                            {formatMoney(Math.max(...transactions.map(t => Math.abs(t.amount)), 0))}
                          </p>
                          <p className="text-xs text-indigo-300 font-medium mt-1">One-time Expense</p>
                        </div>

                        <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700/50 hover:bg-indigo-800 transition-colors">
                          <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Avg Transaction</p>
                          <p className="text-xl font-black text-white">
                            {formatMoney(transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / (transactions.length || 1))}
                          </p>
                          <p className="text-xs text-indigo-300 font-medium mt-1">Typical Spend</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Financial Health Score */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Financial Stability
                      </h3>
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="text-6xl font-black mb-2 tracking-tighter">{analyticsSummary?.health_score ?? 0}</div>
                        <div className="text-blue-100 text-xs font-bold uppercase tracking-widest">Stability Score</div>
                        <div className="mt-8 w-full bg-white/20 h-2 rounded-full overflow-hidden">
                          <div className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${analyticsSummary?.health_score ?? 0}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Side Intelligence Widgets */}
                    <div className="space-y-6">
                      {/* Emergency/Risk Alerts */}
                      {emergencies && (Array.isArray(emergencies) ? emergencies.length > 0 : emergencies.has_emergency) && (
                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 animate-in">
                          <div className="flex items-center gap-3 mb-4 text-rose-600">
                            <AlertTriangle className="w-5 h-5" />
                            <h4 className="font-bold text-sm uppercase tracking-tighter">Risk Alerts</h4>
                          </div>
                          <div className="bg-white/60 p-4 rounded-xl text-xs">
                            {emergencies.alert_title ? (
                              <>
                                <p className="text-rose-900 font-bold">{emergencies.alert_title}</p>
                                <p className="text-rose-600 mt-1">{emergencies.alert_message}</p>
                              </>
                            ) : Array.isArray(emergencies) && (
                              emergencies.map((e, idx) => (
                                <div key={idx} className="mb-2 last:mb-0">
                                  <p className="text-rose-900 font-bold">{e.type}</p>
                                  <p className="text-rose-600">{e.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Spending Persona */}
                      {spendingPersonality && (
                        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 animate-in">
                          <div className="flex items-center gap-3 mb-4 text-indigo-600">
                            <User className="w-5 h-5" />
                            <h4 className="font-bold text-sm uppercase tracking-tighter">Finance Persona</h4>
                          </div>
                          <div className="bg-white/60 p-4 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{spendingPersonality.emoji}</span>
                              <p className="text-indigo-900 font-bold text-lg">{spendingPersonality.personality_type}</p>
                            </div>
                            <p className="text-indigo-600 text-[10px] italic leading-relaxed mb-3">
                              "{spendingPersonality.analysis || spendingPersonality.description || 'Analyzing financial behavior...'}"
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {spendingPersonality.traits && spendingPersonality.traits.map((trait, idx) => (
                                <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg">
                                  {trait}
                                </span>
                              ))}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-white/50 p-2 rounded-xl">
                                <p className="text-slate-400 font-bold uppercase">Savings Rate</p>
                                <p className={`font-black ${spendingPersonality.savings_rate >= 20 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                  {spendingPersonality.savings_rate}%
                                </p>
                              </div>
                              <div className="bg-white/50 p-2 rounded-xl">
                                <p className="text-slate-400 font-bold uppercase">Variability</p>
                                <p className="text-slate-900 font-black">{spendingPersonality.spending_variability}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Goals Widget */}
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tighter">Top Goals</h4>
                          <button
                            onClick={() => setShowGoalForm(true)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="space-y-6 flex-1">
                          {goals.slice(0, 3).map(goal => (
                            <div key={goal.id} className="group">
                              <div className="flex justify-between text-[10px] font-bold mb-2">
                                <span className="text-slate-900 uppercase tracking-tight">{goal.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-600">{Math.round((goal.current_saved / goal.target_amount) * 100)}%</span>
                                  <button
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${Math.min(100, (goal.current_saved / goal.target_amount) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                          {goals.length === 0 && (
                            <div className="h-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-xl">
                              <p className="text-xs text-slate-400 font-medium">No goals set yet.</p>
                              <button
                                onClick={() => setShowGoalForm(true)}
                                className="mt-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                              >
                                + Create Goal
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recent Activity Widget */}
                      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm animate-in">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tighter">Recent Activity</h4>
                          <Clock className="text-slate-400 w-5 h-5" />
                        </div>
                        <div className="space-y-4">
                          {transactions.slice(0, 5).map(txn => (
                            <div key={txn.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${txn.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                                  {txn.amount > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{txn.description}</p>
                                  <p className="text-[10px] text-slate-400">{new Date(txn.date).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-black ${txn.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {txn.amount > 0 ? '+' : ''}${Math.abs(txn.amount).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {transactions.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
                          )}
                        </div>
                        <button
                          onClick={() => setActiveTab('transactions')}
                          className="w-full mt-6 py-3 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          View All Activity
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'transactions' ? (
              /* Transactions List */
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* Search and Action Bar */}
                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 w-full max-w-xl group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-blue-600" />
                    <input
                      type="text"
                      placeholder="Filter through your activity..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 text-slate-900 font-medium transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowManualForm(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-bold shadow-xl shadow-slate-200"
                  >
                    <Plus size={20} />
                    Add Transaction
                  </button>
                </div>

                {/* Bulk Actions Bar */}
                {selectedTransactions.size > 0 && (
                  <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-between animate-in zoom-in-95">
                    <span className="text-white font-bold ml-2">
                      {selectedTransactions.size} selected items
                    </span>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-bold backdrop-blur-md"
                    >
                      <Trash2 size={16} />
                      Remove Selected
                    </button>
                  </div>
                )}

                {/* Transactions Table */}
                <div className="bg-white rounded-[2rem] border border-slate-200/50 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-8 py-6 text-left">
                            <input
                              type="checkbox"
                              checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                              onChange={handleSelectAll}
                              className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Info</th>
                          <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin & Purpose</th>
                          <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Impact</th>
                          <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                          <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence Tags</th>
                          <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.map((t) => (
                          <tr key={t.id} className={`group transition-colors hover:bg-slate-50/50 ${selectedTransactions.has(t.id) ? 'bg-blue-50/50' : ''}`}>
                            <td className="px-8 py-6">
                              <input
                                type="checkbox"
                                checked={selectedTransactions.has(t.id)}
                                onChange={() => handleToggleSelect(t.id)}
                                className="w-5 h-5 text-blue-600 border-slate-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-6">
                              <p className="text-sm font-bold text-slate-900">{t.date}</p>
                              <p className="text-[10px] text-slate-400 font-medium">Recorded at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-6 py-6">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{t.description || 'No Description'}</p>
                              <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">ID: {String(t.id || '').slice(0, 8)}</p>
                            </td>
                            <td className="px-6 py-6">
                              <div className={`text-sm font-black flex items-center ${t.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {t.amount < 0 ? (
                                  <ArrowDownRight className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowUpRight className="w-3 h-3 mr-1" />
                                )}
                                {formatMoney(Math.abs(t.amount))}
                              </div>
                            </td>
                            <td className="px-6 py-6">
                              <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-tighter rounded-xl bg-slate-100 text-slate-600">
                                {t.category}
                              </span>
                            </td>
                            <td className="px-6 py-6">
                              <div className="flex flex-wrap gap-2">
                                {t.is_anomaly && (
                                  <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-lg border border-rose-100">Anomaly</span>
                                )}
                                {t.is_recurring && (
                                  <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-lg border border-amber-100">Recurring</span>
                                )}
                                {!t.is_anomaly && !t.is_recurring && (
                                  <span className="text-[10px] text-slate-300 font-medium tracking-tight">Verified Data</span>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditTransaction(t)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTransaction(t.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td colSpan="7" className="px-8 py-32 text-center">
                              <div className="flex flex-col items-center">
                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                  <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-slate-900 font-bold">No transactions found</p>
                                <p className="text-slate-400 text-sm mt-1">Try adjusting your filters or importing more data.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* Budgets & Planning UI */
              <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                {/* Set Budget Form */}
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200/50 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Budget Strategy</h3>
                        <p className="text-sm text-slate-500">Define your monthly limits for intelligent tracking</p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveBudget} className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Select Category</label>
                        <select
                          value={newBudget.category}
                          onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                          className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100 p-4 text-slate-900 font-bold transition-all"
                        >
                          <option value="">Choose category...</option>
                          {spending.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Monthly Allocation ($)</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{CURRENCY_CONFIG[currency]?.symbol || '$'}</span>
                          <input
                            type="number"
                            value={newBudget.amount}
                            onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                            className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100 p-4 pl-10 text-slate-900 font-bold placeholder:text-slate-300 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        {editingBudget && (
                          <button
                            type="button"
                            onClick={() => { setNewBudget({ category: '', amount: '' }); setEditingBudget(null); }}
                            className="flex-1 md:w-auto px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all font-bold"
                          >
                            Cancel
                          </button>
                        )}
                        <button type="submit" className="flex-1 md:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-xl shadow-indigo-100">
                          {editingBudget ? 'Update Strategy' : 'Initialize Budget'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Budget Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {budgets.map((budget) => {
                    const spent = getCategorySpending(budget.category);
                    const percentage = Math.min((spent / budget.amount) * 100, 100);
                    const isOverBudget = spent > budget.amount;

                    return (
                      <div key={budget.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{budget.category}</h4>
                            <p className="text-lg font-black text-slate-900">{formatMoney(budget.amount)}</p>
                          </div>
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg border ${isOverBudget ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {isOverBudget ? 'Limit Exceeded' : 'Safe'}
                          </span>
                        </div>

                        <div className="mb-4 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-400">{formatMoney(spent)} / {formatMoney(budget.amount)}</span>
                            <span className={isOverBudget ? 'text-rose-600' : 'text-slate-900'}>{percentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : 'bg-blue-600'}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-50">
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {budgets.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                      <div className="flex flex-col items-center">
                        <div className="p-5 bg-white rounded-full shadow-sm mb-4">
                          <PieChartIcon className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-900 font-bold">No active budgets found</p>
                        <p className="text-slate-400 text-sm mt-1">Start your financial mapping by adding your first budget above.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-white mt-32 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="p-2 bg-blue-600 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter">Finance AI</h3>
                  </div>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                    Master your capital with production-grade AI intelligence.
                    Experience a new standard in personal wealth management through
                    clean data and smart projections.
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500 mb-8">Intelligence</h4>
                  <ul className="space-y-4 text-slate-300 font-bold">
                    <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> Categorization</li>
                    <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> Projections</li>
                    <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> Anomalies</li>
                    <li className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer"><div className="w-1 h-1 bg-blue-500 rounded-full"></div> Portfolio AI</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-500 mb-8">System Stats</h4>
                  <div className="space-y-6">
                    <div>
                      <p className="text-3xl font-black">{transactions.length}</p>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Data Points</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black">{budgets.length}</p>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Active Strategies</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-800 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-slate-500 text-sm font-bold">&copy; 2024 Finance Intelligence AI. All systems operational.</p>
                <div className="flex gap-8 text-slate-500 text-xs font-black uppercase tracking-widest">
                  <span className="hover:text-white cursor-pointer">Security</span>
                  <span className="hover:text-white cursor-pointer">Privacy</span>
                  <span className="hover:text-white cursor-pointer">API Docs</span>
                </div>
              </div>
            </div>
          </footer>

          {/* Manual Transaction Modal */}
          {showManualForm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200/50">
                <div className="p-10">
                  <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3 text-slate-900">
                      <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <Plus size={24} />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight">Add Record</h3>
                    </div>
                    <button
                      onClick={() => setShowManualForm(false)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleManualTransactionSubmit} className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Event Date</label>
                      <input
                        type="date"
                        required
                        value={manualTransaction.date}
                        onChange={(e) => setManualTransaction({ ...manualTransaction, date: e.target.value })}
                        className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 p-5 p-5 text-slate-900 font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Merchant / Source</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Apple Store"
                        value={manualTransaction.description}
                        onChange={(e) => setManualTransaction({ ...manualTransaction, description: e.target.value })}
                        className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 p-5 text-slate-900 font-bold placeholder:text-slate-300 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Amount</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-lg">{CURRENCY_CONFIG[currency]?.symbol || '$'}</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={manualTransaction.amount}
                          onChange={(e) => setManualTransaction({ ...manualTransaction, amount: e.target.value })}
                          className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 p-5 pl-12 text-slate-900 font-black text-xl placeholder:text-slate-200 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium ml-4 mt-2 italic">Negative signs for expenditures, positive for capital influx.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">AI Categorization</label>
                      <select
                        value={manualTransaction.category}
                        onChange={(e) => setManualTransaction({ ...manualTransaction, category: e.target.value })}
                        className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 p-5 text-slate-900 font-bold transition-all"
                      >
                        <option value="">Intelligent Automatic Mode</option>
                        <option value="Dining">Dining & Food</option>
                        <option value="Transport">Transport & Mobility</option>
                        <option value="Shopping">Shopping & Retail</option>
                        <option value="Entertainment">Entertainment & Media</option>
                        <option value="Income">Direct Income</option>
                        <option value="Utilities">Utilities & Services</option>
                        <option value="Rent">Rent & Housing</option>
                        <option value="Other">Miscellaneous</option>
                      </select>
                    </div>
                    <div className="pt-6 flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowManualForm(false)}
                        className="flex-1 px-8 py-5 bg-slate-100 text-slate-500 font-bold rounded-2.5xl hover:bg-slate-200 transition-all rounded-3xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-8 py-5 bg-slate-900 text-white font-black rounded-3xl transition-all shadow-2xl shadow-slate-200"
                      >
                        Record Entry
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Create Goal Modal */}
          {showGoalForm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200/50">
                <div className="p-10">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3 text-slate-900">
                      <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <Target size={24} />
                      </div>
                      <h3 className="text-2xl font-black tracking-tight">New Goal</h3>
                    </div>
                    <button
                      onClick={() => setShowGoalForm(false)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateGoal} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Goal Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dream Vacation"
                        value={newGoal.name}
                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                        className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 p-5 text-slate-900 font-bold transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Amount</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          required
                          placeholder="5000"
                          value={newGoal.target_amount}
                          onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                          className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 p-5 pl-12 text-slate-900 font-black text-xl transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Date</label>
                      <input
                        type="date"
                        required
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                        className="w-full rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-100 p-5 text-slate-900 font-bold transition-all"
                      />
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button
                        type="button"
                        onClick={() => setShowGoalForm(false)}
                        className="flex-1 px-8 py-5 bg-slate-100 text-slate-500 font-bold rounded-3xl hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-8 py-5 bg-slate-900 text-white font-black rounded-3xl transition-all shadow-xl shadow-slate-200"
                      >
                        Create Goal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {confirmModal.show && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200/50">
                <div className="p-10 text-center">
                  <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <AlertTriangle className="w-10 h-10 text-rose-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{confirmModal.title}</h3>
                  <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                    {confirmModal.message}
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={confirmModal.onConfirm}
                      className="w-full px-8 py-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-3xl transition-all shadow-2xl shadow-rose-100 flex items-center justify-center gap-3"
                    >
                      <Trash2 size={20} />
                      {confirmModal.confirmText}
                    </button>
                    <button
                      onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                      className="w-full px-8 py-5 bg-slate-100 text-slate-500 font-bold rounded-3xl hover:bg-slate-200 transition-all"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default App
