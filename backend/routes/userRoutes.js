const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const createRateLimiter = require('../middleware/rateLimiter');

const passwordResetRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // limit each IP to 5 requests per windowMs
});

router.get('/firebase-config', userController.getFirebaseConfig);
router.get('/proxy/image', userController.proxyProfileImage); // Publicly accessible but domain-restricted
router.post('/request-password-reset', passwordResetRateLimiter, userController.requestPasswordReset); // Public
router.post('/send-welcome-email', authenticateToken, userController.sendWelcomeEmail); // New route
router.get('/user-settings', authenticateToken, userController.getUserSettings); // New route
router.put('/user-settings', authenticateToken, userController.updateUserSettings); // New route
router.get('/proxy/monthly-income-estimate/recalculate', authenticateToken, userController.recalculateMonthlyIncomeEstimate);

module.exports = router;