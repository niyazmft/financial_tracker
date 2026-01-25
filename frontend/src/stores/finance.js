import { defineStore } from 'pinia';
import { useApi } from '../services/apiInstance';
import { formatDateForInput } from '../services/utils';

export const useFinanceStore = defineStore('finance', {
    state: () => ({
        transactions: [],
        budgets: [],
        categories: [],
        categoryTypes: [],
        loading: false,
        error: null
    }),

    getters: {
        totalTransactionCount: (state) => state.transactions.length,
        totalTransactionAmount: (state) => state.transactions.reduce((sum, t) => sum + t.amount, 0),
        uniqueBanks: (state) => {
            const banks = new Set(state.transactions.map(t => t.bank).filter(Boolean));
            return Array.from(banks).sort();
        }
    },

    actions: {
        async fetchTransactions(startDate, endDate) {
            this.loading = true;
            try {
                const api = useApi();
                const data = await api.fetchTransactions(startDate, endDate);
                // Ensure date objects are instantiated immediately upon fetch
                this.transactions = (data.transactions || []).map(t => ({
                    ...t,
                    date: new Date(t.date)
                }));
            } catch (err) {
                this.error = err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async fetchCategories() {
            try {
                const api = useApi();
                const categoriesResponse = await api.fetchCategories();
                this.categories = categoriesResponse.categories || [];
                
                const categoryTypesResponse = await api.fetchCategoryTypes();
                this.categoryTypes = categoryTypesResponse.types || [];
            } catch (err) {
                this.error = err.message;
            }
        },

        async createCategory(name, type) {
            try {
                const api = useApi();
                const response = await api.createCategory(name, type);
                if (response.success) {
                    this.categories.push(response.category);
                    return response.category;
                }
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        },

        async updateCategory(id, data) {
            try {
                const api = useApi();
                const response = await api.updateCategory(id, data);
                if (response.success) {
                    const index = this.categories.findIndex(c => c.Id === id);
                    if (index !== -1) {
                        this.categories[index] = { ...this.categories[index], ...response.category };
                    }
                }
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        },

        async deleteCategory(id, targetCategoryId) {
            try {
                const api = useApi();
                await api.deleteCategory(id, targetCategoryId);
                this.categories = this.categories.filter(c => c.Id !== id);
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        },

        async fetchBudgets() {
            try {
                const api = useApi();
                this.budgets = await api.fetchActiveBudgets();
            } catch (err) {
                this.error = err.message;
            }
        },

        async addTransaction(data) {
            this.loading = true;
            try {
                const api = useApi();
                await api.createTransaction(data);
                // Re-fetch to ensure sync (server-side ID generation, triggers, etc.)
                await this.fetchTransactions(); 
            } catch (err) {
                this.error = err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async importTransactions(transactionList) {
             this.loading = true;
             try {
                 const api = useApi();
                 await api.importTransactionsJSON(transactionList);
                 await this.fetchTransactions();
             } catch (err) {
                 this.error = err.message;
                 throw err;
             } finally {
                 this.loading = false;
             }
        },

        async updateTransaction(id, data) {
            this.loading = true;
            try {
                const api = useApi();
                await api.updateTransaction(id, data);
                await this.fetchTransactions();
            } catch (err) {
                this.error = err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async deleteTransaction(id) {
            try {
                const api = useApi();
                await api.deleteTransaction(id);
                this.transactions = this.transactions.filter(t => t.id !== id);
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        }
    }
});
