import express, { type Request, type Response } from 'express';
import customerRoutes from './routes/customerRouters.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use('/api/customers', customerRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Teknik Servis CRM API' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
