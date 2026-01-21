import type { Request, Response } from 'express';
import prisma from '../../../prisma.js';
import { z } from 'zod';
import cleanUndefinedFields from '../../utils/cleanUndefinedFields.js';

const customerSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	surname: z.string().min(1, 'Surname is required'),
	phone: z.string().min(1, 'Phone is required'),
	address: z.string().nullish().transform((val) => val ?? null),
});

export const createCustomer = async (req: Request, res: Response) => {
	try
	{
		const parseResult = await customerSchema.parseAsync(req.body);

		const customer = await prisma.customer.create({
			data: parseResult,
		});
		

		res.status(201).json(customer);
	}
	catch (error)
	{
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}

		console.error(error);
		res.status(500).json({ error: 'Error occurred while creating customer.' });
	}
};

export const getCustomers = async (req: Request, res: Response) => {
	try
	{
		const customers = await prisma.customer.findMany({
			orderBy: { created_at: 'desc' }
		});
		res.status(200).json(customers);
	}
	catch (error)
	{
		console.error(error);
		res.status(500).json({ error: 'Error occurred while fetching customers.' });
	}
};