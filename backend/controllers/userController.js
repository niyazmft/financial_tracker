const transactionService = require('../services/transactionService');
const nocodbService = require('../services/nocodbService');
const emailService = require('../services/emailService');
const admin = require('../config/firebase');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const env = require('../config/env');
const axios = require('axios');

/**
 * Proxies external profile images to avoid Opaque Response Blocking (ORB).
 */
const proxyProfileImage = catchAsync(async (req, res, next) => {
    const { url } = req.query;
    if (!url) {
        return next(new AppError('Image URL is required', 400));
    }

    // Security: Only allow specific known domains
    const allowedDomains = ['lh3.googleusercontent.com', 'googleusercontent.com'];
    const urlObj = new URL(url);
    if (!allowedDomains.some(domain => urlObj.hostname.endsWith(domain))) {
        return next(new AppError('Unauthorized image domain', 403));
    }

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        response.data.pipe(res);
    } catch (error) {
        console.error('Error proxying image:', error.message);
        res.status(404).send('Image not found');
    }
});

/**
 * Helper to fetch a user's settings record or create one with defaults if it doesn't exist.
 * @param {string} userId - The user's ID.
 * @returns {Promise<object>} The user settings record from NocoDB.
 */
const _getOrCreateUserSettings = async (userId) => {
    const USER_SETTINGS_TABLE_ID = env.NOCODB.TABLES.USER_SETTINGS;
    if (!USER_SETTINGS_TABLE_ID) {
        throw new AppError('USER_SETTINGS_TABLE_ID is not configured.', 500);
    }

    const { list } = await nocodbService.getRecords(USER_SETTINGS_TABLE_ID, {
        where: `(user_id,eq,${userId})`,
        limit: 1,
    });

    if (list.length > 0) {
        // Ensure currency has a default if not set in the database
        list[0].currency = list[0].currency || env.DEFAULT_CURRENCY;
        // Set default anomaly detection settings if they don't exist or are null
        list[0].anomaly_detection_enabled = list[0].anomaly_detection_enabled || false;
        list[0].anomaly_detection_sensitivity = list[0].anomaly_detection_sensitivity || 3;
        return list[0];
    }

    // If no settings exist, create a new record with default values
    return nocodbService.createRecord(USER_SETTINGS_TABLE_ID, {
        user_id: userId,
        monthly_income_estimate: 0,
        currency: env.DEFAULT_CURRENCY,
        anomaly_detection_enabled: false,
        anomaly_detection_sensitivity: 3,
        onboarding_completed: false
    });
};

const getFirebaseConfig = catchAsync(async (req, res) => {
    res.json(env.FIREBASE.CLIENT_CONFIG);
});

const getUserSettings = catchAsync(async (req, res, next) => {
    const settings = await _getOrCreateUserSettings(req.user.uid);
    res.json(settings);
});

