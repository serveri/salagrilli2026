import rateLimit from 'express-rate-limit'

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages — please slow down and try again in a minute.' },
})
