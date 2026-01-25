const nocodbService = require('../services/nocodbService');
const { getLookaheadDates, formatDateForDisplay } = require('../utils/dateUtils');
const { getEarningCategoryIds } = require('../services/categoryService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/**
 * Calculates spending weights for each day of the week based on historical transactions.
 * @param {Array} historicalSpending - Array of transaction objects.
 * @param {number} categoryId - The category ID to analyze.
 * @returns {Array<number>} A 7-element array with spending weights for Sunday to Saturday.
 */
function calculateSpendingWeights(historicalSpending, categoryId) {
    const dayOfWeekTotals = Array(7).fill(0);
    const categoryTransactions = historicalSpending.filter(
        t => t.categories_id === categoryId && parseFloat(t.amount) < 0
    );

    if (categoryTransactions.length === 0) {
        // No historical data, return even distribution
        return Array(7).fill(1 / 7);
    }

    categoryTransactions.forEach(t => {
        const transactionDate = new Date(t.date);
        const dayOfWeek = transactionDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        dayOfWeekTotals[dayOfWeek] += Math.abs(parseFloat(t.amount));
    });

    const totalSpending = dayOfWeekTotals.reduce((sum, total) => sum + total, 0);

    if (totalSpending === 0) {
        // No spending, return even distribution
        return Array(7).fill(1 / 7);
    }

    // Normalize to get weights
    const weights = dayOfWeekTotals.map(total => total / totalSpending);
    return weights;
}

/**
 * Infers income schedule from historical transactions.
 * @param {Array} transactions - All historical transactions.
 * @param {Array<number>} earningCategoryIds - Array of category IDs for earnings.
 * @param {number} monthlyIncomeEstimate - Fallback monthly income estimate.
 * @returns {Array<object>} An array of income projection rules.
 */
function inferIncomeSchedule(transactions, earningCategoryIds, monthlyIncomeEstimate) {
    const incomeTransactions = transactions.filter(
        t => earningCategoryIds.includes(t.categories_id) && parseFloat(t.amount) > 0
    );

    if (incomeTransactions.length < 3) { // Not enough data for a reliable pattern
        return [{ frequency: 'monthly', dayOfMonth: 1, amount: monthlyIncomeEstimate }];
    }

    const dayCounts = {};
    let totalIncome = 0;
    const monthlyData = {};

    incomeTransactions.forEach(t => {
        const date = new Date(t.date);
        const day = date.getDate();
        const month = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        
        dayCounts[day] = (dayCounts[day] || 0) + 1;
        totalIncome += parseFloat(t.amount);

        if (!monthlyData[month]) {
            monthlyData[month] = { count: 0, amount: 0 };
        }
        monthlyData[month].count += 1;
        monthlyData[month].amount += parseFloat(t.amount);
    });

    const sortedDays = Object.keys(dayCounts).sort((a, b) => dayCounts[b] - dayCounts[a]);
    const monthCount = Object.keys(monthlyData).length;
    const averageMonthlyIncome = totalIncome / monthCount;
    const totalIncomeEvents = Object.values(monthlyData).reduce((sum, month) => sum + month.count, 0);
    const averageIncomesPerMonth = totalIncomeEvents / monthCount;

    // Simple pattern detection
    if (averageIncomesPerMonth > 0.8 && averageIncomesPerMonth < 1.4) { // Likely monthly
        const payday = parseInt(sortedDays[0]);
        return [{ frequency: 'monthly', dayOfMonth: payday, amount: averageMonthlyIncome }];
    } else if (averageIncomesPerMonth > 1.8 && averageIncomesPerMonth < 2.4) { // Likely semi-monthly
        const payday1 = parseInt(sortedDays[0]);
        const payday2 = parseInt(sortedDays[1]);
        return [
            { frequency: 'monthly', dayOfMonth: payday1, amount: averageMonthlyIncome / 2 },
            { frequency: 'monthly', dayOfMonth: payday2, amount: averageMonthlyIncome / 2 }
        ];
    }

    // Fallback to default
    return [{ frequency: 'monthly', dayOfMonth: 1, amount: monthlyIncomeEstimate }];
}

const getCashFlowWarnings = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { startDate, endDate } = getLookaheadDates();
    const installmentsTableId = env.NOCODB.TABLES.INSTALLMENTS;
    const userSettingsTableId = env.NOCODB.TABLES.USER_SETTINGS;
    const budgetsTableId = env.NOCODB.TABLES.BUDGETS;
    const categoriesTableId = env.NOCODB.TABLES.CATEGORIES;

    const installmentsQuery = `(user_id,eq,${verifiedUserId})~and(start_date,ge,exactDate,${startDate})~and(start_date,le,exactDate,${endDate})`;
    const userSettingsQuery = `(user_id,eq,${verifiedUserId})`;
    const budgetsQuery = `(user_id,eq,${verifiedUserId})~and(end_date,ge,exactDate,${startDate})~and(start_date,le,exactDate,${endDate})`;
    
    const [installmentsResponse, userSettingsResponse, budgetsResponse] = await Promise.all([
        nocodbService.getRecords(installmentsTableId, { where: installmentsQuery }),
        nocodbService.getRecords(userSettingsTableId, { where: userSettingsQuery }),
        nocodbService.getRecords(budgetsTableId, { where: budgetsQuery })
    ]);

    const installments = installmentsResponse.list || [];
    const userSettings = userSettingsResponse.list[0] || {};
    const monthlyIncomeEstimate = userSettings.monthly_income_estimate || 0;
    const budgets = budgetsResponse.list || [];
    const budgetCategoryIds = new Set(budgets.map(b => b.categories_id));

    const warnings = [];

    // Warning 1: Major Installment Due
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysEndDate = sevenDaysFromNow.toISOString().split('T')[0];

    installments.forEach(inst => {
        if (inst.start_date <= sevenDaysEndDate) {
            const amount = parseFloat(inst.amount);
            if (amount > 5000 || (monthlyIncomeEstimate > 0 && amount > monthlyIncomeEstimate * 0.5)) {
                warnings.push({
                    message: `URGENT: A major installment of ${amount.toFixed(2)} ${env.DEFAULT_CURRENCY} is due in ${Math.ceil((new Date(inst.start_date) - new Date()) / (1000 * 60 * 60 * 24))} days.`,
                    type: 'urgent',
                    call_to_action_link: '/installment_plans.html'
                });
            }
        }
    });

    // Warning 2: Debt Concentration
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
    const tenDaysEndDate = tenDaysFromNow.toISOString().split('T')[0];
    const debtConcentrationAmount = installments
        .filter(inst => inst.start_date <= tenDaysEndDate)
        .reduce((sum, inst) => sum + parseFloat(inst.amount), 0);

    if (debtConcentrationAmount > 15000 || (monthlyIncomeEstimate > 0 && debtConcentrationAmount > monthlyIncomeEstimate * 0.75)) {
        warnings.push({
            message: `PAYMENT BOMB: You have ${debtConcentrationAmount.toFixed(2)} ${env.DEFAULT_CURRENCY} in debt payments due over the next 10 days.`,
            type: 'critical',
            call_to_action_link: '/installment_plans.html'
        });
    }

    // Warning 3: Unbudgeted Debt
    const unbudgetedInstallments = installments.filter(inst => !budgetCategoryIds.has(inst.categories_id));
    if (unbudgetedInstallments.length > 0) {
        const categoryIds = [...new Set(unbudgetedInstallments.map(inst => inst.categories_id).filter(id => id))];
        if (categoryIds.length > 0) {
            const categoriesQuery = `(Id,in,${categoryIds.join(',')})`;
            const categoriesResponse = await nocodbService.getRecords(categoriesTableId, { where: categoriesQuery });
            const categoryList = categoriesResponse.list || [];
            const categories = categoryList.reduce((map, cat) => {
                map[cat.Id] = cat.category_name;
                return map;
            }, {});

            unbudgetedInstallments.forEach(inst => {
                warnings.push({
                    message: `PLANNING GAP: An installment for '${categories[inst.categories_id] || 'Unknown Category'}' is due, but you haven't set a budget target for it.`,
                    type: 'warning',
                    call_to_action_link: '/budget_manager.html'
                });
            });
        }
    }

    res.status(200).json(warnings);
});

