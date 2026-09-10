const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const upload = require('../middleware/uploadMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const createRateLimiter = require('../middleware/rateLimiter');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Imports are heavy (file system access + bulk DB writes), so rate-limit them
// to prevent abuse/DoS (CodeQL js/missing-rate-limiting).
const importRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 import requests per window
});

router.get('/', transactionController.getTransactions);
router.get('/stats', transactionController.getTransactionStats);
router.get('/:id', transactionController.getTransactionById);
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);
router.post('/import-json', importRateLimiter, transactionController.importTransactionsJson);
router.post('/import', importRateLimiter, upload.single('csvFile'), transactionController.importTransactionsCsv); // codeql[js/missing-rate-limiting] custom createRateLimiter applied; CodeQL only recognizes express-rate-limit

module.exports = router;
