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

    if (existingRecord.user_id !== userId) {
        return next(new AppError('Forbidden: You do not have permission to delete this budget.', 403));
    }

    // 3. Proceed with deletion
    await nocodbService.deleteRecord(budgetsTableId, id);

    res.json({ success: true, message: 'Budget deleted successfully.' });
});

const getActiveBudgets = catchAsync(async (req, res, next) => {
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

    // 2. For each budget, fetch the corresponding transactions to calculate spending
    const budgetPromises = activeBudgets.map(async (budget) => {
        const spendingQuery = `(user_id,eq,${userId})~and(categories_id,eq,${budget.categories_id})~and(date,ge,exactDate,${budget.start_date})~and(date,le,exactDate,${budget.end_date})`;
        
        const statementsResponse = await nocodbService.getRecords(statementsTableId, { where: spendingQuery });
        const transactions = statementsResponse.list;

        const spentAmount = transactions.reduce((sum, transaction) => {
            const amount = parseFloat(transaction.amount);
            // Only sum negative amounts as spending
            return amount < 0 ? sum + Math.abs(amount) : sum;
        }, 0);

        return {
            ...budget,
            spent_amount: spentAmount,
        };
    });

    const budgetsWithSpending = await Promise.all(budgetPromises);

    res.json({ success: true, budgets: budgetsWithSpending });
});

module.exports = {
    createBudget,
    updateBudget,
    deleteBudget,
    getActiveBudgets,
};
