const admin = require('../config/firebase');
const AppError = require('../utils/AppError'); // Import AppError for consistent error handling

// Helper function to verify Firebase ID token
async function _verifyToken(token) {
    try {
        return await admin.auth().verifyIdToken(token);
    } catch (error) {
        throw new AppError('Unauthorized: Invalid token', 401);
    }
}

async function authenticateToken(req, res, next) {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return next(new AppError('Unauthorized: Missing or invalid token', 401));
    }

    const token = authorization.split('Bearer ')[1];
    try {
        req.user = await _verifyToken(token); // Attach decoded token to req.user
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        return next(error); // Pass the AppError to the next error handling middleware
    }
}

module.exports = {
    authenticateToken,
};
