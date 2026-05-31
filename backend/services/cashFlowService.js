const nocodbService = require('./nocodbService');
const { getLookaheadDates } = require('../utils/dateUtils');
const { getEarningCategoryIds } = require('./categoryService');
const env = require('../config/env');

/**
 * Calculates spending weights for each day of the week based on cleaned historical transactions.
 */
function calculateSpendingWeights(categoryTransactions) {
    const dayOfWeekTotals = Array(7).fill(0);

    if (!categoryTransactions || categoryTransactions.length === 0) {
        return Array(7).fill(1 / 7);
    }

    categoryTransactions.forEach(t => {
        if (parseFloat(t.amount) < 0) {
            const transactionDate = t._parsedDate || new Date(t.date);
            const dayOfWeek = transactionDate.getDay();
            dayOfWeekTotals[dayOfWeek] += Math.abs(parseFloat(t.amount));
        }
    });

    const totalSpending = dayOfWeekTotals.reduce((sum, total) => sum + total, 0);
    if (totalSpending === 0) return Array(7).fill(1 / 7);

    return dayOfWeekTotals.map(total => total / totalSpending);
}

/**
 * Winsorizes transactions to mitigate outliers.
 */
function winsorizeTransactions(transactions, percentile = 0.95) {
    const byCategory = {};
    transactions.forEach(t => {
        const cat = t.categories_id;
        if (!cat) return;
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(Math.abs(parseFloat(t.amount)));
    });

    const caps = {};
    for (const [cat, amounts] of Object.entries(byCategory)) {
        if (amounts.length < 5) continue; // Not enough data to cap reliably
        amounts.sort((a, b) => a - b);
        const idx = Math.floor(amounts.length * percentile);
        caps[cat] = amounts[Math.min(idx, amounts.length - 1)];
    }

    return transactions.map(t => {
        const cat = t.categories_id;
        const raw = Math.abs(parseFloat(t.amount));
        if (caps[cat] && raw > caps[cat]) {
            return { ...t, amount: parseFloat(t.amount) < 0 ? -caps[cat] : caps[cat], isWinsorized: true };
        }
        return t;
    });
}

/**
 * Computes medians for each category to use as replacement for known anomalies.
 */
function computeCategoryMedians(transactions) {
    const byCategory = {};
    transactions.forEach(t => {
        const cat = t.categories_id;
        if (!cat) return;
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(Math.abs(parseFloat(t.amount)));
    });

    const medians = {};
    for (const [cat, amounts] of Object.entries(byCategory)) {
        if (amounts.length === 0) continue;
        amounts.sort((a, b) => a - b);
        const mid = Math.floor(amounts.length / 2);
        medians[cat] = amounts.length % 2 !== 0 ? amounts[mid] : (amounts[mid - 1] + amounts[mid]) / 2;
    }
    return medians;
}

/**
 * Infers income schedule including semi-monthly and bi-weekly support.
 */
function inferIncomeSchedule(transactions, earningCategoryIds, monthlyIncomeEstimate) {
    const incomeTransactions = transactions.filter(
        t => earningCategoryIds.includes(t.categories_id) && parseFloat(t.amount) > 0
    );

    if (incomeTransactions.length < 3) {
        return [{ frequency: 'monthly', dayOfMonth: 1, amount: monthlyIncomeEstimate }];
    }

    const dayCounts = {};
    let totalIncome = 0;
    const monthlyData = {};

    incomeTransactions.forEach(t => {
        const date = t._parsedDate || new Date(t.date);
        const day = date.getDate();
        const month = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        
        dayCounts[day] = (dayCounts[day] || 0) + 1;
        totalIncome += parseFloat(t.amount);

        if (!monthlyData[month]) monthlyData[month] = { count: 0, amount: 0 };
        monthlyData[month].count += 1;
        monthlyData[month].amount += parseFloat(t.amount);
    });

    const sortedDays = Object.keys(dayCounts).sort((a, b) => dayCounts[b] - dayCounts[a]);
    const monthCount = Object.keys(monthlyData).length;
    const averageMonthlyIncome = totalIncome / monthCount;
    const averageIncomesPerMonth = Object.values(monthlyData).reduce((sum, m) => sum + m.count, 0) / monthCount;

    // Detect Monthly
    if (averageIncomesPerMonth >= 0.8 && averageIncomesPerMonth <= 1.4) {
        return [{ frequency: 'monthly', dayOfMonth: parseInt(sortedDays[0]), amount: averageMonthlyIncome }];
    } 
    // Detect Semi-Monthly or Bi-Weekly (improved range)
    else if (averageIncomesPerMonth > 1.8 && averageIncomesPerMonth <= 2.6) {
        const payday1 = parseInt(sortedDays[0]);
        const payday2 = parseInt(sortedDays[1]);
        return [
            { frequency: 'monthly', dayOfMonth: payday1, amount: averageMonthlyIncome / 2 },
            { frequency: 'monthly', dayOfMonth: payday2, amount: averageMonthlyIncome / 2 }
        ];
    }

    return [{ frequency: 'monthly', dayOfMonth: 1, amount: monthlyIncomeEstimate }];
}

