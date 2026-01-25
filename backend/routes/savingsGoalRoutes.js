const express = require('express');
const savingsGoalController = require('../controllers/savingsGoalController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken); // Protect all routes

router
    .route('/')
    .get(savingsGoalController.getGoals)
    .post(savingsGoalController.createGoal);

router
    .route('/:id')
    .patch(savingsGoalController.updateGoal)
    .delete(savingsGoalController.deleteGoal);

module.exports = router;
