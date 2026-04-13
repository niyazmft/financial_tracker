const logger = require('../config/logger');
const AppError = require('../utils/AppError');

exports.logError = (req, res, next) => {
  const { message, stack, url, timestamp } = req.body;

  // Input Validation
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return next(new AppError('Invalid or missing error message', 400));
  }

  if (stack && (typeof stack !== 'string' || stack.length > 5000)) {
    return next(new AppError('Invalid stack trace', 400));
  }

  if (url && (typeof url !== 'string' || url.length > 1000)) {
    return next(new AppError('Invalid URL', 400));
  }

  if (timestamp && (typeof timestamp !== 'string' || timestamp.length > 100)) {
    return next(new AppError('Invalid timestamp', 400));
  }

  logger.error('Frontend Error', {
    message: message,
    stack: stack,
    url: url,
    timestamp: timestamp,
    clientIp: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.uid : 'unauthenticated'
  });

  res.status(204).send(); // Send a "No Content" response
};
