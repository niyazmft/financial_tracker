const nocodbService = require('../services/nocodbService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const createBudget = catchAsync(async (req, res, next) => {
    const { categories_id, target_amount, start_date, end_date } = req.body;
    const userId = req.user.uid;

    // 1. Validation
    if (!categories_id || !target_amount || !start_date || !end_date) {
        return next(new AppError('Missing required fields.', 400));
    }
    if (isNaN(parseFloat(target_amount)) || parseFloat(target_amount) <= 0) {
        return next(new AppError('Invalid target amount.', 400));
    }
    if (new Date(start_date) > new Date(end_date)) {
        return next(new AppError('Start date must be before or on the end date.', 400));
    }

    const budgetsTableId = env.NOCODB.TABLES.BUDGETS;

    // 2. Construct Payload
    const payload = {
        categories_id,
        target_amount: parseFloat(target_amount),
        end_date,
        start_date,
        user_id: userId,
        is_active: true,
    };

    // 3. Proxy to NocoDB
    const response = await nocodbService.createRecord(budgetsTableId, payload);
    res.status(201).json(response);
});

const updateBudget = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.uid;
    const { categories_id, target_amount, start_date, end_date } = req.body;

    // 1. Validation
    if (!categories_id || !target_amount || !start_date || !end_date) {
        return next(new AppError('Missing required fields.', 400));
    }
    if (isNaN(parseFloat(target_amount)) || parseFloat(target_amount) <= 0) {
        return next(new AppError('Invalid target amount.', 400));
    }
    if (new Date(start_date) > new Date(end_date)) {
        return next(new AppError('Start date must be before or on the end date.', 400));
    }

    const budgetsTableId = env.NOCODB.TABLES.BUDGETS;

    // 2. Verify ownership
    const existingRecord = await nocodbService.getRecordById(budgetsTableId, id);

    if (!existingRecord || Object.keys(existingRecord).length === 0) {
        return next(new AppError('Budget not found.', 404));
    }

    if (existingRecord.user_id !== userId) {
        return next(new AppError('Forbidden: You do not have permission to edit this budget.', 403));
    }

    // 3. Construct Payload and proxy to NocoDB
    const payload = {
        Id: id,
        categories_id,
        target_amount: parseFloat(target_amount),
        end_date,
        start_date,
    };

    const response = await nocodbService.updateRecord(budgetsTableId, payload);
    res.json(response);
});

const deleteBudget = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.uid;

    const budgetsTableId = env.NOCODB.TABLES.BUDGETS;

    // 2. Verify ownership
    const existingRecord = await nocodbService.getRecordById(budgetsTableId, id);

    if (!existingRecord || Object.keys(existingRecord).length === 0) {
        return next(new AppError('Budget not found.', 404));
    }

    if (existingRecord.user_id !== userId) {
        return next(new AppError('Forbidden: You do not have permission to delete this budget.', 403));
    }

    // 3. Proceed with deletion
    await nocodbService.deleteRecord(budgetsTableId, id);

    res.json({ success: true, message: 'Budget deleted successfully.' });
});

const getActiveBudgets = catchAsync(async (req, res, _next) => {
    const userId = req.user.uid;
    const today = new Date().toISOString().split('T')[0];

    const budgetsTableId = env.NOCODB.TABLES.BUDGETS;
    const statementsTableId = env.NOCODB.TABLES.BANK_STATEMENTS;

    // 1. Fetch all active budgets for the user
    const budgetQuery = `(user_id,eq,${userId})~and(start_date,le,exactDate,${today})~and(end_date,ge,exactDate,${today})~and(is_active,eq,true)`;
    const budgetsResponse = await nocodbService.getRecords(budgetsTableId, { where: budgetQuery });
    const activeBudgets = budgetsResponse.list;

    if (!activeBudgets || activeBudgets.length === 0) {
        return res.json({ success: true, budgets: [] });
    }

    // 2. Fetch all relevant transactions in a single query to avoid N+1 problem
    let minDateStr = activeBudgets[0].start_date;
    let maxDateStr = activeBudgets[0].end_date;

    for (const budget of activeBudgets) {
        if (budget.start_date < minDateStr) minDateStr = budget.start_date;
        if (budget.end_date > maxDateStr) maxDateStr = budget.end_date;
    }

    const spendingQuery = `(user_id,eq,${userId})~and(date,ge,exactDate,${minDateStr})~and(date,le,exactDate,${maxDateStr})`;
    const statementsResponse = await nocodbService.getRecords(statementsTableId, { where: spendingQuery, limit: 10000 });
    const allTransactions = statementsResponse.list || [];

    // 3. Calculate spent amount per budget in memory
    // Group transactions by category to optimize lookup from O(B*T) to O(B+T)
    const transactionsByCategory = Object.groupBy(allTransactions, (t) => Number(t.categories_id));

    const budgetsWithSpending = activeBudgets.map((budget) => {
        let spentAmount = 0;
        const categoryId = Number(budget.categories_id);
        const relevantTransactions = transactionsByCategory[categoryId] || [];

        for (const transaction of relevantTransactions) {
            // Check if transaction belongs to this budget's date range
            if (
                transaction.date >= budget.start_date &&
                transaction.date <= budget.end_date
            ) {
                const amount = parseFloat(transaction.amount);
                // Only sum negative amounts as spending
                if (amount < 0) {
                    spentAmount += Math.abs(amount);
                }
            }
        }

        return {
            ...budget,
            spent_amount: spentAmount,
        };
    });

    res.json({ success: true, budgets: budgetsWithSpending });
});

module.exports = {
    createBudget,
    updateBudget,
    deleteBudget,
    getActiveBudgets,
};