/**
 * Core forecast simulation logic.
 */
const computeForecast = async (userId, options = {}) => {
    const duration = options.duration || 30;
    const { startDate, endDate } = getLookaheadDates(duration);
    const simStartDate = new Date(startDate);
    const simEndDate = new Date(endDate);

    const tables = env.NOCODB.TABLES;

    // 1. Fetch Data
    const [statementsRes, settingsRes, budgetRes, installmentsRes, earningCategoryIds] = await Promise.all([
        nocodbService.getRecords(tables.BANK_STATEMENTS, { where: `(user_id,eq,${userId})~and(date,le,exactDate,${startDate})`, limit: 10000 }),
        nocodbService.getRecords(tables.USER_SETTINGS, { where: `(user_id,eq,${userId})` }),
        nocodbService.getRecords(tables.BUDGETS, { where: `(user_id,eq,${userId})~and(is_active,eq,true)` }),
        nocodbService.getRecords(tables.INSTALLMENTS, { where: `(user_id,eq,${userId})~and(start_date,ge,exactDate,${startDate})~and(start_date,le,exactDate,${endDate})~and(paid,eq,false)` }),
        getEarningCategoryIds(userId)
    ]);

    const transactions = statementsRes.list || [];
    
    // Performance Optimization: Single pass for initial data processing
    let currentBalance = 0;
    let latestTxTime = 0;
    const transactionsByCategory = new Map();

    for (const t of transactions) {
        currentBalance += parseFloat(t.amount) || 0;

        // Parse date once and store time for comparisons
        const parsedDate = new Date(t.date);
        t._parsedDate = parsedDate;
        t._parsedTime = parsedDate.getTime();

        if (t._parsedTime > latestTxTime) {
            latestTxTime = t._parsedTime;
        }

        // Group by category to avoid N*M filtering later
        const catId = t.categories_id;
        if (catId != null) {
            let catArr = transactionsByCategory.get(catId);
            if (!catArr) {
                catArr = [];
                transactionsByCategory.set(catId, catArr);
            }
            catArr.push(t);
        }
    }

    const settings = settingsRes.list[0] || {};
    const monthlyIncomeEstimate = parseFloat(settings.monthly_income_estimate) || 0;
    const warningThreshold = parseFloat(settings.warning_threshold) || 0;

    // 2. Data Freshness
    const staleDays = latestTxTime > 0 ? Math.floor((Date.now() - latestTxTime) / 86400000) : null;
    const dataFreshness = {
        latestRecordDate: latestTxTime > 0 ? new Date(latestTxTime).toISOString().split('T')[0] : null,
        staleDays,
        isStale: staleDays !== null && staleDays > 3
    };

    // 3. Clean Historical Data for Weights
    let historicalSpending = transactions.filter(t => parseFloat(t.amount) < 0);
    
    // Apply intelligence mask (soft-exclude anomalies)
    if (options.anomalyMask && options.anomalyMask.size > 0) {
        const medians = computeCategoryMedians(historicalSpending);
        historicalSpending = historicalSpending.map(t => {
            if (options.anomalyMask.has(t.Id)) {
                const median = medians[t.categories_id] || Math.abs(parseFloat(t.amount));
                // Preserve parsed date when mapping
                return { ...t, amount: -median, isMasked: true };
            }
            return t;
        });
    }

    // Apply Winsorization
    const cleanedHistoricalSpending = winsorizeTransactions(historicalSpending);

    // Group cleaned spending by category for O(1) lookups
    const cleanedSpendingByCategory = new Map();
    for (const t of cleanedHistoricalSpending) {
        const catId = t.categories_id;
        if (catId != null) {
            let catArr = cleanedSpendingByCategory.get(catId);
            if (!catArr) {
                catArr = [];
                cleanedSpendingByCategory.set(catId, catArr);
            }
            catArr.push(t);
        }
    }

    // 4. Inferences
    const incomeSchedule = inferIncomeSchedule(transactions, earningCategoryIds, monthlyIncomeEstimate);

    // 5. Simulation Preparation
    const simStartTime = simStartDate.getTime();

    const budgetProjections = (budgetRes.list || []).map(budget => {
        const budgetCatId = budget.categories_id;
        const catCleanedTx = cleanedSpendingByCategory.get(budgetCatId) || [];

        const weights = calculateSpendingWeights(catCleanedTx);

        // Fast filtering using pre-grouped map and cached times
        const catAllTx = transactionsByCategory.get(budgetCatId) || [];
        const budgetStartTime = new Date(budget.start_date).getTime();

        let totalSpentBefore = 0;
        for (const t of catAllTx) {
            if (t._parsedTime >= budgetStartTime && t._parsedTime < simStartTime) {
                totalSpentBefore += (parseFloat(t.amount) || 0);
            }
        }

        const remainingToDistribute = parseFloat(budget.target_amount) + totalSpentBefore;
        
        let totalRemainingWeight = 0;
        const effectiveStart = new Date(Math.max(simStartTime, budgetStartTime));
        const budgetEndDate = new Date(budget.end_date);
        for (let d = new Date(effectiveStart); d <= budgetEndDate; d.setDate(d.getDate() + 1)) {
            totalRemainingWeight += weights[d.getDay()];
        }

        return { ...budget, weights, totalRemainingWeight, remainingToDistribute, effectiveStart };
    });

    // 6. Simulation Loop
    const dailyBalances = [];
    const warnings = [];
    let currentSimBalance = currentBalance;

    for (let d = new Date(simStartDate); d <= simEndDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        let dailyIncome = 0;
        let dailyExpense = 0;

        // Income
        incomeSchedule.forEach(rule => {
            if (rule.frequency === 'monthly' && d.getDate() === rule.dayOfMonth) {
                currentSimBalance += rule.amount;
                dailyIncome += rule.amount;
            }
        });

        // Fixed Expenses
        const due = (installmentsRes.list || []).filter(inst => inst.start_date === dateStr);
        due.forEach(inst => {
            const amt = parseFloat(inst.installment_payment) || 0;
            currentSimBalance -= amt;
            dailyExpense += amt;
        });

        // Variable Expenses
        budgetProjections.forEach(budget => {
            if (d >= budget.effectiveStart && d <= new Date(budget.end_date)) {
                const dailyWeight = budget.weights[d.getDay()];
                if (budget.totalRemainingWeight > 0) {
                    const dailyAmt = (dailyWeight / budget.totalRemainingWeight) * budget.remainingToDistribute;
                    currentSimBalance -= dailyAmt;
                    dailyExpense += dailyAmt;
                }
            }
        });

        // Check for threshold
        if (currentSimBalance < warningThreshold) {
            warnings.push({ date: dateStr, balance: currentSimBalance, threshold: warningThreshold });
        }

        dailyBalances.push({ date: dateStr, balance: currentSimBalance, income: dailyIncome, expense: dailyExpense });
    }

    // 1.5. Calculate Summary Metrics
    const lowestProjectedBalance = Math.min(...dailyBalances.map(d => d.balance));
    const averageProjectedBalance = dailyBalances.length > 0 
        ? dailyBalances.reduce((sum, d) => sum + d.balance, 0) / dailyBalances.length 
        : 0;
    const totalProjectedIncome = dailyBalances.reduce((sum, d) => sum + d.income, 0);
    const totalProjectedExpenses = dailyBalances.reduce((sum, d) => sum + d.expense, 0);

    const summaryMetrics = {
        lowestProjectedBalance,
        averageProjectedBalance,
        totalProjectedIncome,
        totalProjectedExpenses,
        dataFreshness
    };

    return {
        dailyBalances,
        summaryMetrics,
        warnings,
        warningThreshold
    };
};

module.exports = {
    computeForecast,
    winsorizeTransactions,
    computeCategoryMedians
};
