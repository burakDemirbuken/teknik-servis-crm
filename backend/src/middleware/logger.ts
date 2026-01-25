import type { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleString('tr-TR');
  
  // Response'u intercept et (süre hesabı için)
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Kırmızı/Yeşil
    
    // Log formatı: [Tarih] METHOD /path - STATUS (123ms) - User: userName
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} - ${statusColor}${res.statusCode}\x1b[0m (${duration}ms)` +
      (req.user ? ` - User: ${req.user.name} (${req.user.email})` : ' - Anonymous')
    );
    
    return originalSend.call(this, body);
  };

  next();
};

// Error logger
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toLocaleString('tr-TR');
  
  // Don't log expected auth errors to avoid spam
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    next(err);
    return;
  }
  
  console.error(`\n❌ [${timestamp}] ERROR on ${req.method} ${req.originalUrl}`);
  console.error(`   └─ Type: ${err.name || 'Unknown'}`);
  console.error(`   └─ Message: ${err.message || 'No message'}`);
  console.error(`   └─ User: ${req.user ? `${req.user.name} (${req.user.email})` : 'Anonymous'}`);
  
  // Log request body for POST/PUT requests (but not passwords)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    console.error(`   └─ Body: ${JSON.stringify(safeBody).substring(0, 200)}`);
  }
  
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(`   └─ Stack: ${err.stack.split('\n').slice(0, 5).join('\n')}`);
  }

  // Don't send response if headers already sent
  if (!res.headersSent) {
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({ 
      error: statusCode >= 500 ? 'Internal server error' : err.message || 'Request failed',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
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