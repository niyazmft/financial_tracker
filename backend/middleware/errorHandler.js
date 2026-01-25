const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const env = require('../config/env'); // Import env

const handleDevelopmentError = (err, res) => {
  logger.error(err.message, { stack: err.stack });
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const handleProductionError = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.warn(err.message);
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    logger.error('ERROR 💥', err);
    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (env.NODE_ENV === 'production') { // Use env.NODE_ENV
    let error = { ...err };
    // error.message = err.message; // Removed redundant assignment
    // Handle specific error types here in the future if needed
    handleProductionError(error, res);
  } else {
    handleDevelopmentError(err, res);
  }
};