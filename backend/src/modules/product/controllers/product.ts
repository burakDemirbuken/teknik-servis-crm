import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../prisma.js';
import cleanUndefinedFields from '../../utils/cleanUndefinedFields.js';

const productStatusEnum = z.enum([
    'RECEIVED',
    'IN_REPAIR',
    'WAITING_PARTS',
    'COMPLETED',
    'DELIVERED',
    'CANCELLED'
]);

const updateProductSchema = z.object({
    shelfId: z.coerce.number().min(1, "Invalid shelf ID").optional(),
    productTypeId: z.coerce.number().min(1, "Invalid product type ID").optional(),
    
    status: productStatusEnum.optional(),
    
    price: z.coerce.number().min(0, "Price must be at least 0").optional(),
    
    model: z.string().optional(),
    brand: z.string().optional(),
    description: z.string().optional(),
    
    receivedDate: z.coerce.date().optional(),
    deliveryDate: z.coerce.date().nullable().optional()
});

export const updateProduct = async (req: Request, res: Response) => {
    try
    {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ error: "Product ID is required in URL" });
        }

        const validateData = cleanUndefinedFields(updateProductSchema.parse(req.body));

        const updatedProduct = await prisma.product.update({
            where: { id: Number(id) },
            data: validateData
        });

        return res.status(200).json(updatedProduct);
    }
    catch (error)
    {
        if (error instanceof z.ZodError) {
            const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`);
            return res.status(400).json({ errors });
        }

        if ((error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Güncellenecek ürün bulunamadı.' });
        }

        console.error("Error updating product:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};