const express = require('express');
const router = express.Router();
const nocodbController = require('../controllers/nocodbController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/categories', authenticateToken, nocodbController.getCategories);
router.get('/categories/types', authenticateToken, nocodbController.getCategoryTypes);
router.post('/categories', authenticateToken, nocodbController.createCategory);
router.patch('/categories/:id', authenticateToken, nocodbController.updateCategory);
router.delete('/categories/:id', authenticateToken, nocodbController.deleteCategory);
router.post('/items', authenticateToken, nocodbController.createItem);
router.patch('/items/:id', authenticateToken, nocodbController.updateItem);
router.delete('/items/:id', authenticateToken, nocodbController.deleteItem);
router.post('/installments', authenticateToken, nocodbController.createInstallment);

module.exports = router;
