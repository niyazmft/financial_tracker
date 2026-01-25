const nocodbService = require('./nocodbService');

const BANK_STATEMENTS_TABLE_ID = process.env.BANK_STATEMENTS_TABLE_ID;
const SAVINGS_GOALS_TABLE_ID = process.env.SAVINGS_GOALS_TABLE_ID || 'mqe77ttqd3ge3yc';

exports.getGoalsWithProgress = async (verifiedUserId) => {
    // 1. Calculate Total Savings Pool
    // Fetch all transactions for the user
    // Optimization: In a real app with millions of records, we would aggregate this in the DB.
    // For now, fetching all is consistent with other parts of this app.
    const allTransactionsResponse = await nocodbService.getRecords(BANK_STATEMENTS_TABLE_ID, {
        where: `(user_id,eq,${verifiedUserId})`,
        limit: 10000 // Fetch a large enough sample
    });
    const transactions = allTransactionsResponse.list || [];

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
        const amount = parseFloat(t.amount);
        if (amount > 0) {
            totalIncome += amount;
        } else {
            totalExpenses += Math.abs(amount);
        }
    });

    let savingsPool = totalIncome - totalExpenses;
    // Ensure savings pool is not negative for allocation purposes (though debt is real)
    let availableFunds = Math.max(0, savingsPool);

    // 2. Fetch User Goals
    const goalsResponse = await nocodbService.getRecords(SAVINGS_GOALS_TABLE_ID, {
        where: `(user_id,eq,${verifiedUserId})`,
        sort: 'priority' // Sort by priority ascending (1, 2, 3...)
    });
    const goals = goalsResponse.list || [];

    // 3. Waterfall Allocation
    const goalsWithProgress = goals.map(goal => {
        const targetAmount = parseFloat(goal.target_amount);
        let allocatedAmount = 0;

        if (availableFunds > 0) {
            if (availableFunds >= targetAmount) {
                allocatedAmount = targetAmount;
                availableFunds -= targetAmount;
            } else {
                allocatedAmount = availableFunds;
                availableFunds = 0;
            }
        }

        return {
            ...goal,
            current_amount: allocatedAmount,
            progress_percentage: targetAmount > 0 ? (allocatedAmount / targetAmount) * 100 : 0,
            is_fully_funded: allocatedAmount >= targetAmount
        };
    });

    return {
        totalSavingsPool: savingsPool,
        goals: goalsWithProgress
    };
};
