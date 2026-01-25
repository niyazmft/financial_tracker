const express = require('express');
const anomalyController = require('../controllers/anomalyController');
const authMiddleware = require('../middleware/authMiddleware'); // Import the object

const router = express.Router();

router.use(authMiddleware.authenticateToken); // Use the function from the object

router.get('/', anomalyController.getAnomalies);

module.exports = router;
