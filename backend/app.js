const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const logger = require('./config/logger');
require('./config/env');
const routes = require('./routes');
const AppError = require('./utils/AppError');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware configuration
app.use(compression());
app.use(morgan('combined', { stream: logger.stream }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'src')));

// Routes
app.use('/', routes);

// Handle 404 or SPA Fallback
app.all('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  }
  // Serve index.html for non-API routes (SPA)
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
