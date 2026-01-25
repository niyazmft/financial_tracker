const express = require('express');
const router = express.Router();
const cashFlowController = require('../controllers/cashFlowController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/proxy/cash-flow-warnings', authenticateToken, cashFlowController.getCashFlowWarnings);
router.get('/cash-flow-forecast', authenticateToken, cashFlowController.getCashFlowForecast);

module.exports = router;
