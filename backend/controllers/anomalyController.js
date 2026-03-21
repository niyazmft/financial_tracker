const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const anomalyService = require('../services/anomalyService');
const nocodbService = require('../services/nocodbService');
const env = require('../config/env');

const intelligenceService = require('../services/intelligenceService');

const getAnomalies = catchAsync(async (req, res, next) => {
    const userId = req.user.uid;

    const USER_SETTINGS_TABLE_ID = env.NOCODB.TABLES.USER_SETTINGS;
    if (!USER_SETTINGS_TABLE_ID) {
        return next(new AppError('USER_SETTINGS_TABLE_ID is not configured.', 500));
    }

    const { list } = await nocodbService.getRecords(USER_SETTINGS_TABLE_ID, {
        where: `(user_id,eq,${userId})`,
        limit: 1,
    });

    const settings = list[0] || {};
    if (!settings.anomaly_detection_enabled) {
        return res.json({
            success: true,
            anomalies: [],
            message: 'Anomaly detection is disabled.'
        });
    }

    const sensitivity = settings.anomaly_detection_sensitivity || 3;
    const anomalyData = await anomalyService.detectSpendingAnomalies(userId, sensitivity);

    res.json({
        success: true,
        ...anomalyData
    });
});

const getIntelligenceAdvisory = catchAsync(async (req, res, _next) => {
    const userId = req.user.uid;
    
    // 1. Fetch user settings for sensitivity
    const { list } = await nocodbService.getRecords(env.NOCODB.TABLES.USER_SETTINGS, {
        where: `(user_id,eq,${userId})`,
        limit: 1,
    });
    
    const settings = list[0] || { anomaly_detection_sensitivity: 3 };
    
    // 2. Call the Intelligence Loop orchestrator
    const advisory = await intelligenceService.getUnifiedAdvisory(userId, {
        sensitivity: settings.anomaly_detection_sensitivity
    });

    res.json(advisory);
});

module.exports = {
    getAnomalies,
    getIntelligenceAdvisory
};
