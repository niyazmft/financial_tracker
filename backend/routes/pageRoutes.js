const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.get('/', pageController.getDashboard);
router.get('/login', pageController.getLogin);
router.get('/dashboard', pageController.getDashboard);
router.get('/installment_plans', pageController.getInstallmentPlans);
router.get('/spending_analysis', pageController.getSpendingAnalysis);
router.get('/settings', pageController.getSettings);
router.get('/budget_manager', pageController.getBudgetManager);
router.get('/reports', pageController.getReports);
router.get('/transactions', pageController.getTransactions);
router.get('/subscriptions', pageController.getSubscriptions);


module.exports = router;
