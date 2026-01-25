import express, { type Request, type Response } from 'express';
import cors from 'cors';
import customerRouter from './modules/customer/router.js';
import ticketRouter from './modules/ticket/router.js';
import settingsRouter from './modules/settings/router.js';
import productRouter from './modules/product/router.js';
import authRouter from './modules/auth/routers.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { requestLogger, errorLogger } from './middleware/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// JSON body parser with error handling
app.use(express.json({ 
  limit: '1mb',
  strict: true 
}));

// Handle JSON parsing errors
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON Parse Error:', {
      url: req.url,
      method: req.method,
      error: err.message,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      contentType: req.headers['content-type']
    });
    
    // Send response immediately for JSON parse errors
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'Request body contains malformed JSON'
    });
  }
  next(err);
});

app.use(requestLogger); // Log all requests

// Public routes (no auth required)
app.use('/api/auth', authRouter);

// Protected routes (auth required)
app.use('/api/customers', authMiddleware, customerRouter);
app.use('/api/tickets', authMiddleware, ticketRouter);
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/products', authMiddleware, productRouter);


app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Teknik Servis CRM API' });
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
		console.log('Mock data created successfully.');
	} 
	catch (error)
	{
		console.error('Error creating mock data:', error);	
	}


}

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// Global error handler
app.use(errorLogger);

// 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

MockDataCreate();