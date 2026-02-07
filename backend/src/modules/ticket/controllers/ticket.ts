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

		// Check if customer exists before creating ticket
		const customerExists = await prisma.customer.findUnique({
			where: { id: Number(validateData.customerId) }
		});

		if (!customerExists) {
			return res.status(400).json({ error: 'Customer not found' });
		}

		const ticket = await prisma.ticket.create({
			data:
			{
				customerId: Number(validateData.customerId),
				issue_description: validateData.issue_description,
				total_price: validateData.total_price,
				created_by: req.user!.id, // Kim oluşturdu
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

		// Prisma foreign key constraint error
		if ((error as any).code === 'P2003') {
			const meta = (error as any).meta;
			if (meta && meta.field_name === 'Ticket_customerId_fkey (index)') {
				return res.status(400).json({ error: 'Customer not found or invalid customer ID' });
			}
			return res.status(400).json({ error: 'Invalid reference in data' });
		}

		// Prisma record not found error
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ error: 'Referenced record not found' });
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
				products: {
					include: {
						productType: true,
						shelf: true,
					}
				}
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

const updateTicketSchema = z.object({
	issue_description: z.string().nullish().transform((val) => val ?? null),
	total_price: z.number().nullish().transform((val) => val ?? null),
	ticketStatus: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
});

export const updateTicket = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		if (!id) {
			return res.status(400).json({ error: 'Ticket ID is required' });
		}

		const validateData = updateTicketSchema.parse(req.body);

		// Build update data, only include provided fields
		const updateData: any = {};
		if (req.body.issue_description !== undefined) updateData.issue_description = validateData.issue_description;
		if (req.body.total_price !== undefined) updateData.total_price = validateData.total_price;
		if (req.body.ticketStatus !== undefined) updateData.ticketStatus = validateData.ticketStatus;
		updateData.updated_by = req.user!.id;

		const updatedTicket = await prisma.ticket.update({
			where: { id: Number(id) },
			data: updateData,
			include: {
				customer: true,
				products: {
					include: {
						productType: true,
						shelf: true,
					}
				}
			}
		});

		return res.status(200).json(updatedTicket);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ error: 'Ticket not found' });
		}
		console.error('Error updating ticket:', error);
		return res.status(500).json({ error: 'Error occurred while updating ticket.' });
	}
};

export const reopenTicket = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		if (!id) {
			return res.status(400).json({ error: 'Ticket ID is required' });
		}

		const ticket = await prisma.ticket.findUnique({ where: { id: Number(id) } });
		if (!ticket) {
			return res.status(404).json({ error: 'Ticket not found' });
		}
		if (ticket.ticketStatus === 'OPEN') {
			return res.status(400).json({ error: 'Ticket is already open' });
		}

		const updatedTicket = await prisma.ticket.update({
			where: { id: Number(id) },
			data: {
				ticketStatus: 'OPEN',
				closed_at: null,
				updated_by: req.user!.id,
			},
			include: {
				customer: true,
				products: {
					include: {
						productType: true,
						shelf: true,
					}
				}
			}
		});

		return res.status(200).json(updatedTicket);
	} catch (error) {
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ error: 'Ticket not found' });
		}
		console.error('Error reopening ticket:', error);
		return res.status(500).json({ error: 'Error occurred while reopening ticket.' });
	}
};

const addProductSchema = z.object({
	productTypeId: z.number().min(1, 'Product Type ID is required'),
	shelfId: z.number().min(1, 'Shelf ID is required'),
	model: z.string().min(1, 'Model is required'),
	brand: z.string().min(1, 'Brand is required'),
	price: z.number().nullish().transform((val) => val ?? null),
	description: z.string().nullish().transform((val) => val ?? null),
});

