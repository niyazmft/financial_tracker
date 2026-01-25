const nocodbService = require('../services/nocodbService');
const savingsGoalService = require('../services/savingsGoalService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const SAVINGS_GOALS_TABLE_ID = process.env.SAVINGS_GOALS_TABLE_ID || 'mqe77ttqd3ge3yc';

exports.getGoals = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const result = await savingsGoalService.getGoalsWithProgress(verifiedUserId);

    res.status(200).json({
        status: 'success',
        data: result
    });
});

exports.createGoal = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const { goal_name, target_amount, priority, target_date } = req.body;

    if (!goal_name || !target_amount || !priority || !target_date) {
        return next(new AppError('Goal name, target amount, priority, and target date are required', 400));
    }

    // Free tier check (optional implementation later, for now allow creation)
    // We could check if (goals.length >= 1) here if we wanted to enforce the single goal limit strictly on backend.
    // But as discussed, we are building the multi-goal backend now.

    const newGoal = await nocodbService.createRecord(SAVINGS_GOALS_TABLE_ID, {
        user_id: verifiedUserId,
        goal_name,
        target_amount,
        priority,
        target_date
    });

    res.status(201).json({
        status: 'success',
        data: {
            goal: newGoal
        }
    });
});

exports.updateGoal = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { goal_name, target_amount, priority, target_date } = req.body;

    const updatedGoal = await nocodbService.updateRecord(SAVINGS_GOALS_TABLE_ID, {
        Id: id,
        goal_name,
        target_amount,
        priority,
        target_date
    });

    res.status(200).json({
        status: 'success',
        data: {
            goal: updatedGoal
        }
    });
});

exports.deleteGoal = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    await nocodbService.deleteRecord(SAVINGS_GOALS_TABLE_ID, id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});
