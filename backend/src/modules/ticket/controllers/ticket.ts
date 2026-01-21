import type { Request, Response } from 'express';
import prisma from '../../../prisma.js';
import { z } from 'zod';

const ticketSchema = z.object({
	customerId: z.number().min(1, 'Customer ID is required'),
	issue_description: z.string().nullish().transform((val) => val ?? null),
	total_price: z.number().nullish().transform((val) => val ?? null),
	closed_at: z.coerce.date().nullish().transform((val) => val ?? null),
	products: z.array(z.object({
		productTypeId: z.number().min(1, 'Product Type ID is required'),
		shelfId: z.number().min(1, 'Shelf ID is required'),
		model: z.string().min(1, 'Model is required'),
		brand: z.string().min(1, 'Brand is required'),
		price: z.number().nullish().transform((val) => val ?? null),
		status: z.string().nullish().transform((val) => val ?? 'RECEIVED'),
		description: z.string().nullish().transform((val) => val ?? null),
		receivedDate: z.coerce.date().nullish().transform((val) => val ?? new Date()),
		deliveryDate: z.coerce.date().nullish().transform((val) => val ?? null)
	})).min(1, 'At least one product is required')
});

export const createTicket = async (req: Request, res: Response) => {
	try
	{
		const validateData = await ticketSchema.parseAsync(req.body);

		const ticket = await prisma.ticket.create({
			data:
			{
				customerId: Number(validateData.customerId),
				issue_description: validateData.issue_description,
				total_price: validateData.total_price,
				products: {
					create: validateData.products.map((product: any) => ({
						productTypeId: Number(product.productTypeId),
						shelfId: Number(product.shelfId),
						model: String(product.model),
						brand: String(product.brand),
						price: product.price,
						status: product.status,
						description: String(product.description),
						receivedDate: product.receivedDate,
						deliveryDate: product.deliveryDate
					}))
				}
			},
			include: {
				products: true,
				customer: true
			}
		});

		res.status(201).json(ticket);
	}
	catch (error)
	{
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		console.error(error);
		res.status(500).json({ error: 'Error occurred while creating ticket.' });
	}
};

export const getTickets = async (req: Request, res: Response) => {
	try
	{
		const tickets = await prisma.ticket.findMany({
			orderBy: { created_at: 'desc' },
			include: {
				customer: true,
				products: true
				
			}
		});
		
		res.status(200).json(tickets);
	}
	catch (error)
	{
		console.error(error);
		res.status(500).json({ error: 'Error occurred while fetching tickets.' });
	}
};

const closeTicketSchema = z.object({
	total_price: z.number().min(0, 'Total price must be at least 0')
});

export const closeTicket = async (req: Request, res: Response) => {
	try
	{
		const { id } = req.params;
		
		if (!id) {
			return res.status(400).json({ error: 'Ticket ID is required' });
		}

		const validateData = closeTicketSchema.parse(req.body);

		const updatedTicket = await prisma.ticket.update({
			where: { id: Number(id) },
			data: {
				total_price: validateData.total_price,
				closed_at: new Date(),
				ticketStatus: 'CLOSED'
			},
			include: {
				customer: true,
				products: true
			}
		});

		return res.status(200).json(updatedTicket);
	}
	catch (error)
	{
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}

		if ((error as any).code === 'P2025') {
			return res.status(404).json({ error: 'Ticket not found' });
		}

		console.error('Error closing ticket:', error);
		return res.status(500).json({ error: 'Error occurred while closing ticket.' });
	}
};