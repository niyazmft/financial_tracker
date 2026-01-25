const catchAsync = require('../utils/catchAsync');
const subscriptionService = require('../services/subscriptionService');
const AppError = require('../utils/AppError');

exports.getSubscriptions = catchAsync(async (req, res, next) => {
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

exports.createSubscription = catchAsync(async (req, res, next) => {
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
    const updatedSubscription = await subscriptionService.updateSubscription(req.params.id, req.body);

    res.status(200).json({
        status: 'success',
        data: {
            subscription: updatedSubscription
        }
    });
});

exports.deleteSubscription = catchAsync(async (req, res, next) => {
    await subscriptionService.deleteSubscription(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    });
});