const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router
    .route('/')
    .get(authenticateToken, subscriptionController.getSubscriptions)
    .post(authenticateToken, subscriptionController.createSubscription);

router
    .route('/:id')
    .patch(authenticateToken, subscriptionController.updateSubscription)
    .delete(authenticateToken, subscriptionController.deleteSubscription);

module.exports = router;