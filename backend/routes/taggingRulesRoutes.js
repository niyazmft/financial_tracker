const express = require('express');
const taggingRulesController = require('../controllers/taggingRulesController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router
    .route('/')
    .get(authenticateToken, taggingRulesController.getRules)
    .post(authenticateToken, taggingRulesController.createRule);

router
    .route('/:id')
    .patch(authenticateToken, taggingRulesController.updateRule)
    .delete(authenticateToken, taggingRulesController.deleteRule);

module.exports = router;
