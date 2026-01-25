const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/salary/last-month', authenticateToken, reportController.getLastMonthSalary);
router.get('/spending/monthly-data', authenticateToken, reportController.getMonthlySpending);
router.get('/spending/categories', authenticateToken, reportController.getCategorySpending);
router.get('/salary/custom-range', authenticateToken, reportController.getCustomRangeSalary);

module.exports = router;
