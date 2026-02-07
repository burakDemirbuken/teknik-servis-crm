import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import customerRouter from './modules/customer/router.js';
import ticketRouter from './modules/ticket/router.js';
import settingsRouter from './modules/settings/router.js';
import productRouter from './modules/product/router.js';
import authRouter from './modules/auth/routers.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { requestLogger, errorLogger } from './middleware/logger.js';
import whatsappRouter from './modules/whatsapp/router.js';
import reportRouter from './modules/report/router.js';
import logger from './lib/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── SECURITY ────────────────────────────────
// Helmet: security headers (XSS, clickjacking, MIME sniffing vs.)
app.use(helmet({
  contentSecurityPolicy: false, // API olduğu için CSP gereksiz
  crossOriginEmbedderPolicy: false,
}));

// Trust proxy (nginx arkasında çalışırken gerçek IP'yi al)
app.set('trust proxy', 1);

// ─── RATE LIMITING ───────────────────────────
// Genel rate limit: 1000 istek / 15 dakika
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.' },
  skip: (req) => req.path === '/health', // Health check hariç
});

// Auth rate limit: 30 deneme / 15 dakika (brute-force koruması)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla giriş denemesi, 15 dakika sonra tekrar deneyin.' },
});

// API genel rate limit: 10000 istek / 1 dakika (development - seed için)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API istek limiti aşıldı, lütfen biraz bekleyin.' },
});

// ─── CORS ────────────────────────────────────
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true // production: nginx ile aynı origin veya FRONTEND_URL
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ─── BODY PARSING & COMPRESSION ──────────────
app.use(compression());
app.use(express.json({ 
  limit: '1mb',
  strict: true 
}));

app.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON Parse Error:', {
      url: req.url,
      method: req.method,
      error: err.message,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      contentType: req.headers['content-type']
    });
    
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Request body contains malformed JSON'
    });
  }
  next(err);
});

app.use(requestLogger);

// ─── ROUTES ──────────────────────────────────
app.use('/api/auth', authLimiter, authRouter);

app.use('/api/customers', authMiddleware, customerRouter);
app.use('/api/tickets', authMiddleware, ticketRouter);
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/products', authMiddleware, productRouter);
app.use('/api/whatsapp', authMiddleware, whatsappRouter);
app.use('/api/reports', authMiddleware, reportRouter);


app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Demir Teknik Servis API' });
});


import prisma from './prisma.js';
async function MockDataCreate()
{
	try
	{
		
		await prisma.productType.createMany({
			data: [
				{ type: 'Telefon' },
				{ type: 'Tablet' },
				{ type: 'Laptop' },
				{ type: 'Diğer' }
			],
			skipDuplicates: true,
		});
		await prisma.shelf.createMany({
			data: [
				{
					zone: 'A',
					row: 1, 
				},
				{
					zone: 'A',
					row: 2, 
				},
				{
					zone: 'B',
					row: 1, 
				},
				{
					zone: 'B',
					row: 2, 
				}
			],
			skipDuplicates: true,
		});

		// Ensure virtual shelf exists for completed products
		await prisma.shelf.upsert({
			where: { zone_row: { zone: 'SANAL', row: 0 } },
			update: { isVirtual: true },
			create: { zone: 'SANAL', row: 0, isVirtual: true },
		});

		logger.info('Mock data created successfully.');
	} 
	catch (error)
	{
		logger.error('Error creating mock data:', error);	
	}
}

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Database connection check
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed:', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

app.use(errorLogger);

app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
});

MockDataCreate();