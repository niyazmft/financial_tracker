const express = require('express');
const router = express.Router();
const installmentController = require('../controllers/installmentController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, installmentController.getInstallments);
router.patch('/', authenticateToken, installmentController.updateInstallment);
router.patch('/batch', authenticateToken, installmentController.batchUpdateInstallments);
router.delete('/:id', authenticateToken, installmentController.deleteInstallment);

module.exports = router;
