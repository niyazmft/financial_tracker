const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/proxy/budgets', authenticateToken, budgetController.createBudget);
router.patch('/proxy/budgets/:id', authenticateToken, budgetController.updateBudget);
router.delete('/proxy/budgets/:id', authenticateToken, budgetController.deleteBudget);
router.get('/budgets/active', authenticateToken, budgetController.getActiveBudgets);

module.exports = router;
