const nocodbService = require('./nocodbService');
const env = require('../config/env');
const { getCategoryMapping } = require('./categoryService');

/**
 * Shared helper to fetch all transactions for a user.
 */
async function fetchAllTransactions(userId) {
    const tableId = env.NOCODB.TABLES.BANK_STATEMENTS;
    const whereClause = `(user_id,eq,${userId})`;
    let allRecords = [];
    let currentOffset = 0;
    const pageSize = 1000;

    while (true) {
        const response = await nocodbService.getRecords(tableId, { 
            limit: pageSize, 
            offset: currentOffset, 
            where: whereClause 
        });
        const list = response.list || [];
        allRecords = allRecords.concat(list);
        if (list.length < pageSize) break;
        currentOffset += pageSize;
    }
    return allRecords;
}

/**
 * Detects spending anomalies. Fixes "Temporal Leakage" by using 
 * non-overlapping windows for baseline and scoring.
 */
const detectSpendingAnomalies = async (userId, sensitivity = 3) => {
    const allRecords = await fetchAllTransactions(userId);
    const spendingTransactions = allRecords
        .filter(t => parseFloat(t.amount) < 0)
        .map(t => ({
            ...t,
            amount: Math.abs(parseFloat(t.amount)),
            date: new Date(t.date)
        }));

    const scoringCutoff = new Date();
    scoringCutoff.setDate(scoringCutoff.getDate() - 30); // Last 30 days are for scoring

    // Baseline is everything older than the scoring window (Leakage Fix)
    const historicalTransactions = spendingTransactions.filter(t => t.date <= scoringCutoff);
    const recentTransactions = spendingTransactions.filter(t => t.date > scoringCutoff);

    const categoryAverages = {};
    const categoryCounts = {};

    historicalTransactions.forEach(t => {
        const cat = t.categories_id;
        if (!cat) return;
        categoryAverages[cat] = (categoryAverages[cat] || 0) + t.amount;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    for (const cat in categoryAverages) {
        categoryAverages[cat] /= categoryCounts[cat];
    }

    const anomalies = [];
    const categoryMapping = await getCategoryMapping(userId);

    recentTransactions.forEach(t => {
        const avg = categoryAverages[t.categories_id];
        if (avg && t.amount > avg * sensitivity) {
            anomalies.push({
                id: t.Id,
                date: t.date.toISOString().split('T')[0],
                amount: -t.amount,
                description: t.description,
                categoryId: t.categories_id,
                categoryName: categoryMapping[t.categories_id] || 'Unknown',
                detectedAt: new Date().toISOString(),
                reason: `Unusual spike: ~${Math.round(t.amount / avg)}x historical average.`
            });
        }
    });

    return { anomalies, summary: { checked: recentTransactions.length, found: anomalies.length, sensitivity } };
};

/**
 * Detects "Negative Anomalies" (Missing expected income events).
 */
const detectMissingEntries = async (userId) => {
    const allRecords = await fetchAllTransactions(userId);
    const incomeTx = allRecords.filter(t => parseFloat(t.amount) > 0);
    
    if (incomeTx.length < 10) return []; // Not enough history to predict missing events

    const monthlyCounts = {}; // dayOfMonth -> count of months it appeared
    const monthSet = new Set();

    incomeTx.forEach(t => {
        const d = new Date(t.date);
        const day = d.getDate();
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        monthSet.add(monthKey);
        
        if (!monthlyCounts[day]) monthlyCounts[day] = new Set();
        monthlyCounts[day].add(monthKey);
    });

    const monthsCount = monthSet.size;
    const expectedPaydays = Object.entries(monthlyCounts)
        .filter(([, sets]) => sets.size >= monthsCount * 0.6) // Appeared in 60% of recorded months
        .map(([day]) => parseInt(day));

    const today = new Date();
    const missing = [];

    expectedPaydays.forEach(day => {
        // If today is at least 3 days past the expected day
        if (today.getDate() >= day + 3) {
            // Check if we already have income recorded for this month around that day (+/- 3 days)
            const hasIncome = incomeTx.some(t => {
                const txDate = new Date(t.date);
                return txDate.getMonth() === today.getMonth() && 
                       txDate.getFullYear() === today.getFullYear() &&
                       Math.abs(txDate.getDate() - day) <= 3;
            });

            if (!hasIncome) {
                missing.push({
                    type: 'missing_income',
                    expectedDay: day,
                    message: `Expected income around the ${day}th has not been detected yet this month.`,
                    severity: 'high'
                });
            }
        }
    });

    return missing;
};

module.exports = {
    detectSpendingAnomalies,
    detectMissingEntries,
    fetchAllTransactions
};
