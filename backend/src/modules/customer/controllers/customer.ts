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
			data: {
				...parseResult,
				created_by: req.user!.id // Auth middleware'den geliyor
			},
			include: {
				creator: {
					select: { id: true, name: true, email: true }
				}
			}
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
			orderBy: { created_at: 'desc' },
			include: {
				creator: {
					select: { id: true, name: true, email: true }
				}
			}
		});
		res.status(200).json(customers);
	}
	catch (error)
	{
		console.error(error);
		res.status(500).json({ error: 'Error occurred while fetching customers.' });
	}
};

export const updateCustomer = async (req: Request, res: Response) => {
	try
	{
		const { id } = req.params;
		
		if (!id) {
			return res.status(400).json({ error: 'Customer ID is required' });
		}

		const parseResult = customerSchema.partial().parse(req.body);
		const cleanData = cleanUndefinedFields(parseResult);

		const customer = await prisma.customer.update({
			where: { id: Number(id) },
			data: {
				...cleanData,
				updated_by: req.user!.id
			},
			include: {
				creator: { select: { id: true, name: true, email: true } },
				updater: { select: { id: true, name: true, email: true } }
			}
		});

		res.status(200).json(customer);
	}
	catch (error)
	{
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}

		if ((error as any).code === 'P2025') {
			return res.status(404).json({ error: 'Customer not found' });
		}

		console.error(error);
		res.status(500).json({ error: 'Error occurred while updating customer.' });
	}
};