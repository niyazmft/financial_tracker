const logger = require('../config/logger');

exports.logError = (req, res, next) => {
  const { message, stack, url, timestamp } = req.body;

  logger.error('Frontend Error', {
    message: message,
    stack: stack,
    url: url,
    timestamp: timestamp,
    clientIp: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(204).send(); // Send a "No Content" response
};
