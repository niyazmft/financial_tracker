const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const anomalyService = require('../services/anomalyService');
const nocodbService = require('../services/nocodbService');
const env = require('../config/env');

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

    if (list.length === 0 || !list[0].anomaly_detection_enabled) {
        return res.json({
            success: true,
            anomalies: [],
            message: 'Anomaly detection is disabled.'
        });
    }

    const settings = list[0];
    const sensitivity = settings.anomaly_detection_sensitivity || 3;

    const anomalyData = await anomalyService.detectSpendingAnomalies(userId, sensitivity);

    res.json({
        success: true,
        ...anomalyData
    });
});

module.exports = {
    getAnomalies,
};
