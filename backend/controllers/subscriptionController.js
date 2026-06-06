const catchAsync = require('../utils/catchAsync');
const subscriptionService = require('../services/subscriptionService');
const nocodbService = require('../services/nocodbService');
const AppError = require('../utils/AppError');
const env = require('../config/env');

const SUBSCRIPTIONS_TABLE_ID = env.NOCODB.TABLES.SUBSCRIPTIONS;

exports.getSubscriptions = catchAsync(async (req, res, _next) => {
    const userId = req.user.uid;

    // Parallel fetch
    const [trackedSubscriptions, suggestions] = await Promise.all([
        subscriptionService.getSubscriptionsByUser(userId),
        subscriptionService.findRecurringTransactions(userId)
    ]);

    // Filter suggestions that are already tracked
    const trackedNames = new Set(trackedSubscriptions.map(s => (s.name || '').toLowerCase()));
    
    const filteredSuggestions = suggestions.filter(s => 
        !trackedNames.has((s.description || '').toLowerCase())
    );

    res.status(200).json({
        status: 'success',
        data: {
            subscriptions: trackedSubscriptions,
            suggestions: filteredSuggestions
        }
    });
});

exports.createSubscription = catchAsync(async (req, res, _next) => {
    const newSubscription = await subscriptionService.createSubscription({
        ...req.body,
        user_id: req.user.uid,
        status: req.body.status || 'Active'
    });

    res.status(201).json({
        status: 'success',
        data: {
            subscription: newSubscription
        }
    });
});

exports.updateSubscription = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.uid;

    const existingRecord = await nocodbService.getRecordById(SUBSCRIPTIONS_TABLE_ID, id);

    if (!existingRecord || Object.keys(existingRecord).length === 0) {
        return next(new AppError('Subscription not found.', 404));
    }

    if (existingRecord.user_id !== userId) {
        return next(new AppError('Forbidden: You do not have permission to edit this subscription.', 403));
    }

    const updatedSubscription = await subscriptionService.updateSubscription(id, req.body);

    res.status(200).json({
        status: 'success',
        data: {
            subscription: updatedSubscription
        }
    });
});

exports.deleteSubscription = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.uid;

    const existingRecord = await nocodbService.getRecordById(SUBSCRIPTIONS_TABLE_ID, id);

    if (!existingRecord || Object.keys(existingRecord).length === 0) {
        return next(new AppError('Subscription not found.', 404));
    }

    if (existingRecord.user_id !== userId) {
        return next(new AppError('Forbidden: You do not have permission to delete this subscription.', 403));
    }

    await subscriptionService.deleteSubscription(id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});