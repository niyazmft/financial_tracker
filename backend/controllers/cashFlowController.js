const cashFlowService = require('../services/cashFlowService');
const catchAsync = require('../utils/catchAsync');
const env = require('../config/env');

const MAX_FORECAST_DURATION = 365; // Upper bound to prevent CPU DoS via unbounded per-day simulation

/**
 * Endpoint for summarized cash flow warnings (backward compatible).
 */
const getCashFlowWarnings = catchAsync(async (req, res, _next) => {
    const verifiedUserId = req.user.uid;
    
    // We call the service to get the latest simulation
    const forecast = await cashFlowService.computeForecast(verifiedUserId, { duration: 30 });
    
    // Transform service warnings into the expected API format if necessary
    const formattedWarnings = (forecast.warnings || []).map(w => ({
        message: `Alert for ${w.date}: Balance may drop below threshold (${w.threshold})`,
        type: 'warning',
        date: w.date,
        details: w
    }));

    res.status(200).json(formattedWarnings);
});

/**
 * Endpoint for the full 30-day balance projection.
 */
const getCashFlowForecast = catchAsync(async (req, res, _next) => {
    const verifiedUserId = req.user.uid;
    const rawDuration = parseInt(req.query.duration, 10);
    const duration = Number.isNaN(rawDuration) ? 30 : Math.min(Math.max(rawDuration, 1), MAX_FORECAST_DURATION);

    const forecast = await cashFlowService.computeForecast(verifiedUserId, { duration });

    // Add confidence bands so the UI can show forecast uncertainty
    const dailyBalancesWithBands = cashFlowService.computeConfidenceBands(forecast.dailyBalances);

    // Transform service warnings into the expected API format (message/type/details)
    const formattedWarnings = (forecast.warnings || []).map(w => ({
        message: `Alert for ${w.date}: Balance may drop below threshold (${w.threshold})`,
        type: w.balance < 0 ? 'urgent' : 'warning',
        date: w.date,
        details: w
    }));

    res.status(200).json({
        success: true,
        ...forecast,
        dailyBalances: dailyBalancesWithBands,
        warnings: formattedWarnings,
        currency: env.DEFAULT_CURRENCY
    });
});

module.exports = {
    getCashFlowWarnings,
    getCashFlowForecast,
};
