const express = require('express');
const router = express.Router();

const budgetRoutes = require('./budgetRoutes');
const cashFlowRoutes = require('./cashFlowRoutes');
const installmentRoutes = require('./installmentRoutes');
const nocodbRoutes = require('./nocodbRoutes');
const pageRoutes = require('./pageRoutes');
const reportRoutes = require('./reportRoutes');
const transactionRoutes = require('./transactionRoutes');
const userRoutes = require('./userRoutes');
const loggingController = require('../controllers/loggingController');
const taggingRulesRoutes = require('./taggingRulesRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const savingsGoalRoutes = require('./savingsGoalRoutes');
const anomalyRoutes = require('./anomalyRoutes');

router.use('/', pageRoutes);
router.use('/api', budgetRoutes);
router.use('/api', cashFlowRoutes);
router.use('/api/installments', installmentRoutes);
router.use('/api/nocodb', nocodbRoutes);
router.use('/api', reportRoutes);
router.use('/api/transactions', transactionRoutes);
router.use('/api', userRoutes);
router.use('/api/tagging-rules', taggingRulesRoutes);
router.use('/api/subscriptions', subscriptionRoutes);
router.use('/api/savings-goals', savingsGoalRoutes);
router.use('/api/anomalies', anomalyRoutes);
router.post('/api/log-error', loggingController.logError);

module.exports = router;