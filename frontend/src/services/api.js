/**
 * API Service - Standalone module for backend communication
 */

const API_BASE = '/api';

async function apiRequest(url, options = {}) {
    const { signal, ...fetchOptions } = options;
    const response = await fetch(url, { ...fetchOptions, signal });
    
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: 'No error body' }));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody.message}`);
    }
    
    return response.status === 204 ? null : response.json();
}

async function authenticatedRequest(url, options = {}, getToken) {
    const token = await getToken();
    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    };
    return apiRequest(url, authOptions);
}

export const api = (getToken) => {
    const request = (url, options) => authenticatedRequest(url, options, getToken);

    return {
        // Public / Setup
        getFirebaseConfig: (signal) => apiRequest(`${API_BASE}/firebase-config`, { signal }),
        requestPasswordReset: (email, signal) => apiRequest(`${API_BASE}/request-password-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            signal
        }),
        sendWelcomeEmail: (signal) => request(`${API_BASE}/send-welcome-email`, {
            method: 'POST',
            signal
        }),
        
        // Logs
        logError: (errorData, signal) => apiRequest(`${API_BASE}/log-error`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorData),
            signal
        }),

        // Finance Data
        fetchSalaryData: (signal) => request(`${API_BASE}/salary/last-month`, { signal }),
        fetchCustomRangeSalaryData: (startDate, endDate, signal) => request(`${API_BASE}/salary/custom-range?startDate=${startDate}&endDate=${endDate}`, { signal }),
        fetchMonthlySpendingData: (startDate, endDate, signal) => {
            let url = `${API_BASE}/spending/monthly-data`;
            if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
            return request(url, { signal });
        },
        fetchMonthlySpendingDataWithRange: (startDate, endDate, signal) => {
            const url = `${API_BASE}/spending/monthly-data?startDate=${startDate}&endDate=${endDate}`;
            return request(url, { signal });
        },
        fetchCategorySpendingData: (startDate, endDate, signal) => {
            const url = `${API_BASE}/spending/categories?startDate=${startDate}&endDate=${endDate}`;
            return request(url, { signal });
        },

        // NocoDB / Resources
        fetchCategories: (params = null, signal) => {
            let url = `${API_BASE}/nocodb/categories`;
            if (params) url += `?${new URLSearchParams(params).toString()}`;
            return request(url, { signal });
        },
        fetchCategoryTypes: (signal) => request(`${API_BASE}/nocodb/categories/types`, { signal }),
        
        // Budgets
        fetchActiveBudgets: (signal) => request(`${API_BASE}/budgets/active`, { signal }),
        createBudget: (data, signal) => request(`${API_BASE}/proxy/budgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        updateBudget: (id, data, signal) => request(`${API_BASE}/proxy/budgets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        deleteBudget: (id, signal) => request(`${API_BASE}/proxy/budgets/${id}`, { method: 'DELETE', signal }),

        // Categories & Items
        createCategory: (name, type, signal) => request(`${API_BASE}/nocodb/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category_name: name, type }),
            signal
        }),
        updateCategory: (id, data, signal) => request(`${API_BASE}/nocodb/categories/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        deleteCategory: (id, targetCategoryId, signal) => request(`${API_BASE}/nocodb/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetCategoryId }),
            signal
        }),
        createItem: (itemName, categoryId, signal) => request(`${API_BASE}/nocodb/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_name: itemName, categories_id: categoryId }),
            signal
        }),
        updateItem: (itemId, itemName, signal) => request(`${API_BASE}/nocodb/items/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_name: itemName }),
            signal
        }),

        // Installments
        fetchInstallments: (signal) => request(`${API_BASE}/installments`, { signal }),
        createInstallmentRecord: (data, signal) => request(`${API_BASE}/nocodb/installments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        createInstallmentPlan: (data, signal) => request(`${API_BASE}/installment-plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        markInstallmentAsPaid: (id, paid, signal) => request(`${API_BASE}/installments`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, paid }),
            signal
        }),
        updateInstallmentsBatch: (updates, signal) => request(`${API_BASE}/installments/batch`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
            signal
        }),
        deleteInstallmentPlan: (itemId, signal) => request(`${API_BASE}/nocodb/items/${itemId}`, { method: 'DELETE', signal }),
        deleteInstallment: (id, signal) => request(`${API_BASE}/installments/${id}`, { method: 'DELETE', signal }),

        // Cash Flow
        fetchCashFlowForecast: (days = 30, signal) => request(`${API_BASE}/cash-flow-forecast?duration=${days}`, { signal }),
        fetchCashFlowWarnings: (signal) => request(`${API_BASE}/proxy/cash-flow-warnings`, { signal }),

        // Transactions
        fetchTransactions: (startDate = null, endDate = null, signal) => {
            let url = `${API_BASE}/transactions`;
            if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
            return request(url, { signal });
        },
        fetchTransactionById: (id, signal) => request(`${API_BASE}/transactions/${id}`, { signal }),
        createTransaction: (data, signal) => request(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        updateTransaction: (id, data, signal) => request(`${API_BASE}/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        deleteTransaction: (id, signal) => request(`${API_BASE}/transactions/${id}`, { method: 'DELETE', signal }),
        importTransactionsJSON: (transactions, signal) => request(`${API_BASE}/transactions/import-json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactions),
            signal
        }),

        // Subscriptions
        fetchSubscriptions: (signal) => request(`${API_BASE}/subscriptions`, { signal }),
        createSubscription: (data, signal) => request(`${API_BASE}/subscriptions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        updateSubscription: (id, data, signal) => request(`${API_BASE}/subscriptions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        deleteSubscription: (id, signal) => request(`${API_BASE}/subscriptions/${id}`, { method: 'DELETE', signal }),

        // Settings
        getUserSettings: (signal) => request(`${API_BASE}/user-settings`, { signal }),
        updateUserSettings: (data, signal) => request(`${API_BASE}/user-settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        recalculateMonthlyIncomeEstimate: (signal) => request(`${API_BASE}/proxy/monthly-income-estimate/recalculate`, { signal }),

        // Tagging Rules
        fetchTaggingRules: (signal) => request(`${API_BASE}/tagging-rules`, { signal }),
        createTaggingRule: (data, signal) => request(`${API_BASE}/tagging-rules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        updateTaggingRule: (id, data, signal) => request(`${API_BASE}/tagging-rules/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        deleteTaggingRule: (id, signal) => request(`${API_BASE}/tagging-rules/${id}`, { method: 'DELETE', signal }),

        // Savings Goals
        fetchSavingsGoals: (signal) => request(`${API_BASE}/savings-goals`, { signal }),
        createSavingsGoal: (data, signal) => request(`${API_BASE}/savings-goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        updateSavingsGoal: (id, data, signal) => request(`${API_BASE}/savings-goals/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal
        }),
        deleteSavingsGoal: (id, signal) => request(`${API_BASE}/savings-goals/${id}`, { method: 'DELETE', signal }),

        // Anomalies
        fetchAnomalies: (signal) => request(`${API_BASE}/anomalies`, { signal })
    };
};