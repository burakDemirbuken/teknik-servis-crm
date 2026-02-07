import type { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    
    // HTTP access log
    logger.http('request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      user: req.user ? `${req.user.name} (${req.user.email})` : 'Anonymous',
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent']?.substring(0, 100),
    });

    // Yavaş query uyarısı (500ms+)
    if (duration > 500) {
      logger.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`, {
        method: req.method,
        url: req.originalUrl,
        duration,
      });
    }
    
    return originalSend.call(this, body);
  };

  next();
};

export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    next(err);
    return;
  }
  
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    type: err.name || 'Unknown',
    user: req.user ? `${req.user.name} (${req.user.email})` : 'Anonymous',
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    stack: err.stack,
    body: ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body
      ? JSON.stringify({ ...req.body, password: req.body.password ? '[REDACTED]' : undefined }).substring(0, 300)
      : undefined,
  });

  if (!res.headersSent) {
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({ 
      error: statusCode >= 500 ? 'Internal server error' : err.message || 'Request failed',
    });
  }
};

// Rate limit logger
export const rateLimitLogger = (req: Request, res: Response, next: NextFunction) => {
  if (res.statusCode === 429) {
    console.warn(`⚠️  RATE LIMIT: ${req.ip} - ${req.method} ${req.originalUrl}`);
  }
  next();
};