const updateUserSettings = catchAsync(async (req, res, next) => {
    const { monthly_income_estimate, currency, time_zone, anomaly_detection_enabled, anomaly_detection_sensitivity, dismissed_warnings, onboarding_completed } = req.body;
    const USER_SETTINGS_TABLE_ID = env.NOCODB.TABLES.USER_SETTINGS;

    const updatePayload = {};

    if (monthly_income_estimate !== undefined) {
        if (typeof monthly_income_estimate !== 'number' || monthly_income_estimate < 0) {
            return next(new AppError('Invalid monthly_income_estimate. It must be a non-negative number.', 400));
        }
        updatePayload.monthly_income_estimate = monthly_income_estimate;
    }

    if (currency !== undefined) {
        if (typeof currency !== 'string' || currency.length !== 3) {
            return next(new AppError('Invalid currency. It must be a 3-letter string.', 400));
        }
        updatePayload.currency = currency.toUpperCase();
    }

    if (time_zone !== undefined) {
        if (typeof time_zone !== 'string') {
            return next(new AppError('Invalid time_zone. It must be a string.', 400));
        }
        updatePayload.time_zone = time_zone;
    }

    if (anomaly_detection_enabled !== undefined) {
        if (typeof anomaly_detection_enabled !== 'boolean') {
            return next(new AppError('Invalid anomaly_detection_enabled. It must be a boolean.', 400));
        }
        updatePayload.anomaly_detection_enabled = anomaly_detection_enabled;
    }

    if (anomaly_detection_sensitivity !== undefined) {
        if (typeof anomaly_detection_sensitivity !== 'number' || anomaly_detection_sensitivity < 1 || anomaly_detection_sensitivity > 10) {
            return next(new AppError('Invalid anomaly_detection_sensitivity. It must be a number between 1 and 10.', 400));
        }
        updatePayload.anomaly_detection_sensitivity = anomaly_detection_sensitivity;
    }

    if (dismissed_warnings !== undefined) {
        if (typeof dismissed_warnings !== 'object' || dismissed_warnings === null) {
             return next(new AppError('Invalid dismissed_warnings. It must be a JSON object.', 400));
        }
        updatePayload.dismissed_warnings = JSON.stringify(dismissed_warnings);
    }

    if (onboarding_completed !== undefined) {
        if (typeof onboarding_completed !== 'boolean') {
            return next(new AppError('Invalid onboarding_completed. It must be a boolean.', 400));
        }
        updatePayload.onboarding_completed = onboarding_completed;
    }

    if (Object.keys(updatePayload).length === 0) {
        return res.json({ success: true, message: 'No settings to update.' });
    }

    const userSettings = await _getOrCreateUserSettings(req.user.uid);
    
    await nocodbService.updateRecord(USER_SETTINGS_TABLE_ID, { Id: userSettings.Id, ...updatePayload });

    res.json({ success: true, message: 'User settings updated successfully.' });
});

const recalculateMonthlyIncomeEstimate = catchAsync(async (req, res, next) => {
    const userId = req.user.uid;
    const { USER_SETTINGS } = env.NOCODB.TABLES;

    if (!USER_SETTINGS) {
        return next(new AppError('Backend is missing NocoDB configuration.', 500));
    }

    const newEstimate = await transactionService.calculateMonthlyIncome(userId);

    // Get user settings record and update it with the new estimate
    const userSettings = await _getOrCreateUserSettings(userId);
    await nocodbService.updateRecord(USER_SETTINGS, { Id: userSettings.Id, monthly_income_estimate: newEstimate });

    res.json({ newEstimate });
});

const requestPasswordReset = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new AppError('Email is required', 400));
    }

    try {
        // 1. Generate the standard Firebase Action Link
        const firebaseLink = await admin.auth().generatePasswordResetLink(email);
        
        // 2. Parse the link to get the 'oobCode' and other params
        const urlObj = new URL(firebaseLink);
        const params = new URLSearchParams(urlObj.search);
        
        // 3. Construct our custom frontend URL
        const resetLink = `${env.FRONTEND_URL}/reset-password?${params.toString()}`;
        
        await emailService.sendEmail(email, 'Reset your FinTrack Password', 'reset-password', {
            link: resetLink
        });

        res.json({ success: true, message: 'Password reset email sent.' });
    } catch (error) {
        console.error('Password reset error:', error);
        // We return success even if email fails to avoid enumerating users, 
        // unless it's a specific validation error we want to expose.
        if (error.code === 'auth/user-not-found') {
             return res.json({ success: true, message: 'If that email exists, we sent a link.' });
        }
        return next(new AppError('Failed to send reset email', 500));
    }
});

const sendWelcomeEmail = catchAsync(async (req, res, next) => {
    const email = req.user.email;
    if (!email) {
        return next(new AppError('User email not found', 400));
    }

    try {
        const dashboardLink = `${env.FRONTEND_URL}/dashboard`;

        await emailService.sendEmail(email, 'Welcome to FinTrack!', 'welcome-email', {
            dashboardLink
        });

        res.json({ success: true, message: 'Welcome email sent.' });
    } catch (error) {
        console.error('Welcome email error:', error);
        // Don't block the UI if this fails, just log it
        return res.json({ success: false, message: 'Failed to send welcome email.' });
    }
});

module.exports = {
    getFirebaseConfig,
    proxyProfileImage,
    getUserSettings,
    updateUserSettings,
    recalculateMonthlyIncomeEstimate,
    requestPasswordReset,
    sendWelcomeEmail,
};