import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8000';

// Add auth token to all requests
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('finance_ai_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const api = {
    // Auth
    register: async (userData) => {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        if (response.data.access_token) {
            localStorage.setItem('finance_ai_token', response.data.access_token);
            localStorage.setItem('finance_ai_user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    login: async (credentials) => {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        if (response.data.access_token) {
            localStorage.setItem('finance_ai_token', response.data.access_token);
            localStorage.setItem('finance_ai_user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    getMe: async () => {
        const response = await axios.get(`${API_URL}/auth/me`);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('finance_ai_token');
        localStorage.removeItem('finance_ai_user');
    },

    getStoredUser: () => {
        const user = localStorage.getItem('finance_ai_user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('finance_ai_token');
    },

    uploadStatement: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post(`${API_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60 second timeout for large files
        });
        return response.data;
    },

    getTransactions: async (statementIds = null) => {
        let url = `${API_URL}/transactions`;
        if (statementIds && statementIds.length > 0) {
            url += `?statement_ids=${statementIds.join(',')}`;
        }
        const response = await axios.get(url);
        return response.data;
    },

    getSpendingBreakdown: async () => {
        const response = await axios.get(`${API_URL}/analytics/spending`);
        return response.data;
    },

    getForecast: async (days = 30) => {
        const response = await axios.get(`${API_URL}/analytics/forecast?days=${days}`);
        return response.data;
    },

    getBudgets: async () => {
        const response = await axios.get(`${API_URL}/budgets`);
        return response.data;
    },

    saveBudget: async (budget) => {
        const response = await axios.post(`${API_URL}/budgets`, budget);
        return response.data;
    },

    deleteBudget: async (budgetId) => {
        const response = await axios.delete(`${API_URL}/budgets/${budgetId}`);
        return response.data;
    },

    updateTransaction: async (transactionId, data) => {
        const response = await axios.put(`${API_URL}/transactions/${transactionId}`, data);
        return response.data;
    },

    deleteTransaction: async (transactionId) => {
        const response = await axios.delete(`${API_URL}/transactions/${transactionId}`);
        return response.data;
    },

    createTransaction: async (transactionData) => {
        const response = await axios.post(`${API_URL}/transactions`, transactionData);
        return response.data;
    },

    bulkDeleteTransactions: async (ids) => {
        const response = await axios.post(`${API_URL}/transactions/bulk-delete`, ids);
        return response.data;
    },

    // Analytics endpoints
    getAnalyticsSummary: async () => {
        const response = await axios.get(`${API_URL}/analytics/summary`);
        return response.data;
    },

    getSubscriptions: async () => {
        const response = await axios.get(`${API_URL}/analytics/subscriptions`);
        return response.data;
    },

    getIncomePatterns: async () => {
        const response = await axios.get(`${API_URL}/analytics/income-patterns`);
        return response.data;
    },

    getSavingsProjection: async (months = 12) => {
        const response = await axios.get(`${API_URL}/analytics/savings-projection`, { params: { months } });
        return response.data;
    },

    // Bill Reminders
    getBillReminders: async () => {
        const response = await axios.get(`${API_URL}/bill-reminders`);
        return response.data;
    },

    createBillReminder: async (reminder) => {
        const response = await axios.post(`${API_URL}/bill-reminders`, reminder);
        return response.data;
    },

    deleteBillReminder: async (id) => {
        const response = await axios.delete(`${API_URL}/bill-reminders/${id}`);
        return response.data;
    },

    // Uploaded Statements
    getStatements: async () => {
        const response = await axios.get(`${API_URL}/statements`);
        return response.data;
    },

    deleteStatement: async (id) => {
        const response = await axios.delete(`${API_URL}/statements/${id}`);
        return response.data;
    },

    // ===== PHASE 2: NEW ENDPOINTS =====

    // Goals
    getGoals: async () => {
        const response = await axios.get(`${API_URL}/goals`);
        return response.data;
    },

    createGoal: async (goal) => {
        const response = await axios.post(`${API_URL}/goals`, goal);
        return response.data;
    },

    updateGoal: async (goalId, data) => {
        const response = await axios.put(`${API_URL}/goals/${goalId}`, data);
        return response.data;
    },

    deleteGoal: async (goalId) => {
        const response = await axios.delete(`${API_URL}/goals/${goalId}`);
        return response.data;
    },

    getGoalPlan: async (goalId) => {
        const response = await axios.get(`${API_URL}/goals/${goalId}/plan`);
        return response.data;
    },

    getEmergencies: async () => {
        const response = await axios.get(`${API_URL}/analytics/emergencies`);
        return response.data;
    },

    getSpendingPersonality: async () => {
        const response = await axios.get(`${API_URL}/analytics/personality`);
        return response.data;
    }
};
