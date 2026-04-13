/**
 * Simple in-memory rate limiter middleware with cleanup to prevent memory leaks
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds (e.g., 15 * 60 * 1000 for 15 minutes)
 * @param {number} options.max - Maximum number of requests per window
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options) => {
  const { windowMs, max } = options;
  const rateLimitMap = new Map();

  // Periodically clean up expired entries to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now > data.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, windowMs);

  // Ensure the interval doesn't keep the process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const rateData = rateLimitMap.get(ip);

    // If window has passed, reset the counter
    if (now > rateData.resetTime) {
      rateData.count = 1;
      rateData.resetTime = now + windowMs;
      return next();
    }

    rateData.count++;
    if (rateData.count > max) {
      return res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later.'
      });
    }

    next();
  };
};

module.exports = createRateLimiter;
