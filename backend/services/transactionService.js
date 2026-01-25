const nocodbService = require('./nocodbService');
const categoryService = require('./categoryService');
const env = require('../config/env');

/**
 * Fetch all transactions for a user within a date range.
 * Handles pagination automatically to retrieve the full dataset.
 */
async function getTransactions(userId, { startDate, endDate }) {
    const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;
    const categoryMapping = await categoryService.getCategoryMapping(userId);

    let userFilter = `(user_id,eq,${userId})`;
    let whereClause = userFilter;

    if (startDate && endDate) {
        const dateRangeFilter = `(date,ge,exactDate,${startDate})~and(date,le,exactDate,${endDate})`;
        whereClause = `${userFilter}~and${dateRangeFilter}`;
    }

    let allRecords = [];
    let currentOffset = 0;
    const pageSize = 1000;

    // Fetch all pages
    while (true) {
        const params = {
            limit: pageSize,
            offset: currentOffset,
            sort: '-date',
            where: whereClause,
        };

        const response = await nocodbService.getRecords(bankStatementsTableId, params);
        const pageRecords = response.list || [];
        
        if (pageRecords.length === 0) break;
        
        allRecords = allRecords.concat(pageRecords);
        
        if (pageRecords.length < pageSize) break;
        
        currentOffset += pageSize;
        
        // Safety check to prevent infinite loops or OOM
        if (currentOffset > 50000) break;
    }

    // Process and format transactions
    const transactions = allRecords.map(record => ({
        id: record.Id,
        date: record.date,
        amount: parseFloat(record.amount) || 0,
        bank: record.bank ? record.bank.charAt(0).toUpperCase() + record.bank.slice(1).toLowerCase() : 'Unknown',
        category: categoryMapping[record.categories_id] ? 
            categoryMapping[record.categories_id].charAt(0).toUpperCase() + 
            categoryMapping[record.categories_id].slice(1).toLowerCase() : 'Unknown',
        categoryId: record.categories_id,
        description: record.description || ''
    }));

    return {
        transactions,
        statistics: {
            totalTransactions: transactions.length,
            totalAmount: Math.round(transactions.reduce((sum, t) => sum + t.amount, 0) * 100) / 100,
            currency: env.DEFAULT_CURRENCY
        },
        metadata: {
            recordsProcessed: allRecords.length,
            categoriesUsed: Object.keys(categoryMapping).length,
            timestamp: new Date().toISOString()
        }
    };
}

async function calculateMonthlyIncome(userId) {
    const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = new Date().toISOString().split('T')[0];

    const earningCategoryIds = await categoryService.getEarningCategoryIds(userId);
    let newEstimate = 0;

    if (earningCategoryIds.length > 0) {
        const categoriesFilter = `(categories_id,in,${earningCategoryIds.join(',')})`;
        const incomeRecordsResponse = await nocodbService.getRecords(bankStatementsTableId, {
            where: `(user_id,eq,${userId})~and(date,ge,exactDate,${startDate})~and(date,le,exactDate,${endDate})~and${categoriesFilter}`
        });
        const incomeRecords = incomeRecordsResponse.list || [];

        if (incomeRecords.length > 0) {
            const monthlyIncome = {};
            incomeRecords.forEach(record => {
                const month = record.date.substring(0, 7);
                if (!monthlyIncome[month]) {
                    monthlyIncome[month] = 0;
                }
                monthlyIncome[month] += parseFloat(record.amount) || 0;
            });

            const totalIncome = Object.values(monthlyIncome).reduce((sum, amount) => sum + amount, 0);
            const monthCount = Object.keys(monthlyIncome).length;
            if(monthCount > 0) {
                newEstimate = totalIncome / monthCount;
            }
        }
    }
    return newEstimate;
}

module.exports = {
    getTransactions,
    calculateMonthlyIncome
};
