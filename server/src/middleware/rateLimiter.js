import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.',
    status: 429,
  },
});

export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit heavier operations (inspect repo, AI scan)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Analysis rate limit reached. Please wait a few moments before scanning again.',
    status: 429,
  },
});
