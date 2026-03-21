const cashFlowService = require('../services/cashFlowService');
const { getLookaheadDates } = require('../utils/dateUtils');
const catchAsync = require('../utils/catchAsync');
const env = require('../config/env');

/**
 * Endpoint for summarized cash flow warnings (backward compatible).
 */
const getCashFlowWarnings = catchAsync(async (req, res, next) => {
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
const getCashFlowForecast = catchAsync(async (req, res, next) => {
    const verifiedUserId = req.user.uid;
    const duration = parseInt(req.query.duration) || 30;

    const forecast = await cashFlowService.computeForecast(verifiedUserId, { duration });

    res.status(200).json({
        success: true,
        ...forecast,
        currency: env.DEFAULT_CURRENCY
    });
});

module.exports = {
    getCashFlowWarnings,
    getCashFlowForecast,
};