const getCashFlowForecast = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const duration = req.query.duration || 30;
    const { startDate, endDate } = getLookaheadDates(duration);

    const BANK_STATEMENTS_TABLE_ID = env.NOCODB.TABLES.BANK_STATEMENTS;
    const USER_SETTINGS_TABLE_ID = env.NOCODB.TABLES.USER_SETTINGS;
    const INSTALLMENTS_PER_RECORD_TABLE_ID = env.NOCODB.TABLES.INSTALLMENTS;
    const BUDGET_MANAGER_TABLE_ID = env.NOCODB.TABLES.BUDGETS;

    const simStartDate = new Date(startDate);
    const simEndDate = new Date(endDate);

    // 1.3.1. Fetch Starting Balance
    const statementsResponse = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, { where: `(user_id,eq,${verifiedUserId})~and(date,le,exactDate,${startDate})`, limit: 10000 });
    const transactions = statementsResponse?.list || [];
    const currentBalance = transactions.reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0);

    // 1.3.2. Fetch Income Projection Data
    const settingsResponse = await nocodbService.getRecords(USER_SETTINGS_TABLE_ID, { where: `(user_id,eq,${verifiedUserId})` });
    const monthlyIncomeEstimate = settingsResponse?.list?.length > 0 ? (parseFloat(settingsResponse.list[0].monthly_income_estimate) || 0) : 0;
    const warningThreshold = settingsResponse?.list?.length > 0 ? (parseFloat(settingsResponse.list[0].warning_threshold) || 0) : 0;

    // Fetch last 12 months of transactions for income inference
    const oneYearAgo = new Date(simStartDate);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const incomeHistoryResponse = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, { where: `(user_id,eq,${verifiedUserId})~and(date,ge,exactDate,${oneYearAgo.toISOString().split('T')[0]})~and(date,le,exactDate,${startDate})`, limit: 1000 });
    const incomeTransactions = incomeHistoryResponse?.list || [];
    const earningCategoryIds = await getEarningCategoryIds(verifiedUserId);
    const incomeSchedule = inferIncomeSchedule(incomeTransactions, earningCategoryIds, monthlyIncomeEstimate);


    // 1.3.3. Fetch Fixed Expenses (Installments) Data
    const installmentsQuery = `(user_id,eq,${verifiedUserId})~and(start_date,ge,exactDate,${startDate})~and(start_date,le,exactDate,${endDate})~and(paid,eq,false)`;
    const installmentsResponse = await nocodbService.getRecords(INSTALLMENTS_PER_RECORD_TABLE_ID, { where: installmentsQuery });
    let upcomingInstallments = installmentsResponse?.list || [];

    // Fetch item names for installments
    const itemsTableId = env.NOCODB.TABLES.ITEMS;
    if (itemsTableId && upcomingInstallments.length > 0) {
        const itemIds = [...new Set(upcomingInstallments.map(inst => inst.items_id).filter(id => id))];

        if (itemIds.length > 0) {
            const itemsQuery = `(Id,in,${itemIds.join(',')})`;
            const itemsResponse = await nocodbService.getRecords(itemsTableId, { where: itemsQuery });
            const itemsMap = (itemsResponse.list || []).reduce((map, item) => {
                map[item.Id] = item.item_name;
                return map;
            }, {});

            upcomingInstallments = upcomingInstallments.map(inst => ({
                ...inst,
                item_name: itemsMap[inst.items_id] || 'Unnamed Payment'
            }));
        }
    }

    // 1.3.4. Fetch Variable Expenses (Budgets) Data
    const budgetQuery = `(user_id,eq,${verifiedUserId})~and(is_active,eq,true)`;
    const budgetsResponse = await nocodbService.getRecords(BUDGET_MANAGER_TABLE_ID, { where: budgetQuery });
    const activeBudgets = budgetsResponse?.list || [];

    let earliestBudgetStartDate = new Date(startDate); // Default to forecast start date
    if (activeBudgets.length > 0) {
        activeBudgets.forEach(budget => {
            const budgetStart = new Date(budget.start_date);
            if (budgetStart < earliestBudgetStartDate) {
                earliestBudgetStartDate = budgetStart;
            }
        });
    }
    
    const spendingQuery = `(user_id,eq,${verifiedUserId})~and(date,ge,exactDate,${earliestBudgetStartDate.toISOString().split('T')[0]})~and(date,le,exactDate,${endDate})`;
    const spendingResponse = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, { where: spendingQuery });
    let historicalSpending = spendingResponse?.list || [];
    
    // Pre-calculate spending weights and total remaining weight for each budget
    const budgetProjections = activeBudgets.map(budget => {
        const budgetStartDate = new Date(budget.start_date);
        const budgetEndDate = new Date(budget.end_date);

        const totalSpentForBudgetBeforeSimStart = historicalSpending
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.categories_id === budget.categories_id &&
                    transactionDate >= budgetStartDate &&
                    transactionDate < simStartDate;
            })
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

        const remainingBudgetToDistribute = parseFloat(budget.target_amount) + totalSpentForBudgetBeforeSimStart;

        const spendingWeights = calculateSpendingWeights(historicalSpending, budget.categories_id);

        let totalRemainingWeight = 0;
        const effectiveSimStartDate = new Date(Math.max(simStartDate.getTime(), budgetStartDate.getTime()));

        for (let day = new Date(effectiveSimStartDate); day <= budgetEndDate; day.setDate(day.getDate() + 1)) {
            const dayOfWeek = day.getDay(); // 0 = Sunday, 6 = Saturday
            totalRemainingWeight += spendingWeights[dayOfWeek];
        }

        return {
            ...budget,
            spendingWeights,
            totalRemainingWeight,
            remainingBudgetToDistribute,
            effectiveAllocationStartDate: effectiveSimStartDate,
            effectiveAllocationEndDate: budgetEndDate,
        };
    });

    // 1.4. Implement Daily Cash Flow Simulation Logic
    const dailyBalances = [];
    const warnings = [];
    let currentSimBalance = currentBalance;
            
    for (let d = new Date(simStartDate); d <= simEndDate; d.setDate(d.getDate() + 1)) {
        const currentDateStr = d.toISOString().split('T')[0];
        let dailyIncome = 0;
        let dailyExpense = 0;

        // 1.4.1. Apply Income based on inferred schedule
        incomeSchedule.forEach(rule => {
            let isPayday = false;
            if (rule.frequency === 'monthly' && d.getDate() === rule.dayOfMonth) {
                isPayday = true;
            }
            // Add more rules for weekly, bi-weekly etc. here if needed

            if (isPayday) {
                currentSimBalance += rule.amount;
                dailyIncome += rule.amount;
            }
        });

        // 1.4.2. Apply Fixed Expenses
        const dueInstallments = upcomingInstallments.filter(inst => {
            const installmentDate = new Date(inst.start_date);
            const simDate = new Date(currentDateStr);
            return installmentDate.getUTCFullYear() === simDate.getUTCFullYear() &&
                installmentDate.getUTCMonth() === simDate.getUTCMonth() &&
                installmentDate.getUTCDate() === simDate.getUTCDate();
        });
        dueInstallments.forEach(inst => {
            const expenseAmount = parseFloat(inst.installment_payment) || 0;
            currentSimBalance -= expenseAmount;
            dailyExpense += expenseAmount;
        });
        
        // 1.4.3. Apply Variable Expenses using weighted distribution
        budgetProjections.forEach(budget => {
            if (d >= budget.effectiveAllocationStartDate && d <= budget.effectiveAllocationEndDate) {
                const dayOfWeek = d.getDay();
                const dailyWeight = budget.spendingWeights[dayOfWeek];
                let dailyBudgetExpense = 0;
                if (budget.totalRemainingWeight > 0) {
                    dailyBudgetExpense = (dailyWeight / budget.totalRemainingWeight) * budget.remainingBudgetToDistribute;
                }
                currentSimBalance -= dailyBudgetExpense;
                dailyExpense += dailyBudgetExpense;
            }
        });

        // 1.4.5. Check for Warnings
        if (currentSimBalance < warningThreshold && !warnings.some(w => w.date === currentDateStr)) {
            let reason = "a combination of expenses"; // Default reason
            const totalInstallmentExpense = dueInstallments.reduce((sum, inst) => sum + (parseFloat(inst.installment_payment) || 0), 0);
            const totalVariableExpense = dailyExpense - totalInstallmentExpense;

            const largestInstallment = dueInstallments.reduce((max, inst) => {
                const amount = parseFloat(inst.installment_payment) || 0;
                return amount > max.amount ? { amount, name: inst.item_name || 'Unnamed Payment' } : max;
            }, { amount: 0, name: '' });

            // Generate a more specific reason
            if (largestInstallment.amount > dailyExpense * 0.6) { // A single large payment is the main cause
                reason = `a large payment of ${largestInstallment.amount.toFixed(2)} for "${largestInstallment.name}"`;
            } else if (totalInstallmentExpense > 0 && totalVariableExpense > 0) {
                reason = `payments totaling ${totalInstallmentExpense.toFixed(2)} and projected spending of ${totalVariableExpense.toFixed(2)}`;
            } else if (totalInstallmentExpense > 0) {
                reason = `payments totaling ${totalInstallmentExpense.toFixed(2)}`;
            } else if (totalVariableExpense > 0) {
                reason = `high projected spending of ${totalVariableExpense.toFixed(2)}`;
            }

            const formattedDate = formatDateForDisplay(d);
            const message = `Alert for ${formattedDate}: Balance may drop below threshold (${warningThreshold}) due to ${reason}.`;
            
            warnings.push({
                message: message,
                type: 'warning',
                date: currentDateStr,
                details: {
                    balance: currentSimBalance,
                    threshold: warningThreshold,
                    dailyExpense: dailyExpense
                }
            });
        }

        // 1.4.4. Record Daily Balance
        dailyBalances.push({ date: currentDateStr, balance: currentSimBalance, income: dailyIncome, expense: dailyExpense });
    }

    // 1.5. Calculate Summary Metrics
    const lowestProjectedBalance = Math.min(...dailyBalances.map(d => d.balance));
    const averageProjectedBalance = dailyBalances.reduce((sum, d) => sum + d.balance, 0) / dailyBalances.length;
    const totalProjectedIncome = dailyBalances.reduce((sum, d) => sum + d.income, 0);
    const totalProjectedExpenses = dailyBalances.reduce((sum, d) => sum + d.expense, 0);

    const summaryMetrics = {
        lowestProjectedBalance,
        averageProjectedBalance,
        totalProjectedIncome,
        totalProjectedExpenses,
        currency: env.DEFAULT_CURRENCY
    };

    res.status(200).json({
        success: true,
        dailyBalances,
        summaryMetrics,
        warnings,
        warningThreshold
    });
});

module.exports = {
    getCashFlowWarnings,
    getCashFlowForecast,
};
