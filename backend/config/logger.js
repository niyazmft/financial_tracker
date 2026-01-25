const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Determine log level from environment variable, default to 'info'
const level = process.env.LOG_LEVEL || 'info';

// Define different logging formats
const consoleFormat = winston.format.combine(
  winston.format.errors({ stack: true }), // Handle Error objects properly
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    if (info.stack) {
      return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.errors({ stack: true }), // Handle Error objects properly
  winston.format.timestamp(),
  winston.format.json()
);

// Define transports for development and production
const transports = {
  development: [
    new winston.transports.Console({
      format: consoleFormat
    }),
    new winston.transports.DailyRotateFile({
      filename: path.join(__dirname, '../logs/app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(__dirname, '../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    })
  ],
  production: [
    new winston.transports.Console({
      format: fileFormat
    }),
     new winston.transports.DailyRotateFile({
      filename: path.join(__dirname, '../logs/app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    }),
    new winston.transports.DailyRotateFile({
      level: 'error',
      filename: path.join(__dirname, '../logs/error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    })
  ]
};

// Create the logger instance
const logger = winston.createLogger({
  level: level,
  transports: process.env.NODE_ENV === 'production' ? transports.production : transports.development,
  exitOnError: false // Do not exit on handled exceptions
});

// Create a stream object with a 'write' function that will be used by morgan
logger.stream = {
  write: function(message, encoding) {
    // Use the 'info' level so the output will be picked up by both transports
    logger.info(message.trim());
  },
};

module.exports = logger;
