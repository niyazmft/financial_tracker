const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/firebase-config', userController.getFirebaseConfig);
router.get('/proxy/image', userController.proxyProfileImage); // Publicly accessible but domain-restricted
router.post('/request-password-reset', userController.requestPasswordReset); // Public
router.post('/send-welcome-email', authenticateToken, userController.sendWelcomeEmail); // New route
router.get('/user-settings', authenticateToken, userController.getUserSettings); // New route
router.put('/user-settings', authenticateToken, userController.updateUserSettings); // New route
router.get('/proxy/monthly-income-estimate/recalculate', authenticateToken, userController.recalculateMonthlyIncomeEstimate);

module.exports = router;