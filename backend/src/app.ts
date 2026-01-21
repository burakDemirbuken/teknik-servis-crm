import express, { type Request, type Response } from 'express';
import cors from 'cors';
import customerRoutes from './modules/customer/routers.js';
import ticketRouters from './modules/ticket/routers.js';
import settingsRouters from './modules/settings/routers.js';
import productRouters from './modules/product/routers.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/customers', customerRoutes);
app.use('/api/tickets', ticketRouters);
app.use('/api/settings', settingsRouters);
app.use('/api/products', productRouters);


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

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

MockDataCreate();