export const addProductToTicket = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const ticket = await prisma.ticket.findUnique({ where: { id: Number(id) } });
		if (!ticket) {
			return res.status(404).json({ error: 'Servis kaydı bulunamadı' });
		}
		if (ticket.ticketStatus === 'CANCELLED') {
			return res.status(400).json({ error: 'İptal edilmiş servise ürün eklenemez' });
		}

		const validateData = addProductSchema.parse(req.body);

		const product = await prisma.product.create({
			data: {
				ticketId: Number(id),
				productTypeId: validateData.productTypeId,
				shelfId: validateData.shelfId,
				model: validateData.model,
				brand: validateData.brand,
				price: validateData.price,
				description: validateData.description,
				status: 'RECEIVED',
				receivedDate: new Date(),
			},
			include: {
				productType: true,
				shelf: true,
			}
		});

		res.status(201).json(product);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		console.error('Error adding product to ticket:', error);
		res.status(500).json({ error: 'Ürün eklenirken hata oluştu' });
	}
};

const closeTicketSchema = z.object({
	total_price: z.number().min(0, 'Total price must be at least 0')
});

export const cancelTicket = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		if (!id) {
			return res.status(400).json({ error: 'Ticket ID is required' });
		}

		const ticket = await prisma.ticket.findUnique({ where: { id: Number(id) } });
		if (!ticket) {
			return res.status(404).json({ error: 'Servis kaydı bulunamadı' });
		}
		if (ticket.ticketStatus === 'CANCELLED') {
			return res.status(400).json({ error: 'Servis zaten iptal edilmiş' });
		}

		// Cancel ticket and all its products in a transaction
		const updatedTicket = await prisma.$transaction(async (tx) => {
			// Update all products to CANCELLED
			await tx.product.updateMany({
				where: { ticketId: Number(id) },
				data: { status: 'CANCELLED' }
			});

			// Update ticket status
			return tx.ticket.update({
				where: { id: Number(id) },
				data: {
					ticketStatus: 'CANCELLED',
					updated_by: req.user!.id,
				},
				include: {
					customer: true,
					products: {
						include: {
							productType: true,
							shelf: true,
						}
					}
				}
			});
		});

		return res.status(200).json(updatedTicket);
	} catch (error) {
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ error: 'Servis kaydı bulunamadı' });
		}
		console.error('Error cancelling ticket:', error);
		return res.status(500).json({ error: 'Servis iptal edilirken hata oluştu' });
	}
};

export const closeTicket = async (req: Request, res: Response) => {
	try
	{
		const { id } = req.params;
		
		if (!id) {
			return res.status(400).json({ error: 'Ticket ID is required' });
		}

		const validateData = closeTicketSchema.parse(req.body);

		// Check all products are DELIVERED before closing
		const nonDeliveredProducts = await prisma.product.count({
			where: {
				ticketId: Number(id),
				status: { notIn: ['DELIVERED', 'CANCELLED'] }
			}
		});

		if (nonDeliveredProducts > 0) {
			return res.status(400).json({
				error: `Servisi kapatmak için tüm ürünlerin teslim edilmesi gerekiyor. ${nonDeliveredProducts} ürün henüz teslim edilmedi.`
			});
		}

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

export const deleteTicket = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		if (!id) {
			return res.status(400).json({ error: 'Ticket ID is required' });
		}

		const ticket = await prisma.ticket.findUnique({ where: { id: Number(id) } });
		if (!ticket) {
			return res.status(404).json({ error: 'Servis kaydı bulunamadı' });
		}

		// Delete ticket and all its products in a transaction
		await prisma.$transaction(async (tx) => {
			await tx.product.deleteMany({ where: { ticketId: Number(id) } });
			await tx.ticket.delete({ where: { id: Number(id) } });
		});

		return res.status(200).json({ message: 'Servis kaydı silindi' });
	} catch (error) {
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ error: 'Servis kaydı bulunamadı' });
		}
		console.error('Error deleting ticket:', error);
		return res.status(500).json({ error: 'Servis silinirken hata oluştu' });
	}
};