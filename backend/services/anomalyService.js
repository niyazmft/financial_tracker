const nocodbService = require('./nocodbService');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { getCategoryMapping } = require('./categoryService');

/**
 * Detects spending anomalies for a given user based on category averages.
 * An anomaly is defined as a transaction where the absolute amount is `sensitivity` times
 * greater than the user's average spending for that category.
 */
const detectSpendingAnomalies = async (userId, sensitivity = 3) => {
    const bankStatementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;
    if (!bankStatementsTableId) {
        throw new AppError('BANK_STATEMENTS_TABLE_ID is not configured.', 500);
    }

    // 1. Fetch all transactions for the user
    const whereClause = `(user_id,eq,${userId})`;
    let allRecords = [];
    let currentOffset = 0;
    const pageSize = 1000;

    while (true) {
        const params = { limit: pageSize, offset: currentOffset, where: whereClause };
        const response = await nocodbService.getRecords(bankStatementsTableId, params);
        const pageRecords = response.list || [];
        if (pageRecords.length === 0) break;
        allRecords = allRecords.concat(pageRecords);
        if (pageRecords.length < pageSize) break;
        currentOffset += pageSize;
    }

    const spendingTransactions = allRecords.filter(t => parseFloat(t.amount) < 0).map(t => ({
        ...t,
        amount: Math.abs(parseFloat(t.amount)),
        date: new Date(t.date)
    }));

    // 2. Calculate historical average spending per category
    const categoryAverages = {};
    const categoryCounts = {};

    const historicalCutoff = new Date();
    historicalCutoff.setDate(historicalCutoff.getDate() - 90); // 90-day history

    const historicalTransactions = spendingTransactions.filter(t => t.date <= historicalCutoff);

    historicalTransactions.forEach(t => {
        const categoryId = t.categories_id;
        if (!categoryId) return;

        if (!categoryAverages[categoryId]) {
            categoryAverages[categoryId] = 0;
            categoryCounts[categoryId] = 0;
        }
        categoryAverages[categoryId] += t.amount;
        categoryCounts[categoryId]++;
    });

    for (const categoryId in categoryAverages) {
        categoryAverages[categoryId] /= categoryCounts[categoryId];
    }

    // 3. Identify anomalies in recent transactions
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - 30); // 30-day window for anomalies

    const recentTransactions = spendingTransactions.filter(t => t.date > recentCutoff);
    const anomalies = [];

    const categoryMapping = await getCategoryMapping(userId);

    recentTransactions.forEach(t => {
        const categoryId = t.categories_id;
        const categoryAverage = categoryAverages[categoryId];

        if (categoryAverage && t.amount > categoryAverage * sensitivity) {
            anomalies.push({
                id: t.Id,
                date: t.date.toISOString().split('T')[0],
                amount: -t.amount, // Keep original negative sign
                description: t.description,
                categoryId: t.categories_id,
                categoryName: categoryMapping[t.categories_id] || 'Unknown',
                detectedAt: new Date().toISOString(),
                reason: `This transaction is ~${Math.round(t.amount / categoryAverage)}x higher than the average for this category.`
            });
        }
    });

    return {
        anomalies,
        summary: {
            checkedTransactions: recentTransactions.length,
            foundAnomalies: anomalies.length,
            sensitivity,
            historicalDataPoints: historicalTransactions.length,
            categoryAverages
        }
    };
};

module.exports = {
    detectSpendingAnomalies,
};
